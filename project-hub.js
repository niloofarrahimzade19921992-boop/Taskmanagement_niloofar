/* Project-first workspace — browser demo, not production authentication */
(()=>{const key="taskSystemProjects",metaKey="projectHubMeta",usersKey="projectHubUsers";
const get=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const projects=()=>get(key,[]),tasks=()=>get("taskSystemTasks",[]),meta=()=>get(metaKey,{});
const status=m=>m?.state==="published"?"منتشرشده":m?.state==="approved"?"تأییدشده":m?.state==="rejected"?"برگشت‌خورده":m?.state==="pending"?"در انتظار تأیید مدیر":"پیش‌نویس";
const active=()=>Number(document.querySelector("#hubProject")?.value||projects()[0]?.id||0);
function select(){const s=document.querySelector("#hubProject");if(!s)return;const old=s.value;s.innerHTML=projects().map(p=>'<option value="'+p.id+'">'+escape(p.name)+'</option>').join("");if(projects().some(p=>String(p.id)===old))s.value=old;render();}
function render(){const id=active(),p=projects().find(x=>Number(x.id)===id),m=meta()[id]||{},pt=tasks().filter(t=>Number(t.projectId)===id);
const body=document.querySelector("#hubDetails");if(!body)return;
if(!p){body.innerHTML="<p>ابتدا از بخش ایجاد پروژه، یک پروژه ثبت کنید.</p>";return}
body.innerHTML='<div class="hub-card"><h3>'+escape(p.name)+'</h3><p>مدیر پروژه: '+escape(p.manager||"تعیین نشده")+'</p><p>وضعیت انتشار: <strong>'+status(m)+'</strong></p><p>شروع: '+escape(p.startDate||"—")+' | پایان: '+escape(p.endDate||"—")+'</p><p>وظایف مرتبط: '+pt.length+'</p></div>';
const f=document.querySelector("#hubCharter");if(f){f.elements.objective.value=m.objective||"";f.elements.scope.value=m.scope||"";f.elements.deliverables.value=m.deliverables||"";f.elements.managerApproval.value=m.managerApproval||"";}
const list=document.querySelector("#hubList");if(list)list.innerHTML=projects().map(x=>'<tr><td>'+escape(x.name)+'</td><td>'+escape(x.manager||"—")+'</td><td>'+status(meta()[x.id])+'</td><td><button type="button" data-open-project="'+x.id+'">مشاهده</button></td></tr>').join("");
const gantt=document.querySelector("#hubGantt");if(gantt)gantt.innerHTML=pt.length?pt.map((t,i)=>'<div class="hub-gantt-row"><span>'+escape(t.title)+'</span><div class="hub-track"><div style="width:'+Math.max(12,Math.min(100,t.status==="done"?100:t.status==="progress"?60:20))+'%;margin-right:'+Math.min(i*9,35)+'%"></div></div><small>'+escape(t.startDate||"—")+' ← '+escape(t.endDate||"—")+'</small></div>').join(""):'<p>برای این پروژه هنوز وظیفه‌ای ثبت نشده است.</p>';
const approvals=document.querySelector("#hubProjectApprovals");if(approvals)approvals.innerHTML=projects().filter(x=>(meta()[x.id]||{}).state==="pending").map(x=>'<div class="hub-approval">'+escape(x.name)+' <button type="button" data-project-decision="approved" data-id="'+x.id+'">تأیید مدیر</button> <button type="button" data-project-decision="rejected" data-id="'+x.id+'">برگشت</button></div>').join("")||"<p>پروژه‌ای در انتظار تأیید نیست.</p>";
const notice=document.querySelector("#hubNotice");if(notice)notice.textContent="این نسخه نمایشی است؛ تأیید مدیر و ورود کاربران صرفاً در همین مرورگر ثبت می‌شود.";
}
document.addEventListener("DOMContentLoaded",()=>{
const selectEl=document.querySelector("#hubProject");if(!selectEl)return;
selectEl.addEventListener("change",render);select();
document.querySelector("#hubCharter")?.addEventListener("submit",e=>{e.preventDefault();const id=active();if(!id)return;const data=meta(),form=e.currentTarget;data[id]={...(data[id]||{}),objective:form.elements.objective.value,scope:form.elements.scope.value,deliverables:form.elements.deliverables.value,managerApproval:form.elements.managerApproval.value,state:"draft"};save(metaKey,data);render();alert("منشور به‌صورت پیش‌نویس ذخیره شد.")});
document.querySelector("#hubRequestApproval")?.addEventListener("click",()=>{const id=active(),d=meta();if(!id)return;if(!d[id]?.objective?.trim()){alert("ابتدا منشور پروژه را تکمیل و ذخیره کنید.");return}d[id].state="pending";save(metaKey,d);render()});
document.querySelector("#hubPublish")?.addEventListener("click",()=>{const id=active(),d=meta();if(d[id]?.state!=="approved"){alert("انتشار فقط پس از تأیید مدیر امکان‌پذیر است.");return}d[id].state="published";save(metaKey,d);render()});
document.addEventListener("click",e=>{const open=e.target.closest("[data-open-project]");if(open){selectEl.value=open.dataset.openProject;render();document.querySelector('[data-section="project-center"]')?.click()}const btn=e.target.closest("[data-project-decision]");if(btn){const d=meta(),id=btn.dataset.id;d[id]={...(d[id]||{}),state:btn.dataset.projectDecision};save(metaKey,d);render()}});
document.querySelector("#hubRefresh")?.addEventListener("click",select);
document.querySelector("#hubLogin")?.addEventListener("submit",e=>{e.preventDefault();const name=e.currentTarget.elements.username.value.trim();if(!name)return;sessionStorage.setItem("hubDemoUser",name);document.querySelector("#hubCurrentUser").textContent="کاربر نمایشی: "+name;alert("ورود نمایشی انجام شد؛ این فرم احراز هویت امن نیست.")});
document.querySelector("#hubCurrentUser").textContent="کاربر نمایشی: "+(sessionStorage.getItem("hubDemoUser")||"مهمان");
document.querySelector("#hubUsers")?.addEventListener("submit",e=>{e.preventDefault();const name=e.currentTarget.elements.person.value.trim();if(!name)return;const a=get(usersKey,[]);a.push(name);save(usersKey,a);e.currentTarget.reset();showUsers()});
function showUsers(){document.querySelector("#hubUsersList").textContent=get(usersKey,[]).join("، ")||"کاربری اضافه نشده است."}showUsers();
});
})();