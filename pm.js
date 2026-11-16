"use strict";
const sb=window.supabase?.createClient("https://xgrtcsudpqcznhlkberz.supabase.co","sb_publishable_kyEmcxiKYeNFgnPTBqnjqw_BxrCP7hu");
const $=id=>document.getElementById(id);
let projects=[],approved=false;
const escapeHTML=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dateText=v=>v?new Date(v+"T12:00:00").toLocaleDateString("fa-IR"):"ثبت نشده";
const day=v=>Math.floor(new Date(v+"T12:00:00").getTime()/86400000);
const today=()=>new Date().toISOString().slice(0,10);
const notice=s=>{$("notice").textContent=s;};
function timing(p){if(!p.start_date||!p.end_date)return {label:"بدون برنامه زمانی",percent:0,type:"none"};
const now=day(today()),start=day(p.start_date),end=day(p.end_date);
if(end<start)return {label:"بازه نامعتبر",percent:0,type:"none"};
if(now>end)return {label:"موعد پایان گذشته",percent:100,type:"late"};
if(now<start)return {label:"هنوز شروع نشده",percent:0,type:"future"};
return {label:"در بازه برنامه",percent:Math.min(100,Math.round((now-start)/Math.max(1,end-start)*100)),type:"active"};}
function table(rows,editable=false){if(!rows.length)return "<p class='pm-muted'>هنوز پروژه‌ای ثبت نشده است.</p>";
return "<div class='pm-table-wrap'><table><thead><tr><th>عنوان پروژه</th><th>مدیر پروژه</th><th>شروع</th><th>پایان</th><th>وضعیت زمانی</th>"+(editable?"<th>عملیات</th>":"")+"</tr></thead><tbody>"+rows.map(p=>{const t=timing(p);return "<tr><td>"+escapeHTML(p.name)+"</td><td>"+escapeHTML(p.manager||"—")+"</td><td>"+dateText(p.start_date)+"</td><td>"+dateText(p.end_date)+"</td><td><span class='pm-badge "+(t.type==="late"?"late":"")+"'>"+t.label+"</span></td>"+(editable?"<td><button type='button' data-edit='"+p.id+"'>ویرایش</button></td>":"")+"</tr>";}).join("")+"</tbody></table></div>";}
function render(){const counts={all:projects.length,scheduled:projects.filter(p=>p.start_date&&p.end_date).length,active:projects.filter(p=>timing(p).type==="active").length,late:projects.filter(p=>timing(p).type==="late").length};
$("stats").innerHTML=[["کل پروژه‌ها",counts.all],["دارای برنامه زمانی",counts.scheduled],["در بازه اجرا",counts.active],["گذشته از موعد",counts.late]].map(([label,value])=>"<div class='pm-stat'>"+escapeHTML(label)+"<strong>"+value.toLocaleString("fa-IR")+"</strong></div>").join("");
$("dashboardProjects").innerHTML=table(projects.slice(0,8));$("projectsTable").innerHTML=table(projects,true);
$("planningList").innerHTML=projects.length?projects.map(p=>{const t=timing(p);return "<article class='pm-card'><h3>"+escapeHTML(p.name)+"</h3><p>از "+dateText(p.start_date)+" تا "+dateText(p.end_date)+"</p><div class='pm-progress'><span style='width:"+t.percent+"%'></span></div><small class='pm-muted'>"+t.label+" | "+t.percent.toLocaleString("fa-IR")+"٪ از بازه زمانی سپری شده (نه پیشرفت واقعی)</small></article>";}).join(""):"<p>پروژه‌ای ثبت نشده است.</p>";
$("monitoringList").innerHTML=table(projects);}
async function load(){const {data,error}=await sb.from("projects").select("id,name,manager,start_date,end_date,description").order("created_at",{ascending:false});if(error){notice("خطا در دریافت پروژه‌ها: "+error.message);return;}projects=data||[];render();}
function resetForm(){$("projectForm").reset();$("projectId").value="";$("formTitle").textContent="تعریف پروژه جدید";$("saveProject").textContent="ثبت پروژه";}
async function checkAuth(){if(!sb){$("loginError").textContent="کتابخانه اتصال به سرور بارگذاری نشد.";return;}const {data:{user}}=await sb.auth.getUser();approved=false;if(user){const {data,error}=await sb.from("user_profiles").select("is_approved").eq("id",user.id).maybeSingle();approved=!error&&data?.is_approved===true;if(!approved)$("loginError").textContent="حساب شما تأیید نشده یا دسترسی پروفایل وجود ندارد.";}
$("loginView").hidden=approved;$("appView").hidden=!approved;$("logout").hidden=!approved;if(approved)await load();}
$("loginForm").addEventListener("submit",async e=>{e.preventDefault();const button=e.currentTarget.querySelector("button");button.disabled=true;$("loginError").textContent="";const {error}=await sb.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});if(error)$("loginError").textContent="ورود ناموفق بود؛ اطلاعات حساب را بررسی کنید.";else await checkAuth();button.disabled=false;});
$("logout").addEventListener("click",async()=>{await sb.auth.signOut();projects=[];render();await checkAuth();});
document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-page]").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll("[data-view]").forEach(x=>x.hidden=x.dataset.view!==b.dataset.page);notice("");}));
$("projectForm").addEventListener("submit",async e=>{e.preventDefault();if(!approved)return;const id=$("projectId").value;const payload={name:$("projectName").value.trim(),manager:$("projectManager").value.trim()||null,start_date:$("projectStart").value||null,end_date:$("projectEnd").value||null,description:$("projectDescription").value.trim()||null};
if(!payload.name)return notice("عنوان پروژه الزامی است.");if(payload.start_date&&payload.end_date&&payload.end_date<payload.start_date)return notice("تاریخ پایان نمی‌تواند قبل از شروع باشد.");
const button=$("saveProject");button.disabled=true;const query=id?sb.from("projects").update(payload).eq("id",Number(id)):sb.from("projects").insert(payload);const {error}=await query.select("id");button.disabled=false;if(error){notice("ثبت انجام نشد: "+error.message);return;}resetForm();notice(id?"پروژه ویرایش شد.":"پروژه ثبت شد.");await load();});
$("projectsTable").addEventListener("click",e=>{const b=e.target.closest("[data-edit]");if(!b)return;const p=projects.find(x=>x.id===Number(b.dataset.edit));if(!p)return;$("projectId").value=p.id;$("projectName").value=p.name;$("projectManager").value=p.manager||"";$("projectStart").value=p.start_date||"";$("projectEnd").value=p.end_date||"";$("projectDescription").value=p.description||"";$("formTitle").textContent="ویرایش پروژه";$("saveProject").textContent="ذخیره تغییرات";$("projectForm").scrollIntoView({behavior:"smooth"});});
$("cancelEdit").addEventListener("click",resetForm);
if(sb){sb.auth.onAuthStateChange(()=>setTimeout(checkAuth,0));checkAuth();}