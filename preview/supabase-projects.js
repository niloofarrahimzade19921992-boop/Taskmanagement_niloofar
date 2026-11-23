(()=>{
"use strict";
const sb=window.supabase.createClient("https://xgrtcsudpqcznhlkberz.supabase.co","sb_publishable_kyEmcxiKYeNFgnPTBqnjqw_BxrCP7hu");
let tasks=[],projects=[],archivedProjects=[],phases=[],profile=null,user=null,selected=null,permissionOverrides={};let recoveryMode=false;let dashboardStatusFilter="all";
const $=s=>document.querySelector(s),safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const faDigits=s=>String(s??"").replace(/[۰-۹]/g,x=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(x))).replace(/[٠-٩]/g,x=>String("٠١٢٣٤٥٦٧٨٩".indexOf(x)));
const fmt=new Intl.DateTimeFormat("en-US-u-ca-persian",{year:"numeric",month:"2-digit",day:"2-digit",timeZone:"UTC"});
function jalaliParts(date){const o={};for(const p of fmt.formatToParts(date))if(["year","month","day"].includes(p.type))o[p.type]=Number(p.value);return o}
function displayDate(iso){if(!iso)return "—";const d=new Date(iso+"T12:00:00Z");if(isNaN(d))return safe(iso);const p=jalaliParts(d);return p.year+"/"+String(p.month).padStart(2,"0")+"/"+String(p.day).padStart(2,"0")}
function gregorianDate(input){
 const raw=faDigits(String(input??"")).replace(/[\u200c\u200e\u200f\u202a-\u202e\u2066-\u2069\u00a0]/g,"").trim();
 const normalized=raw.replace(/[\\\-.،٫／⁄]/g,"/").replace(/\s*\/\s*/g,"/");
 const m=/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(normalized);
 if(!m)throw Error("فرمت تاریخ نامعتبر است. تاریخ را از تقویم شمسی انتخاب کنید (مثلاً ۱۴۰۵/۰۸/۲۹).");
 const [y,mo,da]=m.slice(1).map(Number);
 if(y<1200||y>1600||mo<1||mo>12||da<1||da>(mo<=6?31:mo<=11?30:30))throw Error("تاریخ شمسی واردشده معتبر نیست.");
 const start=Date.UTC(y+620,0,1);
 for(let i=0;i<740;i++){const d=new Date(start+i*86400000),p=jalaliParts(d);if(p.year===y&&p.month===mo&&p.day===da)return d.toISOString().slice(0,10)}
 throw Error("تاریخ انتخاب‌شده در تقویم شمسی معتبر نیست.");
}
const status={draft:"پیش‌نویس",pending:"در انتظار تأیید",approved:"تأییدشده",rejected:"برگشت‌خورده",published:"منتشرشده"};
const current=()=>projects.find(p=>String(p.id)===String(selected));
const editable=p=>p&&["draft","rejected"].includes(p.workflow_status)&&canEdit();
const permissionLabels={home:"صفحه اصلی",center:"مرکز پروژه",create:"ایجاد پروژه",charter:"منشور پروژه",schedule:"زمان‌بندی",tasks:"کارتابل وظایف",approvals:"کارتابل تأییدات",publish:"انتشار پروژه",list:"فهرست پروژه‌ها",trash:"پروژه‌های حذف‌شده",users:"مدیریت کاربران"};
const defaultPermission=k=>["home","center","charter","schedule","list","tasks"].includes(k)||(k==="create"&&profile?.role==="support");
const hasPermission=k=>!!(user&&profile?.is_approved&&(profile.is_admin||(k!=="users"&&(Object.hasOwn(permissionOverrides,k)?permissionOverrides[k]:defaultPermission(k)))));
const canEdit=()=>profile?.is_approved&&(profile.is_admin||profile.role==="support");
const canApprove=()=>profile?.is_approved&&profile.is_admin;
const canDecide=()=>canEdit()&&hasPermission("approvals");
const canPublish=()=>canEdit()&&hasPermission("publish");
function fail(e){const message=e?.message||String(e);const auth=$("#authScreen");if(auth&&!auth.hidden){const status=$("#authMessage");if(status)status.textContent=/invalid login credentials/i.test(message)?"ایمیل یا رمز عبور صحیح نیست. در صورت فراموشی رمز، از بازیابی رمز عبور استفاده کنید.":/email not confirmed/i.test(message)?"ایمیل حساب هنوز تأیید نشده است.":/failed to fetch|network/i.test(message)?"ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.":"ورود ناموفق بود: "+message;return}alert("خطا: "+message)}
async function run(promise){const {data,error}=await promise;if(error)throw error;return data}
async function load(){
if(!user){tasks=[];projects=[];archivedProjects=[];phases=[];profile=null;permissionOverrides={};render();return}
profile=await run(sb.from("user_profiles").select("id,full_name,role,is_approved,is_admin").eq("id",user.id).maybeSingle());
if(!profile?.is_approved){tasks=[];projects=[];archivedProjects=[];phases=[];permissionOverrides={};render();return}
const permResult=await sb.from("user_permissions").select("permission_key,allowed").eq("user_id",user.id);if(permResult.error)throw permResult.error;
permissionOverrides=Object.fromEntries((permResult.data||[]).map(p=>[p.permission_key,p.allowed]));
const allProjects=await run(sb.from("projects").select("*").order("id",{ascending:false}));
projects=allProjects.filter(p=>!p.deleted_at);
archivedProjects=hasPermission("trash")?allProjects.filter(p=>!!p.deleted_at):[];
phases=await run(sb.from("project_phases").select("*"));const taskResponse=await sb.from("tasks").select("*").order("id",{ascending:false});tasks=taskResponse.data||[];if(taskResponse.error){console.warn("Tasks could not be loaded",taskResponse.error.message);const taskNotice=$("#tasksStatus");if(taskNotice)taskNotice.textContent="دریافت وظایف ناموفق بود: "+taskResponse.error.message;}
render();
if(document.querySelector(".page#users.active"))refreshAdminUsers();
}
function show(page){if(!user||!profile?.is_approved){document.getElementById("authScreen").hidden=false;return}if(!hasPermission(page))page=Object.keys(permissionLabels).find(hasPermission)||"home";document.querySelectorAll(".page").forEach(e=>e.classList.toggle("active",e.id===page));document.querySelectorAll(".nav").forEach(e=>e.classList.toggle("active",e.dataset.page===page));render();if(page==="users")refreshAdminUsers();window.scrollTo(0,0)}
function render(){
if(!projects.some(p=>String(p.id)===String(selected)))selected=projects[0]?.id??null;
const p=current(),st=p?.workflow_status||"draft";
const authorized=!!(!recoveryMode&&user&&profile?.is_approved);$("#userLabel").textContent=authorized?(profile.full_name?.trim()||user.user_metadata?.full_name?.trim()||"کاربر سامانه"):"";$("#adminNav").style.display=canApprove()?"block":"none";document.querySelectorAll("[data-page],[data-jump]").forEach(el=>{const key=el.dataset.page||el.dataset.jump;el.hidden=!hasPermission(key);el.style.display=hasPermission(key)?"":"none"});document.querySelectorAll(".page.active").forEach(el=>{if(!hasPermission(el.id))el.classList.remove("active")});if(authorized&&!document.querySelector(".page.active")){const first=Object.keys(permissionLabels).find(hasPermission);if(first)$("#"+first)?.classList.add("active")}$("#headerLogout").style.display=authorized?"inline-block":"none";$("#headerLogin").style.display=authorized?"none":"inline-block";$("#authScreen").hidden=authorized;document.querySelector(".layout").style.visibility=authorized?"visible":"hidden";document.querySelector("header").style.visibility=authorized?"visible":"hidden";if(user&&!authorized&&!recoveryMode)$("#authMessage").textContent="حساب شما هنوز تأیید نشده است.";else if(!user&&!recoveryMode)$("#authMessage").textContent="";if(!authorized){document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id==="home"));document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page==="home"))}
$("#selectedProject").innerHTML=projects.map(x=>'<option value="'+x.id+'">'+safe(x.name)+'</option>').join("");
if(p)$("#selectedProject").value=String(p.id);
$("#stats").innerHTML=[["کل پروژه‌ها",projects.length,"all"],["منتشرشده",projects.filter(x=>x.workflow_status==="published").length,"published"],["در انتظار تأیید",projects.filter(x=>x.workflow_status==="pending").length,"pending"],["پیش‌نویس",projects.filter(x=>x.workflow_status==="draft").length,"draft"]].map(([a,b,filter])=>'<button type="button" class="metric" data-dashboard-filter="'+filter+'" aria-label="نمایش '+a+'" style="width:100%;text-align:inherit;cursor:pointer;font:inherit"><span>'+a+'</span><strong>'+b+'</strong></button>').join("");
const recent=$("#recentProjects");if(recent)recent.innerHTML=projects.slice(0,5).map(x=>'<tr><td>'+safe(x.name)+'</td><td><span class="badge">'+safe(status[x.workflow_status]||x.workflow_status)+'</span></td><td>'+safe(x.manager||"—")+'</td><td>'+displayDate(x.start_date)+'</td><td><button data-open="'+x.id+'">مشاهده</button></td></tr>').join("")||'<tr><td colspan="5">هنوز پروژه‌ای ثبت نشده است.</td></tr>';const total=projects.length;const breakdown=[["منتشرشده",projects.filter(x=>x.workflow_status==="published").length,"#28734f"],["در انتظار تأیید",projects.filter(x=>x.workflow_status==="pending").length,"#d6a83a"],["در حال اجرا",projects.filter(x=>["draft","approved"].includes(x.workflow_status)).length,"#4c876e"],["برگشت‌خورده",projects.filter(x=>x.workflow_status==="rejected").length,"#c4654c"]];$("#statusTotal").textContent=total.toLocaleString("fa-IR");$("#statusLegend").innerHTML=breakdown.map(([name,count,color])=>'<div><span class="status-dot" style="background:'+color+'"></span>'+name+': '+count.toLocaleString("fa-IR")+'</div>').join("");let angle=0;const segments=breakdown.map(([name,count,color])=>{const from=angle;angle+=total?count/total*360:0;return color+" "+from+"deg "+angle+"deg"});$("#statusRing").style.background=total?"conic-gradient("+segments.join(",")+")":"#e5e0d9";const ownerSearch=$("#ownerSearch")?.value?.trim().toLocaleLowerCase("fa")||"";const centerRows=document.querySelector("#centerProjectRows");if(centerRows)centerRows.innerHTML=projects.filter(x=>(dashboardStatusFilter==="all"||x.workflow_status===dashboardStatusFilter)&&String(x.sponsor||"").toLowerCase().includes(ownerSearch)).map(x=>'<tr><td>'+safe(x.name)+'</td><td>'+safe(x.sponsor||"—")+'</td><td>'+safe(x.manager||"—")+'</td><td>'+displayDate(x.start_date)+'</td><td>'+displayDate(x.end_date)+'</td><td>'+safe(status[x.workflow_status]||"—")+'</td><td><button data-open="'+x.id+'">مشاهده</button></td></tr>').join("")||'<tr><td colspan="7">پروژه‌ای یافت نشد.</td></tr>';$("#projectDetails").innerHTML=p?'<h3>'+safe(p.name)+'</h3><p>متولی: '+safe(p.sponsor||"—")+'; مدیر: '+safe(p.manager||"—")+'</p><p>شرح: '+safe(p.description||"—")+'</p><p>شروع: '+displayDate(p.start_date)+' | پایان: '+displayDate(p.end_date)+'</p><span class="badge">'+status[st]+'</span><div class="actions"><button class="primary" data-jump="charter">منشور</button><button class="secondary" data-jump="schedule">گانت</button><button class="secondary" data-jump="tasks">وظایف پروژه</button><button class="secondary" data-jump="publish">انتشار</button></div>':"<p>پروژه‌ای وجود ندارد یا هنوز وارد نشده‌اید.</p>";
const activityRows=$("#scheduleActivityRows");if(activityRows){const canChange=!!(p&&editable(p)&&hasPermission("schedule"));$("#scheduleActivityForm").hidden=!canChange;activityRows.innerHTML=(p?phases.filter(x=>Number(x.project_id)===Number(p.id)):[]).map(x=>{const days=ganttUtcDay(x.end_date)-ganttUtcDay(x.start_date)+1;const cell=v=>v===null||v===undefined||v===""?"—":safe(v);return '<tr><td>'+safe(x.title)+'</td><td>'+(Number.isFinite(days)?days.toLocaleString("fa-IR")+" روز":"—")+'</td><td>'+displayDate(x.start_date)+'</td><td>'+displayDate(x.end_date)+'</td><td>'+cell(x.deviation)+'</td><td>'+cell(x.progress)+'٪</td><td>'+cell(x.weight)+'</td><td>'+cell(x.planned)+'</td><td>'+cell(x.actual)+'</td><td>'+cell(x.supplementary)+'</td><td>'+cell(x.approver)+'</td><td>'+(canChange?'<button type="button" data-edit-schedule="'+x.id+'">ویرایش</button>':"—")+'</td></tr>'}).join("")||'<tr><td colspan="12">هنوز فعالیتی ثبت نشده است.</td></tr>';} const phaseRows=$("#centerPhaseRows");if(phaseRows)phaseRows.innerHTML=(p?phases.filter(x=>Number(x.project_id)===Number(p.id)):[]).map(x=>{const duration=ganttUtcDay(x.end_date)-ganttUtcDay(x.start_date)+1;return '<tr><td>'+safe(x.title)+'</td><td>'+displayDate(x.start_date)+'</td><td>'+displayDate(x.end_date)+'</td><td>'+(Number.isFinite(duration)?duration.toLocaleString("fa-IR")+" روز":"—")+'</td><td>'+Number(x.progress||0).toLocaleString("fa-IR")+'٪</td></tr>'}).join("")||'<tr><td colspan="5">هنوز مرحله‌ای ثبت نشده است.</td></tr>';const cf=$("#charterForm");["objective","scope","deliverables","stakeholders","approver","business_justification","success_criteria","exclusions","assumptions","constraints_text","risks","estimated_budget","budget_currency","sponsor"].forEach(k=>{if(cf.elements[k])cf.elements[k].value=p?.[k]??(k==="budget_currency"?"IRR":"")});
$("#charterProjectName").textContent=p?.name||"پروژه‌ای انتخاب نشده";
$("#charterProjectManager").textContent=p?.manager||"ثبت نشده";
$("#charterProjectDates").textContent=p?(displayDate(p.start_date)+" تا "+displayDate(p.end_date)):"—";
$("#charterLastUpdated").textContent=p?.charter_updated_at?new Date(p.charter_updated_at).toLocaleDateString("fa-IR"):"ثبت نشده";
$("#charterStatusBadge").textContent=p?(status[p.workflow_status]||"نامشخص"):"—";
$("#charterPrint").disabled=!p;
$("#trashList").innerHTML=canApprove()?(archivedProjects.map(x=>'<tr><td>'+safe(x.name)+'</td><td>'+safe(new Date(x.deleted_at).toLocaleDateString("fa-IR"))+'</td><td><button data-restore-project="'+x.id+'">بازیابی</button></td></tr>').join("")||'<tr><td colspan="3">پروژه حذف‌شده‌ای وجود ندارد.</td></tr>'):'<tr><td colspan="3">فقط مدیر سامانه دسترسی دارد.</td></tr>';
$("#projectList").innerHTML=projects.filter(x=>dashboardStatusFilter==="all"||x.workflow_status===dashboardStatusFilter).map(x=>'<tr><td>'+safe(x.name)+'</td><td>'+safe(x.manager||"—")+'</td><td>'+displayDate(x.start_date)+'</td><td>'+displayDate(x.end_date)+'</td><td><span class="badge">'+status[x.workflow_status]+'</span></td><td><button data-open="'+x.id+'">مشاهده</button>'+(canApprove()?'<button class="danger" type="button" data-archive-project="'+x.id+'" style="margin-inline-start:8px">حذف</button>':'')+'</td></tr>').join("")||'<tr><td colspan="6">پروژه‌ای وجود ندارد.</td></tr>';
$("#approvalList").innerHTML=projects.filter(x=>x.workflow_status==="pending").map(x=>'<div class="panel"><strong>'+safe(x.name)+'</strong><p>تأییدکننده: '+safe(x.approver||"مشخص نشده")+'</p>'+(canDecide()?'<div class="actions"><button class="primary" data-decision="approved" data-id="'+x.id+'">تأیید</button><button class="danger" data-decision="rejected" data-id="'+x.id+'">برگشت</button></div>':"<p>فقط مدیر می‌تواند تصمیم بگیرد.</p>")+'</div>').join("")||"<p>پروژه‌ای در انتظار تأیید نیست.</p>";
$("#publishDetails").innerHTML=p?'<strong>'+safe(p.name)+'</strong><p>وضعیت: '+status[st]+'</p>':"پروژه‌ای انتخاب نشده است.";
$("#projectPermissionNotice").style.display=canEdit()?"none":"block";
$("#requestApproval").disabled=!editable(p);
$("#publishProject").hidden=!canPublish();$("#publishProject").disabled=!(canPublish()&&st==="approved");
document.querySelectorAll("#charterForm button,#phaseForm button,#projectForm button").forEach(b=>{const key=b.closest("#projectForm")?"create":b.closest("#phaseForm")?"schedule":"charter";b.hidden=!(canEdit()&&hasPermission(key));b.disabled=!canEdit()||!hasPermission(key)||(key==="create"?false:!editable(p))});
$("#usersList").textContent=profile?(profile.is_approved?"حساب شما تأیید شده است.":"حساب شما هنوز توسط مدیر تأیید نشده است."):"برای مشاهده پروژه‌ها وارد شوید.";
renderGantt(p?phases.filter(x=>x.project_id===p.id):[]);renderTaskInbox(p);
}

function renderTaskInbox(p){
 const rows=$("#tasksRows");if(!rows)return;
 $("#tasksProjectLabel").textContent=p?"وظایف پروژه: "+p.name:"ابتدا یک پروژه انتخاب کنید";
 const editableTasks=!!(p&&editable(p)&&hasPermission("tasks"));
 $("#taskCreatePanel").hidden=!editableTasks;
 const list=p?tasks.filter(t=>Number(t.project_id)===Number(p.id)):[];
 rows.innerHTML=list.map(t=>'<tr><td>'+safe(t.title)+'</td><td>'+safe(t.responsible_name||"—")+'</td><td>'+displayDate(t.start_date)+'</td><td>'+displayDate(t.end_date)+'</td><td>'+Number(t.progress_percent||0).toLocaleString("fa-IR")+'٪</td><td>'+(editableTasks?'<form data-task-progress="'+t.id+'" style="display:flex;gap:6px;align-items:center"><input aria-label="درصد پیشرفت" type="number" min="0" max="100" name="progress" value="'+Number(t.progress_percent||0)+'" style="width:75px"><button class="secondary" type="submit">ذخیره</button></form>':"فقط مشاهده")+'</td></tr>').join("")||'<tr><td colspan="6">برای این پروژه هنوز وظیفه‌ای ثبت نشده است.</td></tr>';
}
let ganttCurrentItems=[],ganttScale="week";
function ganttUtcDay(value){return Math.floor(Date.parse(String(value).slice(0,10)+"T00:00:00Z")/86400000)}
function ganttDayLabel(day){return displayDate(new Date(day*86400000).toISOString().slice(0,10))}
function renderGantt(items){
 ganttCurrentItems=items;
 const valid=items.filter(x=>Number.isFinite(ganttUtcDay(x.start_date))&&Number.isFinite(ganttUtcDay(x.end_date))).sort((a,b)=>ganttUtcDay(a.start_date)-ganttUtcDay(b.start_date));
 const start=valid.length?Math.min(...valid.map(x=>ganttUtcDay(x.start_date))):null;
 const end=valid.length?Math.max(...valid.map(x=>ganttUtcDay(x.end_date))):null;
 $("#ganttCount").textContent=valid.length.toLocaleString("fa-IR");
 $("#ganttStart").textContent=start===null?"—":ganttDayLabel(start);
 $("#ganttEnd").textContent=end===null?"—":ganttDayLabel(end);
 $("#ganttDuration").textContent=start===null?"—":(end-start+1).toLocaleString("fa-IR")+" روز";
 $("#ganttToggleForm").hidden=!(canEdit()&&hasPermission("schedule"));
 if(!valid.length){$("#gantt").innerHTML='<div class="gantt-empty"><div class="gantt-empty-icon">▥</div><strong>هنوز مرحله‌ای برای این پروژه ثبت نشده است</strong><span>برای ساخت زمان‌بندی، یک مرحله با تاریخ شروع و پایان اضافه کنید.</span></div>';$("#ganttDetail").hidden=true;return}
 const today=Math.floor(Date.now()/86400000),step=ganttScale==="month"?30:7;
 const low=Math.floor((Math.min(start,today)-step)/step)*step,high=Math.ceil((Math.max(end,today)+step)/step)*step;
 const days=high-low,pxPerDay=ganttScale==="month"?6:16,trackWidth=Math.max(620,days*pxPerDay);
 const tickCount=Math.ceil(days/step),tickWidth=trackWidth*step/days;
 const todayLeft=(today-low)/days*100;
 const tickLabels=Array.from({length:tickCount},(_,i)=>'<div class="gantt-axis-tick" style="width:'+tickWidth+'px;flex:none">'+safe(ganttDayLabel(low+i*step))+'</div>').join("");
 const axis='<div class="gantt-axis"><div class="gantt-stage-label">مراحل پروژه</div><div class="gantt-axis-track" style="width:'+trackWidth+'px">'+tickLabels+'<div class="gantt-today-line" style="right:'+todayLeft+'%"></div></div></div>';
 const rows=valid.map((x,i)=>{const s=ganttUtcDay(x.start_date),e=ganttUtcDay(x.end_date),left=(s-low)/days*100,width=Math.max(.4,(e-s+1)/days*100),color=e<today?"#b56e4d":s<=today?"#b18a42":"#31745d";return '<div class="gantt-stage-row"><div class="gantt-stage-label"><strong>'+safe(x.title)+'</strong><small>'+safe(displayDate(x.start_date))+' — '+safe(displayDate(x.end_date))+'</small></div><div class="gantt-stage-track" style="width:'+trackWidth+'px;--gantt-tick-size:'+tickWidth+'px"><button type="button" class="gantt-task-bar" data-gantt-index="'+i+'" title="'+safe(x.title)+' | '+safe(displayDate(x.start_date))+' تا '+safe(displayDate(x.end_date))+'" style="right:'+left+'%;width:'+width+'%;background:'+color+'">'+safe(x.title)+'</button><div class="gantt-today-line" style="right:'+todayLeft+'%"></div></div></div>'}).join("");
 $("#gantt").innerHTML=axis+rows;$("#gantt").dataset.sorted="1";$("#ganttDetail").hidden=true;
 $("#gantt")._sortedItems=valid;
}

async function action(fn,successMessage){try{await fn();await load();if(successMessage)alert(successMessage)}catch(e){fail(e)}}

async function adminRequest(body){
 const {data:{session}}=await sb.auth.getSession();
 if(!session?.access_token)throw Error("ابتدا وارد سامانه شوید");
 const response=await fetch("https://xgrtcsudpqcznhlkberz.supabase.co/functions/v1/manage-users",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+session.access_token,"apikey":"sb_publishable_kyEmcxiKYeNFgnPTBqnjqw_BxrCP7hu"},body:JSON.stringify(body)});
 const result=await response.json().catch(()=>({error:"پاسخ نامعتبر از سرور"}));
 if(!response.ok||result.error)throw Error(result.error||"خطای سرور");
 return result;
}
let adminUsersCache=[],editingPermissionsUser=null;
async function refreshAdminUsers(){
 const box=$("#adminUsers"),list=$("#usersList"),loading=$("#usersLoading");
 box.style.display=canApprove()?"block":"none";
 if(!canApprove()){list.textContent=user?"فقط مدیر سامانه امکان مدیریت کاربران را دارد.":"ابتدا وارد شوید.";return}
 list.textContent="";loading.style.display="block";$("#usersTable").innerHTML="";
 try{
 const result=await adminRequest({action:"list"});
 adminUsersCache=result.users;
 $("#usersTable").innerHTML=result.users.map(u=>{
 const defaults=k=>["home","center","charter","schedule","list"].includes(k)||(k==="create"&&u.role==="support");
 const permitted=Object.entries(permissionLabels).filter(([k])=>k!=="users").filter(([k])=>u.permissions?.[k]??defaults(k)).length;
 return '<tr><td>'+safe(u.full_name?.trim()||"کاربر")+'</td><td>'+(u.is_admin?'مدیر سامانه':'<select data-user-role="'+safe(u.id)+'"><option value="responsible" '+(u.role==="responsible"?"selected":"")+'>کاربر عادی</option><option value="employer" '+(u.role==="employer"?"selected":"")+'>کارفرما</option><option value="support" '+(u.role==="support"?"selected":"")+'>پشتیبان</option></select>')+'</td><td><input type="checkbox" data-user-approved="'+safe(u.id)+'" '+(u.is_approved?"checked":"")+' '+(u.is_admin?"disabled":"")+'></td><td>'+(u.is_admin?'<span>دسترسی کامل</span>':'<button type="button" class="permission-action" data-open-permissions="'+safe(u.id)+'" aria-label="تنظیم دسترسی‌های '+safe(u.full_name?.trim()||"کاربر")+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 4 7v5c0 5 3.4 8 8 9 4.6-1 8-4 8-9V7l-8-4Z"/><path d="m9 12 2 2 4-4"/></svg> دسترسی‌ها <small>('+permitted+')</small></button>')+'</td><td>'+(u.is_admin?"مدیر سامانه":'<button type="button" data-save-user="'+safe(u.id)+'">ذخیره نقش و وضعیت</button>')+'</td></tr>'
 }).join("");
 }catch(e){$("#userAdminStatus").textContent="خطا در دریافت کاربران: "+e.message}finally{loading.style.display="none"}
}

const permKeys=Object.keys(permissionLabels).filter(k=>k!=="users");
function updatePermissionSelectAll(){const inputs=[...document.querySelectorAll("#permissionModalGrid input")],n=inputs.filter(x=>x.checked).length,all=$("#permissionSelectAll");all.checked=n===inputs.length;all.indeterminate=n>0&&n<inputs.length;$("#permissionCount").textContent=n+" از "+inputs.length+" دسترسی"}
function closePermissionModal(){editingPermissionsUser=null;$("#permissionModal").hidden=true;document.body.style.overflow=""}
function openPermissionModal(id){
 const u=adminUsersCache.find(x=>x.id===id);if(!u||u.is_admin)return;
 editingPermissionsUser=id;
 $("#permissionModalTitle").textContent="دسترسی‌های "+(u.full_name?.trim()||"کاربر");
 $("#permissionModalSubtitle").textContent="بخش‌هایی که این کاربر اجازه مشاهده و استفاده از آن‌ها را دارد.";
 $("#permissionModalStatus").textContent="";
 const defaults=k=>["home","center","charter","schedule","list"].includes(k)||(k==="create"&&u.role==="support");
 $("#permissionModalGrid").innerHTML=permKeys.map(k=>'<label class="permission-tile"><input type="checkbox" data-modal-permission="'+k+'" '+((u.permissions?.[k]??defaults(k))?"checked":"")+'><span>'+safe(permissionLabels[k])+'</span></label>').join("");
 $("#permissionModal").hidden=false;document.body.style.overflow="hidden";updatePermissionSelectAll();$("#permissionModalClose").focus();
}
document.addEventListener("click",e=>{const btn=e.target.closest("[data-open-permissions]");if(btn)openPermissionModal(btn.dataset.openPermissions)});
$("#permissionModalClose").addEventListener("click",closePermissionModal);
$("#permissionModalCancel").addEventListener("click",closePermissionModal);
$("#permissionModal").addEventListener("click",e=>{if(e.target.id==="permissionModal")closePermissionModal()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#permissionModal").hidden)closePermissionModal()});
$("#permissionSelectAll").addEventListener("change",e=>{document.querySelectorAll("#permissionModalGrid input").forEach(x=>x.checked=e.target.checked);updatePermissionSelectAll()});
$("#permissionModalGrid").addEventListener("change",updatePermissionSelectAll);
$("#permissionModalSave").addEventListener("click",async()=>{
 if(!editingPermissionsUser)return;const btn=$("#permissionModalSave"),status=$("#permissionModalStatus"),id=editingPermissionsUser;
 const permissions=Object.fromEntries([...document.querySelectorAll("[data-modal-permission]")].map(x=>[x.dataset.modalPermission,x.checked]));permissions.users=false;
 btn.disabled=true;status.textContent="در حال ذخیره دسترسی‌ها...";
 try{await adminRequest({action:"permissions",id,permissions});closePermissionModal();$("#userAdminStatus").textContent="✓ دسترسی‌ها ذخیره شدند";await refreshAdminUsers()}catch(err){status.textContent="خطا: "+err.message}finally{btn.disabled=false}
});
let jalaliTarget=null;
const jpMonths=["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
function initJalaliPicker(){
 const modal=$("#jalaliPicker"),year=$("#jpYear"),month=$("#jpMonth"),day=$("#jpDay");
 const now=jalaliParts(new Date());
 year.innerHTML=Array.from({length:31},(_,i)=>'<option value="'+(now.year-15+i)+'">'+(now.year-15+i)+'</option>').join("");
 month.innerHTML=jpMonths.map((m,i)=>'<option value="'+(i+1)+'">'+m+'</option>').join("");
 function fillDays(){
  const y=Number(year.value),m=Number(month.value),prev=Number(day.value)||1;
  let max=m<=6?31:m<=11?30:29;
  if(m===12){try{gregorianDate(y+"/12/30");max=30}catch(e){max=29}}
  day.innerHTML=Array.from({length:max},(_,i)=>'<option value="'+(i+1)+'">'+(i+1)+'</option>').join("");
  day.value=String(Math.min(prev,max));
  $("#jpError").textContent="";
 }
 year.addEventListener("change",fillDays);month.addEventListener("change",fillDays);
 function close(){modal.style.display="none";jalaliTarget=null}
 $("#jpCancel").addEventListener("click",close);
 modal.addEventListener("click",e=>{if(e.target===modal)close()});
 document.addEventListener("click",e=>{
  const input=e.target.closest('input[data-jalali-picker]');
  if(!input)return;
  jalaliTarget=input;
  const parts=faDigits(input.value).match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  const y=parts?Number(parts[1]):now.year,m=parts?Number(parts[2]):now.month,d=parts?Number(parts[3]):now.day;
  year.value=String(y);if(!year.value)year.value=String(now.year);
  month.value=String(m);fillDays();day.value=String(Math.min(d,day.options.length));
  $("#jpError").textContent="";modal.style.display="flex";
 });
 $("#jpConfirm").addEventListener("click",()=>{
  if(!jalaliTarget)return;
  const val=year.value+"/"+month.value.padStart(2,"0")+"/"+day.value.padStart(2,"0");
  try{gregorianDate(val);jalaliTarget.value=val;jalaliTarget.dispatchEvent(new Event("change",{bubbles:true}));close()}
  catch(e){$("#jpError").textContent=e.message}
 });
}
document.addEventListener("DOMContentLoaded",async()=>{
const themeToggle=$("#themeToggle");
const syncThemeButton=()=>{const dark=document.documentElement.dataset.theme==="dark";themeToggle.setAttribute("aria-pressed",String(dark));themeToggle.setAttribute("aria-label",dark?"فعال‌سازی حالت روشن":"فعال‌سازی حالت تاریک");themeToggle.title=dark?"حالت روشن":"حالت تاریک"};
themeToggle.addEventListener("click",()=>{const next=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=next;try{localStorage.setItem("project-app-theme",next)}catch(e){}syncThemeButton()});
syncThemeButton();
const appLayout=$("#appLayout"),sidebarToggle=$("#sidebarToggle");
const navIcons={home:"⌂",center:"▣",create:"＋",charter:"▤",schedule:"▥",approvals:"◉",publish:"⇧",list:"☷",trash:"▢",users:"♙"};
document.querySelectorAll("#sidebarNav .nav").forEach(btn=>{const label=btn.textContent.trim().replace(/^[⌂▣＋▤▥◉⇧☷▢♙]\s*/u,"");const icon=navIcons[btn.dataset.page]||"•";btn.textContent="";const i=document.createElement("span");i.className="sidebar-nav-icon";i.setAttribute("aria-hidden","true");i.textContent=icon;const t=document.createElement("span");t.className="sidebar-nav-label";t.textContent=label;btn.append(i,t);btn.title=label;btn.setAttribute("aria-label",label)});
const syncSidebar=()=>{const collapsed=appLayout.classList.contains("sidebar-collapsed");sidebarToggle.setAttribute("aria-expanded",String(!collapsed));sidebarToggle.setAttribute("aria-label",collapsed?"باز کردن منوی کناری":"بستن منوی کناری");sidebarToggle.title=collapsed?"باز کردن منو":"بستن منو"};
try{if(localStorage.getItem("project-app-sidebar")==="collapsed")appLayout.classList.add("sidebar-collapsed")}catch(e){}
sidebarToggle.addEventListener("click",()=>{appLayout.classList.toggle("sidebar-collapsed");try{localStorage.setItem("project-app-sidebar",appLayout.classList.contains("sidebar-collapsed")?"collapsed":"expanded")}catch(e){}syncSidebar()});
syncSidebar();
initJalaliPicker();
document.addEventListener("click",async e=>{
const dashboardCard=e.target.closest("[data-dashboard-filter]");if(dashboardCard){dashboardStatusFilter=dashboardCard.dataset.dashboardFilter;if(hasPermission("center"))show("center");return}
const nav=e.target.closest("[data-page],[data-jump]");if(nav){if(!user||!profile?.is_approved||!hasPermission(nav.dataset.page||nav.dataset.jump))return;show(nav.dataset.page||nav.dataset.jump);return}
const open=e.target.closest("[data-open]");if(open){selected=Number(open.dataset.open);show("center");return}
const dec=e.target.closest("[data-decision]");if(dec&&canDecide())await action(async()=>{await run(sb.from("projects").update({workflow_status:dec.dataset.decision}).eq("id",Number(dec.dataset.id)).eq("workflow_status","pending").select())});
});
$("#newUserForm").addEventListener("submit",async e=>{e.preventDefault();const msg=$("#userAdminStatus");msg.textContent="در حال ایجاد کاربر...";try{const v=Object.fromEntries(new FormData(e.target));await adminRequest({action:"create",...v});e.target.reset();msg.textContent="✓ کاربر با موفقیت ایجاد شد";await refreshAdminUsers()}catch(err){msg.textContent="خطا: "+err.message}});
document.addEventListener("click",async e=>{const btn=e.target.closest("[data-save-user]");if(!btn)return;const id=btn.dataset.saveUser;const msg=$("#userAdminStatus");try{await adminRequest({action:"update",id,role:document.querySelector('[data-user-role="'+id+'"]').value,is_approved:document.querySelector('[data-user-approved="'+id+'"]').checked});msg.textContent="✓ دسترسی کاربر ذخیره شد";await refreshAdminUsers()}catch(err){msg.textContent="خطا: "+err.message}});
document.addEventListener("click",async e=>{
 const archive=e.target.closest("[data-archive-project]"),restore=e.target.closest("[data-restore-project]");
 if(!archive&&!restore)return;
 if(!canApprove()){fail(Error("فقط مدیر سامانه مجاز است"));return}
 const id=Number(archive?archive.dataset.archiveProject:restore.dataset.restoreProject);
 const p=(archive?projects:archivedProjects).find(x=>x.id===id);
 if(!p||!confirm((archive?"حذف پروژه «":"بازیابی پروژه «")+p.name+"»؟"))return;
 try{
  const {data:{session}}=await sb.auth.getSession();
  if(!session?.access_token)throw Error("ابتدا وارد شوید");
  const response=await fetch("https://xgrtcsudpqcznhlkberz.supabase.co/functions/v1/project-archive",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token,apikey:"sb_publishable_kyEmcxiKYeNFgnPTBqnjqw_BxrCP7hu"},body:JSON.stringify({action:archive?"archive":"restore",project_id:id})});
  const result=await response.json();if(!response.ok||!result.ok)throw Error(result.error||"عملیات ناموفق بود");
  await load();alert(archive?"پروژه به بخش حذف‌شده‌ها منتقل شد":"پروژه بازیابی شد");
 }catch(err){fail(err)}
});
$("#selectedProject").addEventListener("change",e=>{selected=Number(e.target.value);render()});const ownerInput=$("#ownerSearch"),ownerSuggestions=$("#ownerSuggestions");function updateOwnerSuggestions(){const query=ownerInput.value.trim().toLocaleLowerCase("fa");const owners=[...new Set(projects.map(p=>String(p.sponsor||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"fa")).filter(name=>name.toLocaleLowerCase("fa").includes(query));ownerSuggestions.innerHTML='<button type="button" data-owner-option="">همه متولی‌ها (حذف فیلتر)</button>'+owners.map(name=>'<button type="button" data-owner-option="'+safe(name)+'">'+safe(name)+'</button>').join("");ownerSuggestions.hidden=false;ownerInput.setAttribute("aria-expanded","true");}ownerInput.addEventListener("focus",updateOwnerSuggestions);ownerInput.addEventListener("click",updateOwnerSuggestions);ownerInput.addEventListener("input",()=>{updateOwnerSuggestions();render();});ownerSuggestions.addEventListener("click",e=>{const button=e.target.closest("[data-owner-option]");if(!button)return;ownerInput.value=button.dataset.ownerOption;ownerSuggestions.hidden=true;ownerInput.setAttribute("aria-expanded","false");render();});document.addEventListener("click",e=>{if(!e.target.closest(".owner-filter")){ownerSuggestions.hidden=true;ownerInput.setAttribute("aria-expanded","false");}});ownerInput.addEventListener("keydown",e=>{if(e.key==="Escape"){ownerSuggestions.hidden=true;ownerInput.setAttribute("aria-expanded","false");}});
function setAuthView(view){for(const [name,id] of Object.entries({login:"authLoginView",forgot:"authForgotView",reset:"authResetView"}))$("#"+id).hidden=name!==view;$("#authScreen").hidden=false;document.querySelector("header").style.visibility="hidden";document.querySelector(".layout").style.visibility="hidden";window.scrollTo(0,0)}
function showRecovery(){recoveryMode=true;setAuthView("reset");$("#recoveryStatus").textContent=""}
const recoveryLink=location.hash.includes("type=recovery")||new URLSearchParams(location.search).get("type")==="recovery"||location.hash.includes("access_token=")&&location.hash.includes("recovery");
if(recoveryLink)showRecovery();
$("#forgotToggle").addEventListener("click",()=>setAuthView("forgot"));
document.querySelectorAll("[data-auth-back]").forEach(x=>x.addEventListener("click",()=>setAuthView("login")));
$("#resetCancel").addEventListener("click",async()=>{recoveryMode=false;await sb.auth.signOut();user=null;profile=null;history.replaceState(null,"",location.pathname);setAuthView("login");render()});
$("#forgotPasswordForm").addEventListener("submit",async e=>{
 e.preventDefault();const status=$("#forgotPasswordStatus");status.textContent="در حال ارسال...";
 try{const email=e.target.elements.email.value.trim();const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname+"?auth=recovery"});if(error)throw error;status.textContent="اگر ایمیل در سامانه ثبت شده باشد، لینک بازیابی ارسال می‌شود. پوشه Spam را هم بررسی کنید."}catch(err){status.textContent="خطا: "+(err.message||err)}
});
$("#recoveryForm").addEventListener("submit",async e=>{
 e.preventDefault();const status=$("#recoveryStatus"),button=e.target.querySelector('button[type="submit"]');
 const p=e.target.elements.newPassword.value,confirm=e.target.elements.confirmPassword.value;
 if(p!==confirm){status.textContent="رمزها یکسان نیستند.";return}
 if(p.length<8){status.textContent="رمز باید حداقل ۸ کاراکتر باشد.";return}
 status.textContent="در حال ذخیره رمز...";button.disabled=true;
 try{const {data:{session},error:sessionError}=await sb.auth.getSession();if(sessionError)throw sessionError;if(!session)throw Error("لینک بازیابی معتبر نیست یا منقضی شده. لینک جدید دریافت کنید.");
 const {error}=await sb.auth.updateUser({password:p});if(error)throw error;
 e.target.reset();recoveryMode=false;await sb.auth.signOut();user=null;profile=null;history.replaceState(null,"",location.pathname);setAuthView("login");$("#authMessage").textContent="رمز جدید ثبت شد. حالا با رمز جدید وارد شوید.";render();
 }catch(err){status.textContent="خطا: "+(err.message||err)}finally{button.disabled=false}
});
$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();const f=e.target,msg=$("#authMessage"),button=f.querySelector('button[type="submit"]');if(button.disabled)return;msg.textContent="در حال بررسی اطلاعات ورود...";button.disabled=true;try{const {data,error}=await sb.auth.signInWithPassword({email:f.elements.username.value.trim(),password:f.elements.password.value});if(error)throw error;user=data.user;await load();if(!profile?.is_approved){msg.textContent="حساب شما هنوز توسط مدیر تأیید نشده است.";return}msg.textContent="";f.reset();show("home")}catch(err){fail(err)}finally{button.disabled=false}});
$("#headerLogout").addEventListener("click",()=>action(async()=>{await run(sb.auth.signOut());user=null;selected=null;show("home")}));$("#headerLogin").addEventListener("click",()=>setAuthView("login"));

$("#taskCreateForm").addEventListener("submit",e=>{e.preventDefault();action(async()=>{
 const p=current();if(!p||!editable(p)||!hasPermission("tasks"))throw Error("مجوز ایجاد وظیفه ندارید");
 const v=Object.fromEntries(new FormData(e.target));
 if(!v.title?.trim())throw Error("عنوان وظیفه الزامی است");
 const start=v.start_date?gregorianDate(v.start_date):null,end=v.end_date?gregorianDate(v.end_date):null;
 if(start&&end&&end<start)throw Error("پایان قبل از شروع است");
 const saved=await run(sb.from("tasks").insert({project_id:p.id,title:v.title.trim(),responsible_name:v.responsible_name||null,description:v.description||null,start_date:start,end_date:end,status:"draft",progress_percent:0}).select("id"));
 if(!saved?.length)throw Error("وظیفه ذخیره نشد");e.target.reset();$("#tasksStatus").textContent="✓ وظیفه ثبت شد";
})});
document.addEventListener("submit",e=>{const form=e.target.closest("[data-task-progress]");if(!form)return;e.preventDefault();action(async()=>{
 const p=current();if(!p||!editable(p)||!hasPermission("tasks"))throw Error("مجوز ثبت پیشرفت ندارید");
 const id=Number(form.dataset.taskProgress),task=tasks.find(t=>t.id===id&&Number(t.project_id)===Number(p.id));
 if(!task)throw Error("وظیفه در پروژه انتخاب‌شده پیدا نشد");
 const value=Number(form.elements.progress.value);if(!Number.isInteger(value)||value<0||value>100)throw Error("درصد باید بین صفر و صد باشد");
 const updated=await run(sb.from("tasks").update({progress_percent:value}).eq("id",id).eq("project_id",p.id).select("id"));
 if(!updated?.length)throw Error("ثبت پیشرفت مجاز نبود");$("#tasksStatus").textContent="✓ پیشرفت واقعی ذخیره شد";
})});
const createForm=$("#projectForm");function syncCreateCharter(){for(const [dest,source] of [["charter_name","name"],["charter_start","startDate"],["charter_end","endDate"],["charter_owner","owner"]])if(createForm.elements[dest])createForm.elements[dest].value=createForm.elements[source]?.value||"";}createForm.addEventListener("input",syncCreateCharter);createForm.addEventListener("change",syncCreateCharter);let projectCreationInProgress=false;$("#projectForm").addEventListener("submit",async e=>{e.preventDefault();if(projectCreationInProgress)return;projectCreationInProgress=true;const submitButton=e.currentTarget.querySelector('button[type="submit"],button:not([type])');if(submitButton)submitButton.disabled=true;try{await action(async()=>{if(!canEdit()||!hasPermission("create"))throw Error("دسترسی ایجاد پروژه ندارید");const v=Object.fromEntries(new FormData(e.target));v.startDate=gregorianDate(v.startDate);v.endDate=gregorianDate(v.endDate);if(v.endDate<v.startDate)throw Error("تاریخ پایان نامعتبر است");const data=await run(sb.from("projects").insert({name:v.name,manager:v.manager,sponsor:v.owner,approver:v.approver,objective:v.objective,department:v.department||null,description:v.description,start_date:v.startDate,end_date:v.endDate,workflow_status:"draft"}).select("id").single());selected=data.id;e.target.reset();show("center")});}finally{projectCreationInProgress=false;if(submitButton)submitButton.disabled=false;}});
async function saveCharter(e){if(e)e.preventDefault();const notice=$("#charterStatus");notice.textContent="در حال ذخیره منشور...";try{const p=current();if(!p)throw Error("پروژه انتخاب نشده است");if(!editable(p)||!hasPermission("charter"))throw Error("برای ویرایش این پروژه دسترسی ندارید");const v=Object.fromEntries(new FormData($("#charterForm")));if(!String(v.objective||"").trim())throw Error("هدف پروژه الزامی است");v.estimated_budget=v.estimated_budget===""?null:Number(v.estimated_budget);if(v.estimated_budget!==null&&(!Number.isFinite(v.estimated_budget)||v.estimated_budget<0))throw Error("بودجه نامعتبر است");v.charter_updated_at=new Date().toISOString();const saved=await run(sb.from("projects").update(v).eq("id",p.id).select("id"));if(!saved?.length)throw Error("سرور تغییر را ثبت نکرد");notice.textContent="✓ منشور با موفقیت در دیتابیس ذخیره شد";await load()}catch(err){notice.textContent="خطا در ذخیره: "+(err?.message||err);fail(err)}}
$("#charterForm").addEventListener("submit",saveCharter);
$("#charterPrint").addEventListener("click",()=>window.print());

$("#ganttToggleForm").addEventListener("click",()=>{$("#ganttEditor").hidden=!$("#ganttEditor").hidden;if(!$("#ganttEditor").hidden)$("#ganttEditor").scrollIntoView({behavior:"smooth",block:"nearest"})});
$("#ganttCloseForm").addEventListener("click",()=>$("#ganttEditor").hidden=true);
$("#ganttScale").addEventListener("change",e=>{ganttScale=e.target.value;renderGantt(ganttCurrentItems)});
$("#ganttToday").addEventListener("click",()=>{const scroller=$("#ganttScroll"),line=$("#gantt .gantt-today-line");if(line){const x=line.getBoundingClientRect().left-scroller.getBoundingClientRect().left+scroller.scrollLeft;scroller.scrollTo({left:Math.max(0,x-scroller.clientWidth/2),behavior:"smooth"})}});
$("#gantt").addEventListener("click",e=>{const btn=e.target.closest("[data-gantt-index]");if(!btn)return;const x=$("#gantt")._sortedItems?.[Number(btn.dataset.ganttIndex)];if(!x)return;const s=ganttUtcDay(x.start_date),en=ganttUtcDay(x.end_date),today=Math.floor(Date.now()/86400000);$("#ganttDetail").hidden=false;$("#ganttDetail").innerHTML='<h4>'+safe(x.title)+'</h4><p>شروع: '+safe(displayDate(x.start_date))+' | پایان: '+safe(displayDate(x.end_date))+'</p><p>مدت برنامه‌ریزی‌شده: '+(en-s+1).toLocaleString("fa-IR")+' روز</p><p>وضعیت زمانی: '+(en<today?"تاریخ پایان گذشته":s>today?"هنوز شروع نشده":"در بازه برنامه‌ریزی‌شده")+'</p>';});
const scheduleForm=$("#scheduleActivityForm");$("#scheduleClearForm").addEventListener("click",()=>{scheduleForm.reset();scheduleForm.elements.phase_id.value="";$("#scheduleEditStatus").textContent="فعالیت جدید";});document.addEventListener("click",e=>{const button=e.target.closest("[data-edit-schedule]");if(!button)return;const row=phases.find(x=>String(x.id)===button.dataset.editSchedule);if(!row||Number(row.project_id)!==Number(selected))return;const f=scheduleForm.elements;f.phase_id.value=row.id;f.title.value=row.title||"";f.start.value=displayDate(row.start_date);f.end.value=displayDate(row.end_date);for(const key of ["deviation","weight","planned","actual","supplementary","approver"])f[key].value=row[key]??"";f.progress.value=row.progress??0;$("#scheduleEditStatus").textContent="در حال ویرایش: "+row.title;scheduleForm.scrollIntoView({behavior:"smooth",block:"start"});});scheduleForm.addEventListener("submit",e=>{e.preventDefault();action(async()=>{const p=current();if(!p||!editable(p)||!hasPermission("schedule"))throw Error("مجوز ثبت یا ویرایش فعالیت ندارید");const v=Object.fromEntries(new FormData(scheduleForm));const start=gregorianDate(v.start),end=gregorianDate(v.end);if(end<start)throw Error("تاریخ پایان نمی‌تواند قبل از شروع باشد");const data={title:v.title.trim(),start_date:start,end_date:end,progress:Number(v.progress||0),supplementary:v.supplementary||null,approver:v.approver||null};if(!data.title)throw Error("شرح فعالیت الزامی است");if(!Number.isFinite(data.progress)||data.progress<0||data.progress>100)throw Error("تحقق باید بین صفر تا صد باشد");for(const key of ["deviation","weight","planned","actual"]){data[key]=v[key]===""?null:Number(v[key]);if(data[key]!==null&&(!Number.isFinite(data[key])||(key!=="deviation"&&data[key]<0)))throw Error("مقدار "+key+" نامعتبر است");}if(v.phase_id){const row=phases.find(x=>String(x.id)===v.phase_id&&Number(x.project_id)===Number(p.id));if(!row)throw Error("فعالیت پیدا نشد");await run(sb.from("project_phases").update(data).eq("id",row.id).eq("project_id",p.id).select("id"));}else{await run(sb.from("project_phases").insert({...data,project_id:p.id}).select("id"));}scheduleForm.reset();$("#scheduleEditStatus").textContent="فعالیت ذخیره شد";})});$("#phaseForm").addEventListener("submit",e=>{e.preventDefault();action(async()=>{if(!editable(current())||!hasPermission("schedule"))throw Error("امکان ثبت مرحله وجود ندارد");const v=Object.fromEntries(new FormData(e.target));v.start=gregorianDate(v.start);v.end=gregorianDate(v.end);if(v.end<v.start)throw Error("تاریخ پایان نامعتبر است");await run(sb.from("project_phases").insert({project_id:selected,title:v.title,start_date:v.start,end_date:v.end}));e.target.reset()})});
$("#requestApproval").addEventListener("click",()=>action(async()=>{const p=current();if(!hasPermission("charter")||!editable(p)||!p.objective?.trim())throw Error("ابتدا منشور را ذخیره کنید");await run(sb.from("projects").update({workflow_status:"pending"}).eq("id",p.id).select())}));
["publishScheduleButton","publishApprovalsButton"].forEach(id=>document.getElementById(id)?.addEventListener("click",()=>{if(!canPublish())return alert("مجوز انتشار ندارید");alert("انتشار این بخش پس از تکمیل ذخیره‌سازی و گردش کار آن در دیتابیس فعال می‌شود.")}));$("#publishProject").addEventListener("click",()=>action(async()=>{const p=current();if(!canPublish()||p?.workflow_status!=="approved")throw Error("تأیید مدیر لازم است");await run(sb.from("projects").update({workflow_status:"published"}).eq("id",p.id).select())}));
let authInitialized=false;
const finishAuthBoot=()=>{$("#authBoot").hidden=true;authInitialized=true};
const banner=new Image();banner.onload=()=>document.querySelector(".auth-backdrop")?.classList.add("image-ready");banner.src="../home-banner.png";try{const {data,error}=await sb.auth.getUser();if(error&&/invalid.*token|session.*missing/i.test(error.message||""))await sb.auth.signOut();user=data?.user||null;if(recoveryMode||new URLSearchParams(location.search).get("auth")==="recovery"){showRecovery();return}await load()}catch(e){user=null;profile=null;render();fail(e)}finally{finishAuthBoot()}
sb.auth.onAuthStateChange((event,session)=>{user=session?.user||null;if(event==="PASSWORD_RECOVERY"||new URLSearchParams(location.search).get("auth")==="recovery"){showRecovery();return}if(recoveryMode||!authInitialized)return;setTimeout(()=>load().catch(fail),0)});
});
})();