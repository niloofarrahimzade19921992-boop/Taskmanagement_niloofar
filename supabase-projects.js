(()=>{
"use strict";
const sb=window.supabase.createClient("https://xgrtcsudpqcznhlkberz.supabase.co","sb_publishable_kyEmcxiKYeNFgnPTBqnjqw_BxrCP7hu");
let projects=[],archivedProjects=[],phases=[],profile=null,user=null,selected=null;
const $=s=>document.querySelector(s),safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const faDigits=s=>String(s??"").replace(/[۰-۹]/g,x=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(x))).replace(/[٠-٩]/g,x=>String("٠١٢٣٤٥٦٧٨٩".indexOf(x)));
const fmt=new Intl.DateTimeFormat("en-US-u-ca-persian",{year:"numeric",month:"2-digit",day:"2-digit",timeZone:"UTC"});
function jalaliParts(date){const o={};for(const p of fmt.formatToParts(date))if(["year","month","day"].includes(p.type))o[p.type]=Number(p.value);return o}
function displayDate(iso){if(!iso)return "—";const d=new Date(iso+"T12:00:00Z");if(isNaN(d))return safe(iso);const p=jalaliParts(d);return p.year+"/"+String(p.month).padStart(2,"0")+"/"+String(p.day).padStart(2,"0")}
function gregorianDate(input){const s=faDigits(input).trim();const m=/^([0-9]{4})\/([0-9]{1,2})\/([0-9]{1,2})$/.exec(s);if(!m)throw Error("تاریخ را به صورت شمسی 1405/08/29 وارد کنید");const [y,mo,da]=m.slice(1).map(Number);if(mo<1||mo>12||da<1||da>31)throw Error("تاریخ شمسی نامعتبر است");const start=Date.UTC(y+620,0,1);for(let i=0;i<740;i++){const d=new Date(start+i*86400000),p=jalaliParts(d);if(p.year===y&&p.month===mo&&p.day===da)return d.toISOString().slice(0,10)}throw Error("تاریخ شمسی نامعتبر است")}
const status={draft:"پیش‌نویس",pending:"در انتظار تأیید",approved:"تأییدشده",rejected:"برگشت‌خورده",published:"منتشرشده"};
const current=()=>projects.find(p=>String(p.id)===String(selected));
const editable=p=>p&&["draft","rejected"].includes(p.workflow_status)&&canEdit();
const canEdit=()=>profile?.is_approved&&(profile.is_admin||profile.role==="support");
const canApprove=()=>profile?.is_approved&&profile.is_admin;
function fail(e){alert("خطا: "+(e?.message||String(e)))}
async function run(promise){const {data,error}=await promise;if(error)throw error;return data}
async function load(){
if(!user){projects=[];phases=[];profile=null;render();return}
profile=await run(sb.from("user_profiles").select("id,full_name,role,is_approved,is_admin").eq("id",user.id).maybeSingle());
if(!profile?.is_approved){projects=[];phases=[];render();return}
const allProjects=await run(sb.from("projects").select("*").order("id",{ascending:false}));
projects=allProjects.filter(p=>!p.deleted_at);
archivedProjects=canApprove()?allProjects.filter(p=>!!p.deleted_at):[];
phases=await run(sb.from("project_phases").select("*"));
render();
if(document.querySelector(".page#users.active"))refreshAdminUsers();
}
function show(page){document.querySelectorAll(".page").forEach(e=>e.classList.toggle("active",e.id===page));document.querySelectorAll(".nav").forEach(e=>e.classList.toggle("active",e.dataset.page===page));render();if(page==="users")refreshAdminUsers();window.scrollTo(0,0)}
function render(){
if(!projects.some(p=>String(p.id)===String(selected)))selected=projects[0]?.id??null;
const p=current(),st=p?.workflow_status||"draft";
$("#userLabel").textContent=user?(profile?.is_approved?(profile.full_name||user.email):"در انتظار تأیید حساب"):"وارد نشده‌اید";
$("#selectedProject").innerHTML=projects.map(x=>'<option value="'+x.id+'">'+safe(x.name)+'</option>').join("");
if(p)$("#selectedProject").value=String(p.id);
$("#stats").innerHTML=[["کل پروژه‌ها",projects.length],["منتشرشده",projects.filter(x=>x.workflow_status==="published").length],["در انتظار تأیید",projects.filter(x=>x.workflow_status==="pending").length],["پیش‌نویس",projects.filter(x=>x.workflow_status==="draft").length]].map(([a,b])=>'<div class="metric"><span>'+a+'</span><strong>'+b+'</strong></div>').join("");
$("#projectDetails").innerHTML=p?'<h3>'+safe(p.name)+'</h3><p>مدیر: '+safe(p.manager||"—")+'</p><p>شرح: '+safe(p.description||"—")+'</p><p>شروع: '+displayDate(p.start_date)+' | پایان: '+displayDate(p.end_date)+'</p><span class="badge">'+status[st]+'</span><div class="actions"><button class="primary" data-jump="charter">منشور</button><button class="secondary" data-jump="schedule">گانت</button><button class="secondary" data-jump="publish">انتشار</button></div>':"<p>پروژه‌ای وجود ندارد یا هنوز وارد نشده‌اید.</p>";
const cf=$("#charterForm");["objective","scope","deliverables","stakeholders","approver"].forEach(k=>cf.elements[k].value=p?.[k]||"");
$("#trashList").innerHTML=canApprove()?(archivedProjects.map(x=>'<tr><td>'+safe(x.name)+'</td><td>'+safe(new Date(x.deleted_at).toLocaleDateString("fa-IR"))+'</td><td><button data-restore-project="'+x.id+'">بازیابی</button></td></tr>').join("")||'<tr><td colspan="3">پروژه حذف‌شده‌ای وجود ندارد.</td></tr>'):'<tr><td colspan="3">فقط مدیر سامانه دسترسی دارد.</td></tr>';
$("#projectList").innerHTML=projects.map(x=>'<tr><td>'+safe(x.name)+'</td><td>'+safe(x.manager||"—")+'</td><td>'+displayDate(x.start_date)+'</td><td>'+displayDate(x.end_date)+'</td><td><span class="badge">'+status[x.workflow_status]+'</span></td><td><button data-open="'+x.id+'">مشاهده</button>'+(canApprove()?'<button class="danger" type="button" data-archive-project="'+x.id+'" style="margin-inline-start:8px">حذف</button>':'')+'</td></tr>').join("")||'<tr><td colspan="6">پروژه‌ای وجود ندارد.</td></tr>';
$("#approvalList").innerHTML=projects.filter(x=>x.workflow_status==="pending").map(x=>'<div class="panel"><strong>'+safe(x.name)+'</strong><p>تأییدکننده: '+safe(x.approver||"مشخص نشده")+'</p>'+(canApprove()?'<div class="actions"><button class="primary" data-decision="approved" data-id="'+x.id+'">تأیید</button><button class="danger" data-decision="rejected" data-id="'+x.id+'">برگشت</button></div>':"<p>فقط مدیر می‌تواند تصمیم بگیرد.</p>")+'</div>').join("")||"<p>پروژه‌ای در انتظار تأیید نیست.</p>";
$("#publishDetails").innerHTML=p?'<strong>'+safe(p.name)+'</strong><p>وضعیت: '+status[st]+'</p>':"پروژه‌ای انتخاب نشده است.";
$("#projectPermissionNotice").style.display=canEdit()?"none":"block";
$("#requestApproval").disabled=!editable(p);
$("#publishProject").disabled=!(canApprove()&&st==="approved");
document.querySelectorAll("#charterForm button,#phaseForm button,#projectForm button").forEach(b=>b.disabled=!canEdit()||(b.closest("#projectForm")?false:!editable(p)));
$("#usersList").textContent=profile?(profile.is_approved?"حساب شما تأیید شده است.":"حساب شما هنوز توسط مدیر تأیید نشده است."):"برای مشاهده پروژه‌ها وارد شوید.";
renderGantt(p?phases.filter(x=>x.project_id===p.id):[]);
}
function renderGantt(items){
if(!items.length){$("#gantt").innerHTML="<p>مرحله‌ای ثبت نشده است.</p>";return}
const times=items.flatMap(x=>[Date.parse(x.start_date),Date.parse(x.end_date)]).filter(Number.isFinite);
const min=Math.min(...times),max=Math.max(...times),span=Math.max(86400000,max-min);
$("#gantt").innerHTML=items.map(x=>{const left=Math.max(0,(Date.parse(x.start_date)-min)/span*100),width=Math.max(1,(Date.parse(x.end_date)-Date.parse(x.start_date))/span*100);return '<div class="gantt-row"><div>'+safe(x.title)+'<br><small>'+displayDate(x.start_date)+' تا '+displayDate(x.end_date)+'</small></div><div class="track"><div class="bar" style="right:'+left+'%;width:'+Math.min(width,100-left)+'%"></div></div></div>'}).join("");
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
async function refreshAdminUsers(){
 const box=$("#adminUsers"),list=$("#usersList");
 box.style.display=canApprove()?"block":"none";
 if(!canApprove()){list.textContent=user?"فقط مدیر سامانه امکان مدیریت کاربران را دارد.":"ابتدا وارد شوید.";return}
 list.textContent="";
 try{
 const result=await adminRequest({action:"list"});
 $("#usersTable").innerHTML=result.users.map(u=>'<tr><td>'+safe(u.full_name||u.id)+'</td><td><select data-user-role="'+safe(u.id)+'" '+(u.is_admin?"disabled":"")+'><option value="responsible" '+(u.role==="responsible"?"selected":"")+'>کاربر عادی</option><option value="manager" '+(u.role==="manager"?"selected":"")+'>مدیر پروژه</option><option value="support" '+(u.role==="support"?"selected":"")+'>پشتیبان</option></select></td><td><input type="checkbox" data-user-approved="'+safe(u.id)+'" '+(u.is_approved?"checked":"")+' '+(u.is_admin?"disabled":"")+'></td><td>'+(u.is_admin?"مدیر سامانه":'<button type="button" data-save-user="'+safe(u.id)+'">ذخیره</button>')+'</td></tr>').join("");
 }catch(e){$("#userAdminStatus").textContent="خطا در دریافت کاربران: "+e.message}
}

let jalaliTarget=null;
const jpMonths=["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
function initJalaliPicker(){
 const modal=$("#jalaliPicker"),year=$("#jpYear"),month=$("#jpMonth"),day=$("#jpDay");
 const now=jalaliParts(new Date());
 year.innerHTML=Array.from({length:31},(_,i)=>'<option value="'+(now.year-15+i)+'">'+(now.year-15+i)+'</option>').join("");
 month.innerHTML=jpMonths.map((m,i)=>'<option value="'+(i+1)+'">'+m+'</option>').join("");
 function fillDays(){const y=Number(year.value),m=Number(month.value),prev=Number(day.value)||1;const max=m<=6?31:m<=11?30:30;day.innerHTML=Array.from({length:max},(_,i)=>'<option value="'+(i+1)+'">'+(i+1)+'</option>').join("");day.value=String(Math.min(prev,max))}
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
  month.value=String(m);fillDays();day.value=String(d);
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
initJalaliPicker();
document.addEventListener("click",async e=>{
const nav=e.target.closest("[data-page],[data-jump]");if(nav){show(nav.dataset.page||nav.dataset.jump);return}
const open=e.target.closest("[data-open]");if(open){selected=Number(open.dataset.open);show("center");return}
const dec=e.target.closest("[data-decision]");if(dec&&canApprove())await action(async()=>{await run(sb.from("projects").update({workflow_status:dec.dataset.decision}).eq("id",Number(dec.dataset.id)).eq("workflow_status","pending").select())});
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
$("#selectedProject").addEventListener("change",e=>{selected=Number(e.target.value);render()});
let recoveryMode=false;
function showRecovery(){
 recoveryMode=true;
 $("#recoveryPanel").style.display="block";
 show("users");
 $("#recoveryPanel").scrollIntoView({behavior:"smooth",block:"start"});
}
const recoveryLink=location.hash.includes("type=recovery")||new URLSearchParams(location.search).get("type")==="recovery";
if(recoveryLink)showRecovery();
$("#forgotPasswordForm").addEventListener("submit",async e=>{
 e.preventDefault();const status=$("#forgotPasswordStatus");status.textContent="در حال ارسال...";
 try{
  const email=e.target.elements.email.value.trim();
  const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
  if(error)throw error;
  status.textContent="اگر ایمیل در سامانه ثبت شده باشد، لینک بازیابی ارسال می‌شود. پوشه Spam را هم بررسی کنید.";
 }catch(err){status.textContent="خطا: "+(err.message||err)}
});
$("#recoveryForm").addEventListener("submit",async e=>{
 e.preventDefault();const status=$("#recoveryStatus");
 const p=e.target.elements.newPassword.value,confirm=e.target.elements.confirmPassword.value;
 if(p!==confirm){status.textContent="رمزها یکسان نیستند.";return}
 if(p.length<8){status.textContent="رمز باید حداقل ۸ کاراکتر باشد.";return}
 status.textContent="در حال ذخیره رمز...";
 try{
  const {data:{session},error:sessionError}=await sb.auth.getSession();
  if(sessionError)throw sessionError;
  if(!session)throw Error("لینک بازیابی معتبر نیست یا منقضی شده. لینک جدید دریافت کنید.");
  const {error}=await sb.auth.updateUser({password:p});
  if(error)throw error;
  status.textContent="رمز جدید با موفقیت ثبت شد. حالا می‌توانید با آن وارد شوید.";
  recoveryMode=false;
  e.target.reset();
  await sb.auth.signOut();
  user=null;await load();
  location.hash="";
  $("#recoveryPanel").style.display="none";
  alert("رمز جدید ثبت شد. اکنون با ایمیل و رمز جدید وارد شوید.");
 }catch(err){status.textContent="خطا: "+(err.message||err)}
});
$("#loginForm").addEventListener("submit",e=>{e.preventDefault();action(async()=>{const f=e.target;const {data,error}=await sb.auth.signInWithPassword({email:f.elements.username.value.trim(),password:f.elements.password.value});if(error)throw error;user=data.user})});
$("#logout").addEventListener("click",()=>action(async()=>{await run(sb.auth.signOut());user=null;selected=null}));
$("#projectForm").addEventListener("submit",e=>{e.preventDefault();action(async()=>{if(!canEdit())throw Error("دسترسی ایجاد پروژه ندارید");const v=Object.fromEntries(new FormData(e.target));v.startDate=gregorianDate(v.startDate);v.endDate=gregorianDate(v.endDate);if(v.endDate<v.startDate)throw Error("تاریخ پایان نامعتبر است");const data=await run(sb.from("projects").insert({name:v.name,manager:v.manager,description:v.description,start_date:v.startDate,end_date:v.endDate,workflow_status:"draft"}).select("id").single());selected=data.id;e.target.reset();show("center")})});
async function saveCharter(e){if(e)e.preventDefault();const notice=$("#charterStatus");notice.textContent="در حال ذخیره منشور...";try{const p=current();if(!p)throw Error("پروژه انتخاب نشده است");if(!editable(p))throw Error("برای ویرایش این پروژه دسترسی ندارید");const v=Object.fromEntries(new FormData($("#charterForm")));const saved=await run(sb.from("projects").update(v).eq("id",p.id).select("id"));if(!saved?.length)throw Error("سرور تغییر را ثبت نکرد");notice.textContent="✓ منشور با موفقیت در دیتابیس ذخیره شد";await load()}catch(err){notice.textContent="خطا در ذخیره: "+(err?.message||err);fail(err)}}
$("#charterForm").addEventListener("submit",saveCharter);
$("#saveCharterButton").addEventListener("click",saveCharter);
$("#phaseForm").addEventListener("submit",e=>{e.preventDefault();action(async()=>{if(!editable(current()))throw Error("امکان ثبت مرحله وجود ندارد");const v=Object.fromEntries(new FormData(e.target));v.start=gregorianDate(v.start);v.end=gregorianDate(v.end);if(v.end<v.start)throw Error("تاریخ پایان نامعتبر است");await run(sb.from("project_phases").insert({project_id:selected,title:v.title,start_date:v.start,end_date:v.end}));e.target.reset()})});
$("#requestApproval").addEventListener("click",()=>action(async()=>{const p=current();if(!editable(p)||!p.objective?.trim())throw Error("ابتدا منشور را ذخیره کنید");await run(sb.from("projects").update({workflow_status:"pending"}).eq("id",p.id).select())}));
$("#publishProject").addEventListener("click",()=>action(async()=>{const p=current();if(!canApprove()||p?.workflow_status!=="approved")throw Error("تأیید مدیر لازم است");await run(sb.from("projects").update({workflow_status:"published"}).eq("id",p.id).select())}));
const {data}=await sb.auth.getUser();user=data?.user||null;await action(async()=>{});
sb.auth.onAuthStateChange((event,session)=>{user=session?.user||null;if(event==="PASSWORD_RECOVERY"){setTimeout(showRecovery,0)}setTimeout(()=>load().catch(fail),0)});
});
})();