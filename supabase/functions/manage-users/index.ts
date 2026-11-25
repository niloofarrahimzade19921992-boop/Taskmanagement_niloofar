import { createClient } from "npm:@supabase/supabase-js@2.49.4";
const headers={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{headers});
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 try{
  const url=Deno.env.get("SUPABASE_URL")!,pub=Deno.env.get("SUPABASE_ANON_KEY")!,secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
  if(!token)return reply({error:"ابتدا وارد شوید"},401);
  const admin=createClient(url,secret,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:{user},error:authError}=await admin.auth.getUser(token);
  if(authError||!user)return reply({error:"نشست نامعتبر است"},401);
  const {data:caller,error:callerError}=await admin.from("user_profiles").select("is_admin,is_approved").eq("id",user.id).single();
  if(callerError||!caller?.is_admin||!caller?.is_approved)return reply({error:"فقط مدیر سامانه مجاز است"},403);
  const body=await req.json();
  if(body.action==="list"){
   const {data,error}=await admin.from("user_profiles").select("id,full_name,role,is_approved,is_admin").order("full_name");
   if(error)throw error;
   const {data:grants,error:permError}=await admin.from("user_permissions").select("user_id,permission_key,allowed");
   if(permError)throw permError;
   return reply({users:data.map(u=>({...u,permissions:Object.fromEntries((grants||[]).filter(p=>p.user_id===u.id).map(p=>[p.permission_key,p.allowed]))}))});
  }
  if(body.action==="create"){
   const email=String(body.email||"").trim(),password=String(body.password||""),name=String(body.full_name||"").trim(),role=String(body.role||"responsible");
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<8||!name||!["responsible","support","manager"].includes(role))return reply({error:"نام، ایمیل، رمز حداقل ۸ کاراکتری و نقش معتبر لازم است"},400);
   const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:name}});
   if(error)return reply({error:error.message},400);
   const id=data.user.id;
   const {error:profileError}=await admin.from("user_profiles").upsert({id,full_name:name,role,is_approved:true,is_admin:false},{onConflict:"id"});
   if(profileError){await admin.auth.admin.deleteUser(id);throw profileError}
   return reply({ok:true});
  }
  if(body.action==="permissions"){
   const id=String(body.id||"");
   if(id===user.id)return reply({error:"مجوزهای حساب خودتان را از این بخش تغییر ندهید"},400);
   const {data:target,error:targetError}=await admin.from("user_profiles").select("id,is_admin").eq("id",id).maybeSingle();
   if(targetError||!target)return reply({error:"کاربر یافت نشد"},404);
   if(target.is_admin)return reply({error:"مجوزهای مدیر سامانه قابل محدودسازی نیست"},400);
   const keys=["home","center","create","charter","schedule","approvals","publish","list","trash","users"];
   const permissions=body.permissions;
   if(!permissions||typeof permissions!=="object"||Array.isArray(permissions)||Object.keys(permissions).some(k=>!keys.includes(k)||typeof permissions[k]!=="boolean")||Object.keys(permissions).length!==keys.length)return reply({error:"مجوزها نامعتبر هستند"},400);
   const {error:upError}=await admin.from("user_permissions").upsert(keys.map(k=>({user_id:id,permission_key:k,allowed:permissions[k]})),{onConflict:"user_id,permission_key"});
   if(upError)throw upError;
   return reply({ok:true});
  }
  if(body.action==="update"){
   const id=String(body.id||"");if(id===user.id)return reply({error:"نقش یا وضعیت حساب خودتان را از این بخش تغییر ندهید"},400);
   const role=String(body.role||"responsible");if(!["responsible","support","manager"].includes(role)||typeof body.is_approved!=="boolean")return reply({error:"اطلاعات نامعتبر است"},400);
   const {error}=await admin.from("user_profiles").update({role,is_approved:body.is_approved}).eq("id",id);
   if(error)throw error;return reply({ok:true});
  }
  return reply({error:"عملیات نامعتبر"},400);
 }catch(e){return reply({error:e?.message||"خطای سرور"},500)}
});