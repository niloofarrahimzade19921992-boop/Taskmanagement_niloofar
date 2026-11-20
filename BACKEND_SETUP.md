# Project Management — backend prototype

The existing GitHub Pages website is still a browser-only demo. This repository now also contains an **ASP.NET Core 8 / PostgreSQL API foundation**. The API is **not deployed** and the website is **not yet connected to it**. Do not use the current GitHub Pages site for real organizational data.

## Local startup (Docker Desktop required)

1. Copy `.env.example` to `.env` (do not commit `.env`).
2. Replace all placeholder secrets with long random values. `JWT_KEY` must be at least 32 UTF-8 bytes; `ADMIN_PASSWORD` must be at least 12 characters.
3. Run `docker compose up --build -d`.
4. Check `http://localhost:8080/api/health` and expect `{"status":"ok"}`.
5. POST JSON `{"username":"admin","password":"<your password>"}` to `http://localhost:8080/api/auth/login` to receive a JWT.
6. For all other `/api` routes send header `Authorization: Bearer <token>`.

## API routes

- POST /api/auth/login
- GET /api/projects
- GET /api/projects/{id}
- POST /api/projects
- PUT /api/projects/{id}
- PUT /api/projects/{id}/charter
- POST /api/projects/{id}/phases
- POST /api/projects/{id}/submit
- POST /api/projects/{id}/decision (Manager/Admin)
- POST /api/projects/{id}/publish (Manager/Admin)
- GET /api/users (Admin)
- POST /api/users (Admin)

## Before production

- Connect the front-end to these endpoints and remove demo/localStorage writes.
- Deploy HTTPS and same-origin reverse proxy; API currently binds only to localhost.
- Replace `EnsureCreated` with managed EF migrations.
- Add automated tests, database backups, auditing, stronger per-project authorization, brute-force protection and a secure admin provisioning procedure.
- Verify the build and end-to-end behavior in an environment with Docker/.NET. No build or runtime test has been performed as part of this commit.

The API deliberately does not expose any task-management routes.
