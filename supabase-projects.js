(()=>{
"use strict";
const sb=window.supabase.createClient("https://xgrtcsudpqcznhlkberz.supabase.co","sb_publishable_kyEmcxiKYeNFgnPTBqnjqw_BxrCP7hu");
let projects=[],phases=[],profile=null,user=null,selected=null;
const $=s=>document.querySelector(s),safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
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
projects=await run(sb.from("projects").select("*").order("id",{ascending:false}));
phases=await run(sb.from("project_phases").select("*"));
render();
}
function show(page){document.querySelectorAll(".page").forEach(e=>e.classList.toggle("active",e.id===page));document.querySelectorAll(".nav").forEach(e=>e.classList.toggle("active",e.dataset.page===page));render();window.scrollTo(0,0)}
function render(){
if(!projects.some(p=>String(p.id)===String(selected)))selected=projects[0]?.id??null;
const p=current(),st=p?.workflow_status||"draft";
$("#userLabel").textContent=user?(profile?.is_approved?(profile.full_name||user.email):"در انتظار تأیید حساب"):"وارد نشده‌اید";
$("#selectedProject").innerHTML=projects.map(x=>'<option value="'+x.id+'">'+safe(x.name)+'</option>').join("");
if(p)$("#selectedProject").value=String(p.id);
$("#stats").innerHTML=[["کل پروژه‌ها",projects.length],["منتشرشده",projects.filter(x=>x.workflow_status==="published").length],["در انتظار تأیید",projects.filter(x=>x.workflow_status==="pending").length],["پیش‌نویس",projects.filter(x=>x.workflow_status==="draft").length]].map(([a,b])=>'<div class="metric"><span>'+a+'</span><strong>'+b+'</strong></div>').join("");
$("#projectDetails").innerHTML=p?'<h3>'+safe(p.name)+'</h3><p>مدیر: '+safe(p.manager||"—")+'</p><p>شرح: '+safe(p.description||"—")+'</p><p>شروع: '+safe(p.start_date||"—")+' | پایان: '+safe(p.end_date||"—")+'</p><span class="badge">'+status[st]+'</span><div class="actions"><button class="primary" data-jump="charter">منشور</button><button class="secondary" data-jump="schedule">گانت</button><button class="secondary" data-jump="publish">انتشار</button></div>':"<p>پروژه‌ای وجود ندارد یا هنوز وارد نشده‌اید.</p>";
const cf=$("#charterForm");["objective","scope","deliverables","stakeholders","approver"].forEach(k=>cf.elements[k].value=p?.[k]||"");
$("#projectList").innerHTML=projects.map(x=>'<tr><td>'+safe(x.name)+'</td><td>'+safe(x.manager||"—")+'</td><td>'+safe(x.start_date||"—")+'</td><td>'+safe(x.end_date||"—")+'</td><td><span class="badge">'+status[x.workflow_status]+'</span></td><td><button data-open="'+x.id+'">مشاهده</button></td></tr>').join("")||'<tr><td colspan="6">پروژه‌ای وجود ندارد.</td></tr>';
$("#approvalList").innerHTML=projects.filter(x=>x.workflow_status==="pending").map(x=>'<div class="panel"><strong>'+safe(x.name)+'</strong><p>تأییدکننده: '+safe(x.approver||"مشخص نشده")+'</p>'+(canApprove()?'<div class="actions"><button class="primary" data-decision="approved" data-id="'+x.id+'">تأیید</button><button class="danger" data-decision="rejected" data-id="'+x.id+'">برگشت</button></div>':"<p>فقط مدیر می‌تواند تصمیم بگیرد.</p>")+'</div>').join("")||"<p>پروژه‌ای در انتظار تأیید نیست.</p>";
$("#publishDetails").innerHTML=p?'<strong>'+safe(p.name)+'</strong><p>وضعیت: '+status[st]+'</p>':"پروژه‌ای انتخاب نشده است.";
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
$("#gantt").innerHTML=items.map(x=>{const left=Math.max(0,(Date.parse(x.start_date)-min)/span*100),width=Math.max(1,(Date.parse(x.end_date)-Date.parse(x.start_date))/span*100);return '<div class="gantt-row"><div>'+safe(x.title)+'<br><small>'+safe(x.start_date)+' تا '+safe(x.end_date)+'</small></div><div class="track"><div class="bar" style="right:'+left+'%;width:'+Math.min(width,100-left)+'%"></div></div></div>'}).join("");
}
async function action(fn,successMessage){try{await fn();await load();if(successMessage)alert(successMessage)}catch(e){fail(e)}}
document.addEventListener("DOMContentLoaded",async()=>{
document.addEventListener("click",async e=>{
const nav=e.target.closest("[data-page],[data-jump]");if(nav){show(nav.dataset.page||nav.dataset.jump);return}
const open=e.target.closest("[data-open]");if(open){selected=Number(open.dataset.open);show("center");return}
const dec=e.target.closest("[data-decision]");if(dec&&canApprove())await action(async()=>{await run(sb.from("projects").update({workflow_status:dec.dataset.decision}).eq("id",Number(dec.dataset.id)).eq("workflow_status","pending").select())});
});
$("#selectedProject").addEventListener("change",e=>{selected=Number(e.target.value);render()});
$("#loginForm").addEventListener("submit",e=>{e.preventDefault();action(async()=>{const f=e.target;const {data,error}=await sb.auth.signInWithPassword({email:f.elements.username.value.trim(),password:f.elements.password.value});if(error)throw error;user=data.user})});
$("#logout").addEventListener("click",()=>action(async()=>{await run(sb.auth.signOut());user=null;selected=null}));
$("#projectForm").addEventListener("submit",e=>{e.preventDefault();action(async()=>{if(!canEdit())throw Error("دسترسی ایجاد پروژه ندارید");const v=Object.fromEntries(new FormData(e.target));if(v.endDate<v.startDate)throw Error("تاریخ پایان نامعتبر است");const data=await run(sb.from("projects").insert({name:v.name,manager:v.manager,description:v.description,start_date:v.startDate,end_date:v.endDate,workflow_status:"draft"}).select("id").single());selected=data.id;e.target.reset();show("center")})});
async function saveCharter(e){if(e)e.preventDefault();const notice=$("#charterStatus");notice.textContent="در حال ذخیره منشور...";try{const p=current();if(!p)throw Error("پروژه انتخاب نشده است");if(!editable(p))throw Error("برای ویرایش این پروژه دسترسی ندارید");const v=Object.fromEntries(new FormData($("#charterForm")));const saved=await run(sb.from("projects").update(v).eq("id",p.id).select("id"));if(!saved?.length)throw Error("سرور تغییر را ثبت نکرد");notice.textContent="✓ منشور با موفقیت در دیتابیس ذخیره شد";await load()}catch(err){notice.textContent="خطا در ذخیره: "+(err?.message||err);fail(err)}}
$("#charterForm").addEventListener("submit",saveCharter);
$("#saveCharterButton").addEventListener("click",saveCharter);
$("#phaseForm").addEventListener("submit",e=>{e.preventDefault();action(async()=>{if(!editable(current()))throw Error("امکان ثبت مرحله وجود ندارد");const v=Object.fromEntries(new FormData(e.target));if(v.end<v.start)throw Error("تاریخ پایان نامعتبر است");await run(sb.from("project_phases").insert({project_id:selected,title:v.title,start_date:v.start,end_date:v.end}));e.target.reset()})});
$("#requestApproval").addEventListener("click",()=>action(async()=>{const p=current();if(!editable(p)||!p.objective?.trim())throw Error("ابتدا منشور را ذخیره کنید");await run(sb.from("projects").update({workflow_status:"pending"}).eq("id",p.id).select())}));
$("#publishProject").addEventListener("click",()=>action(async()=>{const p=current();if(!canApprove()||p?.workflow_status!=="approved")throw Error("تأیید مدیر لازم است");await run(sb.from("projects").update({workflow_status:"published"}).eq("id",p.id).select())}));
const {data}=await sb.auth.getUser();user=data?.user||null;await action(async()=>{});
sb.auth.onAuthStateChange((_event,session)=>{user=session?.user||null;setTimeout(()=>load().catch(fail),0)});
});
})();