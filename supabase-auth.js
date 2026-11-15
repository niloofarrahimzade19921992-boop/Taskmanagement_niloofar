/* Supabase authentication gate. Never use a service_role key in browser code. */
(() => {
  "use strict";
  const URL = "https://xgrtcsudpqcznhlkberz.supabase.co";
  const KEY = "sb_publishable_kyEmcxiKYeNFgnPTBqnjqw_BxrCP7hu";
  const client = window.supabase?.createClient(URL, KEY);
  if (!client) { console.error("Supabase SDK could not be loaded."); return; }
  window.taskSystemSupabase = client;
  const css = document.createElement("style");
  css.textContent = `
    #authGate {position:fixed;inset:0;z-index:99999;background:#f5f1e9;display:flex;align-items:center;justify-content:center;padding:20px;direction:rtl;font-family:inherit}
    #authGate[hidden]{display:none!important}
    #authGate .auth-card{width:min(420px,100%);padding:30px;border-radius:16px;background:white;box-shadow:0 12px 40px #0002}
    #authGate input,#authGate button{box-sizing:border-box;width:100%;padding:12px;margin-top:12px;border-radius:9px;font:inherit}
    #authGate input{border:1px solid #ccc}
    #authGate button{background:#246957;color:white;border:0;cursor:pointer}
    #authGate button:disabled{opacity:.6;cursor:wait}
    #authGate p{line-height:1.8}
    #authLogout{position:fixed;bottom:16px;left:16px;z-index:9000;background:#fff;color:#246957;border:1px solid #246957;border-radius:10px;padding:8px 12px;cursor:pointer}
    #authLogout[hidden]{display:none!important}
  `;
  document.head.appendChild(css);
  const gate = document.createElement("section");
  gate.id = "authGate";
  gate.setAttribute("aria-label","ورود به سامانه");
  gate.innerHTML = `<div class="auth-card"><h2>ورود به سامانه مدیریت وظایف</h2>
    <p>با حساب تأییدشده سازمانی وارد شوید.</p>
    <form id="authLoginForm"><label for="authEmail">ایمیل</label><input id="authEmail" type="email" autocomplete="username" required>
    <label for="authPassword">رمز عبور</label><input id="authPassword" type="password" autocomplete="current-password" required>
    <button type="submit" id="authSubmit">ورود</button></form>
    <p id="authMessage" role="alert"></p></div>`;
  document.body.appendChild(gate);
  const logout = document.createElement("button");
  logout.id = "authLogout"; logout.hidden = true; logout.textContent = "خروج از حساب";
  document.body.appendChild(logout);
  const message = gate.querySelector("#authMessage");
  const submit = gate.querySelector("#authSubmit");
  async function refresh() {
    gate.hidden = false; logout.hidden = true;
    const {data:{user},error} = await client.auth.getUser();
    if(error || !user) {message.textContent = ""; return;}
    const {data:profile,error:profileError} = await client.from("user_profiles").select("id,is_approved").eq("id",user.id).maybeSingle();
    if(profileError || !profile?.is_approved) {
      message.textContent = "حساب شما هنوز در سامانه تأیید نشده یا پروفایل شما موجود نیست.";
      return;
    }
    gate.hidden = true; logout.hidden = false; message.textContent = "";
  }
  gate.querySelector("form").addEventListener("submit",async (event)=>{
    event.preventDefault(); submit.disabled=true; message.textContent="در حال بررسی...";
    const email=gate.querySelector("#authEmail").value.trim();
    const password=gate.querySelector("#authPassword").value;
    const {error}=await client.auth.signInWithPassword({email,password});
    if(error){message.textContent="ورود ناموفق بود. ایمیل یا رمز عبور را بررسی کنید.";}
    else await refresh();
    submit.disabled=false;
  });
  logout.addEventListener("click",async()=>{await client.auth.signOut();await refresh();});
  client.auth.onAuthStateChange(()=>{setTimeout(refresh,0);});
  refresh();
})();