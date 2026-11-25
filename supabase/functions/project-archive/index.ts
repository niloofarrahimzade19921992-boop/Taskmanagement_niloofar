import {createClient} from "npm:@supabase/supabase-js@2.49.4";
const headers={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const out=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{headers});
 if(req.method!=="POST")return out({error:"Method not allowed"},405);
 try{
  const url=Deno.env.get("SUPABASE_URL")!,key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
  const {data:{user},error:authError}=await admin.auth.getUser(token);
  if(authError||!user)return out({error:"ابتدا وارد شوید"},401);
  const {data:profile,error:profileError}=await admin.from("user_profiles").select("is_admin,is_approved").eq("id",user.id).single();
  if(profileError||!profile?.is_admin||!profile?.is_approved)return out({error:"فقط مدیر سامانه اجازه حذف و بازیابی دارد"},403);
  const {action,project_id}=await req.json();
  if(!["archive","restore"].includes(action)||!Number.isSafeInteger(Number(project_id))||Number(project_id)<1)return out({error:"درخواست نامعتبر"},400);
  const id=Number(project_id);
  const {data:project,error:findError}=await admin.from("projects").select("id,deleted_at").eq("id",id).maybeSingle();
  if(findError)throw findError;
  if(!project)return out({error:"پروژه پیدا نشد"},404);
  if(action==="archive"&&project.deleted_at)return out({error:"پروژه قبلاً حذف شده"},409);
  if(action==="restore"&&!project.deleted_at)return out({error:"پروژه در فهرست فعال است"},409);
  const values=action==="archive"?{deleted_at:new Date().toISOString(),deleted_by:user.id}:{deleted_at:null,deleted_by:null};
  const {data,error}=await admin.from("projects").update(values).eq("id",id).select("id,deleted_at").single();
  if(error)throw error;
  return out({ok:true,project:data});
 }catch(e){return out({error:e?.message||"خطای سرور"},500)}
});