const EXERCISE={type:'object',additionalProperties:false,required:['name','sets','reps','load_guidance','rest_seconds','technique'],properties:{name:{type:'string'},sets:{type:'integer'},reps:{type:'string'},load_guidance:{type:'string'},rest_seconds:{type:'integer'},technique:{type:'string'}}};
const SESSION={type:'object',additionalProperties:false,required:['title','objective','duration_minutes','load','reason','exercises'],properties:{title:{type:'string'},objective:{type:'string'},duration_minutes:{type:'integer'},load:{type:'string',enum:['baja','media','alta']},reason:{type:'string'},exercises:{type:'array',items:EXERCISE}}};
const SCHEMA={type:'object',additionalProperties:false,required:['status','needs_confirmation','clinical_update','session','message'],properties:{status:{type:'string',enum:['ready','pending_physio','recovery_only','stop']},needs_confirmation:{type:'boolean'},clinical_update:{type:'object',additionalProperties:false,required:['treatment','exercises','permissions','restrictions','crutches','weight_bearing','next_appointment','summary'],properties:{treatment:{type:'array',items:{type:'string'}},exercises:{type:'array',items:{type:'string'}},permissions:{type:'array',items:{type:'string'}},restrictions:{type:'array',items:{type:'string'}},crutches:{type:['integer','null']},weight_bearing:{type:['string','null']},next_appointment:{type:['string','null']},summary:{type:'string'}}},session:{anyOf:[{type:'null'},SESSION]},message:{type:'string'}}};
const CHAT_SCHEMA={type:'object',additionalProperties:false,required:['reply','updated_session'],properties:{reply:{type:'string'},updated_session:{anyOf:[{type:'null'},SESSION]}}};
const GARMIN_SCHEMA={type:'object',additionalProperties:false,required:['type','date','duration_minutes','distance_km','avg_hr','max_hr','elevation_m','calories','notes'],properties:{type:{type:'string',enum:['Fuerza','Carrera','Bici','Caminar','Movilidad','Otro']},date:{type:['string','null']},duration_minutes:{type:['number','null']},distance_km:{type:['number','null']},avg_hr:{type:['integer','null']},max_hr:{type:['integer','null']},elevation_m:{type:['number','null']},calories:{type:['integer','null']},notes:{type:'string'}}};

const INSTRUCTIONS=`Eres el motor de un entrenador personal digital. El usuario tiene una recuperación activa del Aquiles izquierdo. Una prohibición o restricción explícita del traumatólogo o fisioterapeuta tiene prioridad absoluta, igual que las señales rojas.
No conviertas la ausencia de autorización clínica explícita en una prohibición automática. Considera disponible una actividad que el historial demuestre realizada y tolerada sin dolor, tirantez, inflamación ni empeoramiento posterior, aunque el fisio no haya escrito literalmente que está permitida. Esto incluye la bicicleta estática. Mantén criterio estricto para carrera, trail, saltos, impactos, movimientos explosivos, bici de carretera y progresiones nuevas de rehabilitación.
Evalúa respuesta a 24 h: igual o mejor = mantener o progresar una sola variable; empeoramiento leve = reducir; empeoramiento claro/señal roja = detener esa actividad.
Diseña únicamente la sesión de hoy. Usa historial reciente para no repetir por inercia la misma plantilla o grupos en días consecutivos. Alterna fuerza, cardio disponible, core, recuperación y descanso según recuperación, energía, sueño, fatiga, objetivos y tiempo.
Las opciones de lugar son posibilidades, no órdenes. No uses modalidades no disponibles. Si omites core o rehabilitación por tiempo/carga/seguridad, indícalo brevemente.
Si hay ejercicios de rehabilitación explícitamente autorizados, inclúyelos sin inventar progresiones. No des diagnóstico médico. Devuelve exclusivamente el esquema solicitado.`;

const CHAT_INSTRUCTIONS=`Eres el entrenador contextual durante una sesión. Responde en español, breve, práctico y sin juzgar. Tienes plan actual, progreso, historial reciente, check-in y restricciones.
Resuelve cambios como quitar/añadir bici estática, máquina ocupada, menos tiempo, cambiar ejercicio, cansancio o dudas sobre pierna. La ausencia de permiso explícito no es una prohibición por sí sola; una actividad ya realizada y tolerada puede mantenerse. Sé estricto con impacto, carrera, trail, saltos, bici de carretera y progresiones nuevas de rehabilitación.
No repitas automáticamente el grupo del día anterior. Si el cambio es razonable y seguro, devuelve updated_session con la sesión completa modificada. Si solo respondes una duda sin cambiarla, updated_session=null. Responde de forma concisa.`;

const GARMIN_INSTRUCTIONS=`Analiza una captura Garmin. Extrae únicamente datos visibles con confianza. No inventes valores. Si no aparece o no es legible, devuelve null. Clasifica como Fuerza, Carrera, Bici, Caminar, Movilidad u Otro.`;

class UpstreamError extends Error{constructor(message,{code='upstream_error',status=502,upstreamStatus=null,requestId=null}={}){super(message);this.code=code;this.status=status;this.upstreamStatus=upstreamStatus;this.requestId=requestId}}
function cors(origin,allowed){const ok=origin===allowed||origin===`${allowed}/`;return {'Access-Control-Allow-Origin':ok?origin:allowed,'Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin','Content-Type':'application/json; charset=utf-8'}}
function compactPlan(plan){if(!plan||typeof plan!=='object')return null;const s=plan.session||plan;return s&&typeof s==='object'?{title:s.title||'',objective:s.objective||'',duration_minutes:s.duration_minutes||0,load:s.load||'',reason:s.reason||'',exercises:Array.isArray(s.exercises)?s.exercises.slice(0,10):[]}:null}
function compactWorkout(w){if(!w||typeof w!=='object')return null;return {title:w.title||'',status:w.status||'',exercises:Array.isArray(w.exercises)?w.exercises.slice(0,10).map(e=>({name:e.name||'',done:Boolean(e.done),sets:Array.isArray(e.sets)?e.sets.slice(0,5):[]})):[]}}

async function responses(env,{instructions,input,schema,name,timeoutMs=20000,model}){
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);const started=Date.now();let api,data;
 try{
  api=await fetch('https://api.openai.com/v1/responses',{method:'POST',signal:controller.signal,headers:{'Authorization':`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:model||env.OPENAI_MODEL||'gpt-5-mini',store:false,instructions,input,text:{format:{type:'json_schema',name,strict:true,schema}}})});
  const requestId=api.headers.get('x-request-id')||null;
  data=await api.json().catch(()=>({}));
  if(!api.ok){const msg=data?.error?.message||`OpenAI HTTP ${api.status}`;let code='openai_error',status=502;if(api.status===401||api.status===403){code='openai_auth';status=502}else if(api.status===429){code='openai_rate_or_quota';status=429}else if(api.status>=500){code='openai_upstream';status=503}throw new UpstreamError(msg,{code,status,upstreamStatus:api.status,requestId})}
  const output=data.output_text||data.output?.flatMap(x=>x.content||[]).find(x=>x.type==='output_text')?.text;
  if(!output)throw new UpstreamError('OpenAI devolvió una respuesta vacía',{code:'empty_response',status:502,upstreamStatus:api.status,requestId});
  try{return {data:JSON.parse(output),meta:{ms:Date.now()-started,requestId,model:model||env.OPENAI_MODEL||'gpt-5-mini'}}}catch{throw new UpstreamError('OpenAI devolvió JSON no válido',{code:'invalid_json',status:502,upstreamStatus:api.status,requestId})}
 }catch(error){
  if(error?.name==='AbortError')throw new UpstreamError(`Timeout esperando a OpenAI (${Math.round(timeoutMs/1000)} s)`,{code:'openai_timeout',status:504});
  if(error instanceof UpstreamError)throw error;
  throw new UpstreamError(error?.message||'No se pudo conectar con OpenAI',{code:'network_error',status:502});
 }finally{clearTimeout(timer)}
}

export default{async fetch(request,env){
 const origin=request.headers.get('Origin')||'';const headers=cors(origin,env.ALLOWED_ORIGIN);const url=new URL(request.url);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(url.pathname==='/health')return Response.json({ok:true,version:'0.7.1',model:env.OPENAI_MODEL||'gpt-5-mini',chat_model:env.OPENAI_CHAT_MODEL||env.OPENAI_MODEL||'gpt-5-mini'},{headers});
 if(request.method!=='POST')return Response.json({error:'Not found'},{status:404,headers});
 if(origin&&origin!==env.ALLOWED_ORIGIN)return Response.json({error:'Origin not allowed'},{status:403,headers});
 if(!env.OPENAI_API_KEY)return Response.json({error:'Server not configured',code:'missing_api_key'},{status:503,headers});
 let payload;try{payload=await request.json()}catch{return Response.json({error:'Invalid JSON'},{status:400,headers})}
 try{
  if(url.pathname==='/coach'){
   const safePayload={profile:{age:payload.profile?.age,height_m:payload.profile?.height_m,weight:payload.profile?.weight,resources:payload.profile?.resources||[],goals:payload.profile?.goals||{},available_minutes:payload.profile?.available_minutes},checkin:payload.checkin||{},physio:{appointment_today:payload.physio?.appointment_today,notes:String(payload.physio?.notes||'').slice(0,1800),current_state:String(payload.physio?.current_state||'').slice(0,600)},recentHistory:Array.isArray(payload.recentHistory)?payload.recentHistory.slice(-8):[],confirmedRestrictions:payload.confirmedRestrictions||[]};
   const out=await responses(env,{instructions:INSTRUCTIONS,input:JSON.stringify(safePayload),schema:SCHEMA,name:'coach_plan',timeoutMs:Number(env.COACH_TIMEOUT_MS)||25000});
   return Response.json({...out.data,_meta:out.meta},{headers});
  }
  if(url.pathname==='/chat'){
   const safe={message:String(payload.message||'').slice(0,700),checkin:payload.checkin||{},currentPlan:compactPlan(payload.currentPlan),workoutProgress:compactWorkout(payload.workoutProgress),recentHistory:Array.isArray(payload.recentHistory)?payload.recentHistory.slice(-5).map(x=>({date:x.date||x.workoutDate||'',type:x.type||'',notes:String(x.notes||'').slice(0,220),exerciseLog:Array.isArray(x.exerciseLog)?x.exerciseLog.slice(0,8):[]})):[],confirmedRestrictions:payload.confirmedRestrictions||[]};
   const out=await responses(env,{instructions:CHAT_INSTRUCTIONS,input:JSON.stringify(safe),schema:CHAT_SCHEMA,name:'coach_chat',timeoutMs:Number(env.CHAT_TIMEOUT_MS)||12000,model:env.OPENAI_CHAT_MODEL||env.OPENAI_MODEL||'gpt-5-mini'});
   return Response.json({...out.data,_meta:out.meta},{headers});
  }
  if(url.pathname==='/garmin'){
   const image=String(payload.image||'');if(!image.startsWith('data:image/'))return Response.json({error:'Imagen no válida'},{status:400,headers});if(image.length>2600000)return Response.json({error:'Imagen demasiado grande'},{status:413,headers});
   const input=[{role:'user',content:[{type:'input_text',text:'Extrae los datos de esta captura Garmin.'},{type:'input_image',image_url:image}]}];
   const out=await responses(env,{instructions:GARMIN_INSTRUCTIONS,input,schema:GARMIN_SCHEMA,name:'garmin_activity',timeoutMs:Number(env.GARMIN_TIMEOUT_MS)||25000});
   return Response.json({...out.data,_meta:out.meta},{headers});
  }
  return Response.json({error:'Not found'},{status:404,headers});
 }catch(error){
  const status=error?.status||502;return Response.json({error:'Coach service error',code:error?.code||'unknown_error',detail:error?.message||'Unknown error',upstream_status:error?.upstreamStatus||null,request_id:error?.requestId||null},{status,headers});
 }
}};
