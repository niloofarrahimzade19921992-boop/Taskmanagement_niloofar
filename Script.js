// Task Management System - JavaScript
const $ = id => document.getElementById(id);
const qsa = s => [...document.querySelectorAll(s)];
const STORAGE = {projects:"tm_projects", tasks:"tm_tasks", theme:"tm_theme"};
let projects = load(STORAGE.projects, [{id:"p1",name:"راه‌اندازی سامانه مدیریت وظایف",manager:"مدیر پروژه",start:"۱۴۰۵/۰۸/۰۱",end:"۱۴۰۵/۱۰/۳۰",description:"پیاده‌سازی سامانه مدیریت وظایف سازمانی"}]);
let tasks = load(STORAGE.tasks, [
 {id:"t1",projectId:"p1",title:"طراحی ساختار اولیه سامانه",status:"done",responsible:"نیلوفر",owner:"مدیر پروژه",supervisor:"ناظر پروژه",approver:"مدیر واحد",startDate:"۱۴۰۵/۰۸/۰۱",endDate:"۱۴۰۵/۰۸/۱۰",description:"طراحی صفحات اصلی",latestStatus:"تکمیل شده",documentName:"",approval:"approved"},
 {id:"t2",projectId:"p1",title:"تعریف فرم ایجاد وظیفه",status:"progress",responsible:"نیلوفر",owner:"مدیر پروژه",supervisor:"ناظر پروژه",approver:"مدیر واحد",startDate:"۱۴۰۵/۰۸/۰۸",endDate:"۱۴۰۵/۰۸/۲۰",description:"تعریف فیلدها و گردش ثبت",latestStatus:"در حال توسعه",documentName:"",approval:""},
 {id:"t3",projectId:"p1",title:"بررسی گزارش‌های مدیریتی",status:"pending",responsible:"واحد پشتیبانی",owner:"مدیر پروژه",supervisor:"ناظر پروژه",approver:"",startDate:"۱۴۰۵/۰۸/۱۵",endDate:"۱۴۰۵/۰۸/۲۵",description:"بررسی شاخص‌های مورد نیاز",latestStatus:"در انتظار شروع",documentName:"",approval:""},
 {id:"t4",projectId:"p1",title:"فعالیت لغوشده نمونه",status:"cancelled",responsible:"واحد عملیات",owner:"مدیر پروژه",supervisor:"ناظر پروژه",approver:"مدیر واحد",startDate:"۱۴۰۵/۰۸/۰۵",endDate:"۱۴۰۵/۰۸/۱۲",description:"فعالیت آزمایشی",latestStatus:"به علت تغییر برنامه لغو شد",documentName:"",approval:"rejected"}
]);
let currentFilter="all";

const demoProjects = [
 {id:"p2",name:"بهبود فرآیند خدمات مشتریان",manager:"سارا احمدی",start:"۱۴۰۵/۰۸/۰۵",end:"۱۴۰۵/۱۱/۱۵",description:"بازطراحی فرآیند ثبت و پیگیری درخواست‌های مشتریان"},
 {id:"p3",name:"گزارش‌گیری مدیریتی شعب",manager:"محمد رضایی",start:"۱۴۰۵/۰۸/۱۰",end:"۱۴۰۵/۰۹/۳۰",description:"تجمیع شاخص‌های عملکرد و گزارش‌های مدیریتی"}
];
const demoTasks = [
 {id:"t5",projectId:"p2",title:"تحلیل فرآیند فعلی خدمات",status:"done",responsible:"سارا احمدی",owner:"مدیر عملیات",supervisor:"ناظر واحد",approver:"مدیر واحد",startDate:"۱۴۰۵/۰۸/۰۵",endDate:"۱۴۰۵/۰۸/۱۲",description:"بررسی مراحل فعلی و شناسایی گلوگاه‌ها",latestStatus:"تحلیل نهایی شد",documentName:"تحلیل-فرآیند.pdf",approval:"approved"},
 {id:"t6",projectId:"p2",title:"طراحی گردش کار درخواست‌ها",status:"progress",responsible:"علی کریمی",owner:"مدیر عملیات",supervisor:"ناظر واحد",approver:"مدیر واحد",startDate:"۱۴۰۵/۰۸/۱۳",endDate:"۱۴۰۵/۰۸/۲۵",description:"طراحی گردش ثبت، ارجاع و پیگیری",latestStatus:"نسخه اولیه آماده است",documentName:"",approval:""},
 {id:"t7",projectId:"p2",title:"تست گردش تأیید",status:"pending",responsible:"واحد پشتیبانی",owner:"مدیر عملیات",supervisor:"ناظر واحد",approver:"مدیر واحد",startDate:"۱۴۰۵/۰۸/۲۶",endDate:"۱۴۰۵/۰۹/۰۵",description:"تست سناریوهای تأیید و رد",latestStatus:"در صف اجرا",documentName:"",approval:""},
 {id:"t8",projectId:"p3",title:"تعریف شاخص‌های مدیریتی",status:"done",responsible:"محمد رضایی",owner:"مدیر برنامه‌ریزی",supervisor:"ناظر گزارشات",approver:"مدیر واحد",startDate:"۱۴۰۵/۰۸/۱۰",endDate:"۱۴۰۵/۰۸/۱۸",description:"تعیین KPIهای اصلی",latestStatus:"تکمیل شده",documentName:"KPI.pdf",approval:"approved"},
 {id:"t9",projectId:"p3",title:"ساخت گزارش ماهانه شعب",status:"progress",responsible:"واحد گزارشات",owner:"مدیر برنامه‌ریزی",supervisor:"ناظر گزارشات",approver:"",startDate:"۱۴۰۵/۰۸/۱۹",endDate:"۱۴۰۵/۰۹/۱۰",description:"ساخت گزارش تجمیعی شعب",latestStatus:"در حال پیاده‌سازی",documentName:"",approval:""}
];
function seedDemoData(){
 let changed=false;
 demoProjects.forEach(p=>{if(!projects.some(x=>x.id===p.id)){projects.push(p);changed=true}});
 demoTasks.forEach(t=>{if(!tasks.some(x=>x.id===t.id)){tasks.push(t);changed=true}});
 if(changed)save();
}
seedDemoData();
function load(k,f){try{const v=JSON.parse(localStorage.getItem(k));return Array.isArray(v)?v:f}catch(e){return f}}
function save(){localStorage.setItem(STORAGE.projects,JSON.stringify(projects));localStorage.setItem(STORAGE.tasks,JSON.stringify(tasks))}
function faNum(v){return String(v).replace(/\d/g,d=>"۰۱۲۳۴۵۶۷۸۹"[d])}
function enNum(v){return String(v).replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d))}
function todayFa(){return new Intl.DateTimeFormat("fa-IR-u-ca-persian",{year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())}
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function projectName(id){return projects.find(p=>p.id===id)?.name||"بدون پروژه"}
function statusText(s){return {pending:"در انتظار انجام",progress:"در حال انجام",done:"تکمیل‌شده",cancelled:"لغوشده"}[s]||s}
function approvalState(t){if(!t.approver)return "none";return t.approval==="approved"?"approved":t.approval==="rejected"?"rejected":"pending"}
function approvalText(s){return {pending:"در انتظار بررسی",approved:"تأییدشده",rejected:"ردشده",none:"فاقد تأییدکننده"}[s]}

function showPage(id){
  if(id==="logout"){if(confirm("آیا از خروج از سامانه اطمینان دارید؟"))alert("خروج از نسخه نمایشی انجام شد.");return}
  qsa(".page").forEach(p=>p.classList.toggle("active",p.id===id));
  qsa(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
  if(window.innerWidth<=700)$(`.sidebar`)?.classList.remove("open");
  renderAll();window.scrollTo({top:0,behavior:"smooth"});
}
qsa(".nav-btn").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));
qsa("[data-go]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.go)));
const menuButton=document.querySelector(".menu-button"),sidebar=document.querySelector(".sidebar");
if(menuButton)menuButton.addEventListener("click",()=>sidebar?.classList.toggle("open"));

function fillProjects(){
 const selects=[$("taskProject"),$("newTaskProject")].filter(Boolean);
 selects.forEach(sel=>{const old=sel.value;sel.innerHTML='<option value="">انتخاب پروژه...</option>'+projects.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("");if(projects.some(p=>p.id===old))sel.value=old});
 const s=$("scheduleProjectFilter");if(s){const old=s.value;s.innerHTML='<option value="all">همه پروژه‌ها</option>'+projects.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("");s.value=projects.some(p=>p.id===old)?old:"all"}
}
function renderStats(){
 const total=tasks.length,done=tasks.filter(t=>t.status==="done").length,progress=tasks.filter(t=>t.status==="progress").length,pending=tasks.filter(t=>t.status==="pending").length,cancelled=tasks.filter(t=>t.status==="cancelled").length,waiting=tasks.filter(t=>approvalState(t)==="pending").length;
 [["projectCount",projects.length],["totalCount",total],["progressCount",progress],["approvalCount",waiting],["doneCount",done],["cancelledCount",cancelled],["pendingCount",pending],["progressReportCount",progress],["doneReportCount",done],["cancelledReportCount",cancelled],["donutTotal",total],["waitingApprovalCount",waiting],["approvedCount",tasks.filter(t=>approvalState(t)==="approved").length],["rejectedCount",tasks.filter(t=>approvalState(t)==="rejected").length]].forEach(([id,v])=>{if($(id))$(id).textContent=faNum(v)});
 const pct=n=>total?Math.round(n/total*100):0;
 const donut=$("taskDonut");
 if(donut){const a=pct(pending),b=pct(progress),c=pct(done);donut.style.setProperty("--pending",a+"%");donut.style.setProperty("--progress",(a+b)+"%");donut.style.setProperty("--done",(a+b+c)+"%");donut.style.setProperty("--cancelled","100%")}
 [["legendPending",pending],["legendProgress",progress],["legendDone",done],["legendCancelled",cancelled]].forEach(([id,v])=>{if($(id))$(id).textContent=faNum(v)});
 const chart=$("projectProgressChart");
 if(chart){chart.innerHTML=projects.map(p=>{const a=tasks.filter(t=>t.projectId===p.id);const d=a.filter(t=>t.status==="done").length;const percent=a.length?Math.round(d/a.length*100):0;return `<div class="project-progress-item"><div class="progress-label"><span>${esc(p.name)}</span><strong>${faNum(percent)}٪</strong></div><div class="project-progress-track"><i style="width:${percent}%"></i></div></div>`}).join("")}
}
function renderRecent(){const box=$("recentTasks");if(!box)return;const rows=[...tasks].slice(-6).reverse();box.innerHTML=rows.length?rows.map(t=>`<div class="recent-item"><strong>${esc(t.title)}</strong><span>${esc(projectName(t.projectId))} • ${statusText(t.status)} • ${t.endDate||"بدون تاریخ"}</span></div>`).join(""):"<div class='empty-state'>هنوز وظیفه‌ای ثبت نشده است.</div>"}
function renderProjectReport(){const b=$("projectReportBody");if(!b)return;b.innerHTML=projects.map(p=>{const a=tasks.filter(t=>t.projectId===p.id),d=a.filter(t=>t.status==="done").length,pr=a.filter(t=>t.status==="progress").length,pe=a.filter(t=>t.status==="pending").length,x=a.length?Math.round(d/a.length*100):0;return `<tr><td><strong>${esc(p.name)}</strong></td><td>${faNum(a.length)}</td><td>${faNum(d)}</td><td>${faNum(pr)}</td><td>${faNum(pe)}</td><td>${faNum(x)}٪</td></tr>`}).join("")||"<tr><td colspan='6'>پروژه‌ای ثبت نشده است.</td></tr>"}
function renderProjects(){const b=$("projectTableBody");if(!b)return;const q=($("searchProjects")?.value||"").toLowerCase();const rows=projects.filter(p=>p.name.toLowerCase().includes(q));b.innerHTML=rows.map(p=>`<tr><td><strong>${esc(p.name)}</strong></td><td>${esc(p.manager||"—")}</td><td>${p.start||"—"}</td><td>${p.end||"—"}</td><td>${faNum(tasks.filter(t=>t.projectId===p.id).length)}</td><td><button class="action-btn" data-edit-project="${p.id}">ویرایش</button><button class="delete-btn" data-delete-project="${p.id}">حذف</button></td></tr>`).join("");if($("projectListMessage"))$("projectListMessage").textContent=rows.length?"":"پروژه‌ای برای نمایش وجود ندارد."}
function taskRows(){const q=($("searchTasks")?.value||"").toLowerCase();return tasks.filter(t=>(currentFilter==="all"||t.status===currentFilter)).filter(t=>(t.title+" "+projectName(t.projectId)+" "+(t.responsible||"")).toLowerCase().includes(q))}
function renderTasks(){const b=$("taskTableBody");if(!b)return;const rows=taskRows();b.innerHTML=rows.map(t=>`<tr class="task-row"><td><strong>${esc(t.title)}</strong></td><td>${esc(projectName(t.projectId))}</td><td>${esc(t.responsible||"—")}</td><td>${esc(t.approver||"—")}</td><td>${t.endDate||"—"}</td><td><span class="status ${t.status}">${statusText(t.status)}</span></td><td><button class="action-btn" data-edit-task="${t.id}">ویرایش</button><button class="delete-btn" data-delete-task="${t.id}">حذف</button></td></tr>`).join("");if($("taskListMessage"))$("taskListMessage").textContent=rows.length?"":"وظیفه‌ای برای نمایش وجود ندارد."}
function renderApprovals(){const b=$("approvalTableBody");if(!b)return;const f=$("approvalFilter")?.value||"all";const rows=tasks.filter(t=>t.approver).filter(t=>f==="all"||approvalState(t)===f);b.innerHTML=rows.map(t=>{const s=approvalState(t);return `<tr><td><strong>${esc(t.title)}</strong></td><td>${esc(projectName(t.projectId))}</td><td>${esc(t.approver)}</td><td><span class="approval-status ${s}">${approvalText(s)}</span></td><td>${s==="pending"?`<button class="action-btn" data-approve="${t.id}">تأیید</button><button class="delete-btn" data-reject="${t.id}">رد</button>`:"—"}</td></tr>`}).join("");if($("approvalMessage"))$("approvalMessage").textContent=rows.length?"":"موردی برای نمایش وجود ندارد."}
function renderSpecial(){
 const configs=[["completedBody","completed","completedMessage","وظیفه انجام‌شده‌ای ثبت نشده است."],["cancelledBody","cancelled","cancelledMessage","وظیفه لغوشده‌ای ثبت نشده است."]];
 configs.forEach(([id,type,msg,empty])=>{const b=$(id);if(!b)return;const rows=tasks.filter(t=>t.status===type);b.innerHTML=rows.map(t=>`<tr><td>${esc(t.title)}</td><td>${esc(projectName(t.projectId))}</td><td>${esc(t.responsible||"—")}</td><td>${t.endDate||"—"}</td><td>${esc(t.approver||t.latestStatus||"—")}</td></tr>`).join("");if($(msg))$(msg).textContent=rows.length?"":empty});
 const b=$("noApproverBody");if(b){const rows=tasks.filter(t=>!t.approver);b.innerHTML=rows.map(t=>`<tr><td>${esc(t.title)}</td><td>${esc(projectName(t.projectId))}</td><td>${esc(t.responsible||"—")}</td><td><span class="status ${t.status}">${statusText(t.status)}</span></td><td><button class="action-btn" data-edit-task="${t.id}">تعیین تأییدکننده</button></td></tr>`).join("");if($("noApproverMessage"))$("noApproverMessage").textContent=rows.length?"":"همه وظایف دارای تأییدکننده هستند."}
}
function renderSchedule(){const b=$("wbsList"),g=$("ganttList");if(!b||!g)return;const f=$("scheduleProjectFilter")?.value||"all",rows=tasks.filter(t=>f==="all"||t.projectId===f);b.innerHTML=rows.length?rows.map((t,i)=>`<div class="wbs-item"><span class="wbs-number">${faNum(i+1)}</span><div><strong>${esc(t.title)}</strong><small>${esc(projectName(t.projectId))} • ${t.startDate||"—"} تا ${t.endDate||"—"}</small></div><span class="status ${t.status}">${statusText(t.status)}</span></div>`).join(""):"<div class='empty-state'>فعالیتی برای نمایش وجود ندارد.</div>";g.innerHTML=rows.length?rows.map(t=>`<div class="gantt-row"><div><strong>${esc(t.title)}</strong><small>${t.startDate||"—"} تا ${t.endDate||"—"}</small></div><div class="gantt-track"><div class="gantt-bar" style="width:${t.status==="done"?100:t.status==="progress"?65:30}%"></div></div></div>`).join(""):"<div class='empty-state'>فعالیتی برای نمایش وجود ندارد.</div>"}
function renderAll(){fillProjects();renderStats();renderRecent();renderProjectReport();renderProjects();renderTasks();renderApprovals();renderSpecial();renderSchedule()}

function projectFormSubmit(e){e.preventDefault();const name=$("projectName").value.trim();if(!name){$("projectMessage").textContent="لطفاً نام پروژه را وارد کنید.";return}const id=$("projectId").value||"p"+Date.now();const data={id,name,manager:$("projectManager").value.trim(),start:$("projectStartDate").value.trim(),end:$("projectEndDate").value.trim(),description:$("projectDescription").value.trim()};const i=projects.findIndex(p=>p.id===id);if(i>=0)projects[i]=data;else projects.push(data);save();$("projectForm").reset();$("projectId").value="";$("projectMessage").textContent="پروژه با موفقیت ذخیره شد.";renderAll()}
$("projectForm")?.addEventListener("submit",projectFormSubmit);$("cancelProjectEdit")?.addEventListener("click",()=>{$("projectForm").reset();$("projectId").value="";$("projectMessage").textContent=""});

function collectTask(prefix=""){
 const id=$(prefix?"newTaskId":"taskId")?.value||"t"+Date.now(), old=tasks.find(t=>t.id===id);return {id,projectId:$(prefix?"newTaskProject":"taskProject").value,title:$(prefix?"newTaskTitle":"title").value.trim(),status:$(prefix?"newTaskStatus":"status").value,responsible:$(prefix?"newTaskResponsible":"responsible").value.trim(),owner:$(prefix?"newTaskOwner":"owner").value.trim(),supervisor:$(prefix?"newTaskSupervisor":"supervisor").value.trim(),approver:$(prefix?"newTaskApprover":"approver").value.trim(),startDate:$(prefix?"newTaskStart":"startDate").value.trim(),endDate:$(prefix?"newTaskEnd":"endDate").value.trim(),description:$(prefix?"newTaskDescription":"description").value.trim(),latestStatus:$(prefix?"newTaskLatest":"latestStatus").value.trim(),documentName:$(prefix?"newTaskDocument":"documentName").value.trim(),approval:old?.approval||""}
}
function saveTask(e,prefix=""){e.preventDefault();const project=$(prefix?"newTaskProject":"taskProject").value,title=$(prefix?"newTaskTitle":"title").value.trim();const msg=$(prefix?"newTaskMessage":"formMessage");if(!project){msg.textContent="لطفاً پروژه را انتخاب کنید.";return}if(!title){msg.textContent="لطفاً عنوان وظیفه را وارد کنید.";return}const data=collectTask(prefix),i=tasks.findIndex(t=>t.id===data.id);if(i>=0)tasks[i]=data;else tasks.push(data);save();e.target.reset();if(!prefix&&$("taskId"))$("taskId").value="";msg.textContent="وظیفه با موفقیت ذخیره شد.";renderAll()}
$("taskForm")?.addEventListener("submit",e=>saveTask(e,""));$("newTaskForm")?.addEventListener("submit",e=>saveTask(e,"new"));$("cancelEdit")?.addEventListener("click",()=>{$("taskForm").reset();$("taskId").value=""});

function editTask(t){showPage("newTask");if($("newTaskId"))$("newTaskId").value=t.id;["newTaskProject","newTaskTitle","newTaskStatus","newTaskResponsible","newTaskOwner","newTaskSupervisor","newTaskApprover","newTaskStart","newTaskEnd","newTaskDescription","newTaskLatest","newTaskDocument"].forEach((id,i)=>{if($(id))$(id).value=[t.projectId,t.title,t.status,t.responsible||"",t.owner||"",t.supervisor||"",t.approver||"",t.startDate||"",t.endDate||"",t.description||"",t.latestStatus||"",t.documentName||""][i]});if($("newTaskMessage"))$("newTaskMessage").textContent="در حال ویرایش وظیفه انتخاب‌شده هستید.";window.scrollTo({top:0,behavior:"smooth"})}
document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;if(b.dataset.go)return;if(b.dataset.editProject){const p=projects.find(x=>x.id===b.dataset.editProject);if(p){showPage("projects");$("projectId").value=p.id;$("projectName").value=p.name;$("projectManager").value=p.manager||"";$("projectStartDate").value=p.start||"";$("projectEndDate").value=p.end||"";$("projectDescription").value=p.description||""}}if(b.dataset.deleteProject&&confirm("این پروژه حذف شود؟")){projects=projects.filter(p=>p.id!==b.dataset.deleteProject);tasks=tasks.filter(t=>t.projectId!==b.dataset.deleteProject);save();renderAll()}if(b.dataset.editTask){const t=tasks.find(x=>x.id===b.dataset.editTask);if(t)editTask(t)}if(b.dataset.deleteTask&&confirm("این وظیفه حذف شود؟")){tasks=tasks.filter(t=>t.id!==b.dataset.deleteTask);save();renderAll()}if(b.dataset.approve){const t=tasks.find(x=>x.id===b.dataset.approve);if(t){t.approval="approved";save();renderAll();alert("وظیفه با موفقیت تأیید شد.")}}if(b.dataset.reject){const t=tasks.find(x=>x.id===b.dataset.reject);if(t){t.approval="rejected";save();renderAll();alert("وظیفه رد شد.")}}});
qsa(".filter-btn").forEach(b=>b.addEventListener("click",()=>{qsa(".filter-btn").forEach(x=>x.classList.remove("active"));b.classList.add("active");currentFilter=b.dataset.filter;renderTasks()}));
$("searchTasks")?.addEventListener("input",renderTasks);$("searchProjects")?.addEventListener("input",renderProjects);$("approvalFilter")?.addEventListener("change",renderApprovals);$("scheduleProjectFilter")?.addEventListener("change",renderSchedule);
qsa(".jalali-input").forEach(i=>{i.addEventListener("input",()=>i.value=i.value.replace(/[^0-9۰-۹/]/g,"").slice(0,10));i.addEventListener("blur",()=>{const ok=!i.value||/^\d{4}\/\d{2}\/\d{2}$/.test(enNum(i.value));i.style.borderColor=ok?"":"#d96b6b"})});
$("supportBtn")?.addEventListener("click",()=>{$("supportMessage").textContent=$("supportText").value.trim()?"درخواست پشتیبانی با موفقیت ثبت شد.":"لطفاً متن درخواست را وارد کنید."});
$("themeSelect")?.addEventListener("change",e=>{document.body.dataset.theme=e.target.value;localStorage.setItem(STORAGE.theme,e.target.value)});
$("dateDisplay")?.addEventListener("change",e=>{$("currentDate").style.display=e.target.value==="yes"?"inline-block":"none"});
$("logoutBtn")?.addEventListener("click",()=>alert("خروج از نسخه نمایشی انجام شد."));
if($("currentDate"))$("currentDate").textContent=todayFa();
const savedTheme=localStorage.getItem(STORAGE.theme);if(savedTheme&&$("themeSelect")){document.body.dataset.theme=savedTheme;$("themeSelect").value=savedTheme}
renderAll();
