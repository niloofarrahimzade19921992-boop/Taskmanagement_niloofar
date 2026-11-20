using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);
var connection = builder.Configuration.GetConnectionString("Default") ?? throw new InvalidOperationException("ConnectionStrings:Default is required");
var jwtKey = builder.Configuration["JWT_KEY"] ?? throw new InvalidOperationException("JWT_KEY must be set");
if (Encoding.UTF8.GetByteCount(jwtKey) < 32) throw new InvalidOperationException("JWT_KEY must be at least 32 bytes");
builder.Services.AddDbContext<AppDb>(o => o.UseNpgsql(connection));
builder.Services.AddScoped<IPasswordHasher<AppUser>, PasswordHasher<AppUser>>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o => {
    o.TokenValidationParameters = new TokenValidationParameters {
        ValidateIssuer = true, ValidIssuer = "ProjectApi",
        ValidateAudience = true, ValidAudience = "ProjectClient",
        ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateLifetime = true, ClockSkew = TimeSpan.FromMinutes(1)
    };
});
builder.Services.AddAuthorization();
var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));
app.MapPost("/api/auth/login", async (LoginRequest req, AppDb db, IPasswordHasher<AppUser> hasher) => {
    var user = await db.Users.SingleOrDefaultAsync(x => x.Username == req.Username && x.Active);
    if (user == null || hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password) == PasswordVerificationResult.Failed)
        return Results.Unauthorized();
    var claims = new[] { new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), new Claim(ClaimTypes.Name, user.Username), new Claim(ClaimTypes.Role, user.Role) };
    var token = new JwtSecurityToken("ProjectApi", "ProjectClient", claims, expires: DateTime.UtcNow.AddHours(8),
        signingCredentials: new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)), SecurityAlgorithms.HmacSha256));
    return Results.Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token), user = user.Username, role = user.Role });
});
var api = app.MapGroup("/api").RequireAuthorization();
api.MapGet("/projects", async (AppDb db) => await db.Projects.AsNoTracking().OrderByDescending(x => x.Id).ToListAsync());
api.MapGet("/projects/{id:int}", async (int id, AppDb db) => await db.Projects.AsNoTracking().Include(x => x.Phases).SingleOrDefaultAsync(x => x.Id == id) is { } p ? Results.Ok(p) : Results.NotFound());
api.MapPost("/projects", async (ProjectInput input, AppDb db, ClaimsPrincipal user) => {
    if (string.IsNullOrWhiteSpace(input.Name) || input.EndDate < input.StartDate) return Results.BadRequest("Invalid project fields");
    var p = new Project { Name = input.Name.Trim(), Manager = input.Manager ?? "", Description = input.Description ?? "", StartDate = input.StartDate, EndDate = input.EndDate, CreatedBy = user.Identity?.Name ?? "" };
    db.Projects.Add(p); await db.SaveChangesAsync(); return Results.Created($"/api/projects/{p.Id}", p);
});
api.MapPut("/projects/{id:int}", async (int id, ProjectInput input, AppDb db) => {
    var p = await db.Projects.FindAsync(id);
    if (p == null) return Results.NotFound();
    if (p.Status != "draft" && p.Status != "rejected") return Results.Conflict("Only draft or rejected projects can be edited");
    if (string.IsNullOrWhiteSpace(input.Name) || input.EndDate < input.StartDate) return Results.BadRequest();
    p.Name = input.Name.Trim(); p.Manager = input.Manager ?? ""; p.Description = input.Description ?? ""; p.StartDate = input.StartDate; p.EndDate = input.EndDate;
    await db.SaveChangesAsync(); return Results.Ok(p);
});
api.MapPut("/projects/{id:int}/charter", async (int id, CharterInput input, AppDb db) => {
    var p = await db.Projects.FindAsync(id);
    if (p == null) return Results.NotFound();
    if (p.Status != "draft" && p.Status != "rejected") return Results.Conflict();
    p.Objective = input.Objective ?? ""; p.Scope = input.Scope ?? ""; p.Deliverables = input.Deliverables ?? ""; p.Stakeholders = input.Stakeholders ?? ""; p.Approver = input.Approver ?? ""; p.Status = "draft";
    await db.SaveChangesAsync(); return Results.Ok(p);
});
api.MapPost("/projects/{id:int}/phases", async (int id, PhaseInput input, AppDb db) => {
    var p = await db.Projects.FindAsync(id);
    if (p == null) return Results.NotFound();
    if (p.Status == "published") return Results.Conflict("Published project cannot be changed");
    if (string.IsNullOrWhiteSpace(input.Title) || input.End < input.Start) return Results.BadRequest();
    var phase = new Phase { ProjectId = id, Title = input.Title.Trim(), Start = input.Start, End = input.End, Progress = Math.Clamp(input.Progress, 0, 100) };
    db.Phases.Add(phase); await db.SaveChangesAsync(); return Results.Created($"/api/projects/{id}", phase);
});
api.MapPost("/projects/{id:int}/submit", async (int id, AppDb db) => {
    var p = await db.Projects.FindAsync(id);
    if (p == null) return Results.NotFound();
    if (p.Status != "draft" && p.Status != "rejected") return Results.Conflict();
    if (string.IsNullOrWhiteSpace(p.Objective)) return Results.BadRequest("Project charter is required");
    p.Status = "pending"; await db.SaveChangesAsync(); return Results.Ok(p);
});
api.MapPost("/projects/{id:int}/decision", async (int id, DecisionInput input, AppDb db, ClaimsPrincipal user) => {
    if (!user.IsInRole("Admin") && !user.IsInRole("Manager")) return Results.Forbid();
    var p = await db.Projects.FindAsync(id);
    if (p == null) return Results.NotFound();
    if (p.Status != "pending") return Results.Conflict();
    if (input.Decision != "approved" && input.Decision != "rejected") return Results.BadRequest();
    p.Status = input.Decision; p.DecidedBy = user.Identity?.Name; p.DecidedAt = DateTime.UtcNow;
    await db.SaveChangesAsync(); return Results.Ok(p);
});
api.MapPost("/projects/{id:int}/publish", async (int id, AppDb db, ClaimsPrincipal user) => {
    if (!user.IsInRole("Admin") && !user.IsInRole("Manager")) return Results.Forbid();
    var p = await db.Projects.FindAsync(id);
    if (p == null) return Results.NotFound();
    if (p.Status != "approved") return Results.Conflict();
    p.Status = "published"; await db.SaveChangesAsync(); return Results.Ok(p);
});
api.MapGet("/users", async (AppDb db, ClaimsPrincipal user) => {
    if (!user.IsInRole("Admin")) return Results.Forbid();
    return Results.Ok(await db.Users.AsNoTracking().Select(x => new { x.Id, x.Username, x.Role, x.Active }).ToListAsync());
});
api.MapPost("/users", async (NewUser input, AppDb db, IPasswordHasher<AppUser> hasher, ClaimsPrincipal user) => {
    if (!user.IsInRole("Admin")) return Results.Forbid();
    if (input.Password.Length < 12 || !new[] { "Admin", "Manager", "User" }.Contains(input.Role) || string.IsNullOrWhiteSpace(input.Username)) return Results.BadRequest();
    if (await db.Users.AnyAsync(x => x.Username == input.Username)) return Results.Conflict();
    var u = new AppUser { Username = input.Username.Trim(), Role = input.Role };
    u.PasswordHash = hasher.HashPassword(u, input.Password);
    db.Users.Add(u); await db.SaveChangesAsync(); return Results.Created($"/api/users/{u.Id}", new { u.Id, u.Username, u.Role });
});
using (var scope = app.Services.CreateScope()) {
    var db = scope.ServiceProvider.GetRequiredService<AppDb>();
    await db.Database.EnsureCreatedAsync(); // Initial prototype only: use migrations before production schema changes.
    if (!await db.Users.AnyAsync()) {
        var username = builder.Configuration["ADMIN_USERNAME"];
        var password = builder.Configuration["ADMIN_PASSWORD"];
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password) || password.Length < 12)
            throw new InvalidOperationException("ADMIN_USERNAME and ADMIN_PASSWORD (12+ chars) are required on first run");
        var u = new AppUser { Username = username, Role = "Admin" };
        u.PasswordHash = scope.ServiceProvider.GetRequiredService<IPasswordHasher<AppUser>>().HashPassword(u, password);
        db.Users.Add(u); await db.SaveChangesAsync();
    }
}
app.Run();
record LoginRequest(string Username, string Password);
record ProjectInput(string Name, string? Manager, string? Description, DateOnly StartDate, DateOnly EndDate);
record CharterInput(string? Objective, string? Scope, string? Deliverables, string? Stakeholders, string? Approver);
record PhaseInput(string Title, DateOnly Start, DateOnly End, int Progress);
record DecisionInput(string Decision);
record NewUser(string Username, string Password, string Role);
class AppDb(DbContextOptions<AppDb> options) : DbContext(options) {
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Phase> Phases => Set<Phase>();
    public DbSet<AppUser> Users => Set<AppUser>();
}
class Project {
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Manager { get; set; } = "";
    public string Description { get; set; } = "";
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string CreatedBy { get; set; } = "";
    public string Objective { get; set; } = "";
    public string Scope { get; set; } = "";
    public string Deliverables { get; set; } = "";
    public string Stakeholders { get; set; } = "";
    public string Approver { get; set; } = "";
    public string Status { get; set; } = "draft";
    public string? DecidedBy { get; set; }
    public DateTime? DecidedAt { get; set; }
    public List<Phase> Phases { get; set; } = new();
}
class Phase {
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public Project? Project { get; set; }
    public string Title { get; set; } = "";
    public DateOnly Start { get; set; }
    public DateOnly End { get; set; }
    public int Progress { get; set; }
}
class AppUser {
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Role { get; set; } = "User";
    public bool Active { get; set; } = true;
}