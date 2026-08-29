const EXERCISE = {
  type:'object', additionalProperties:false,
  required:['name','sets','reps','load_guidance','rest_seconds','technique'],
  properties:{
    name:{type:'string'}, sets:{type:'integer'}, reps:{type:'string'}, load_guidance:{type:'string'},
    rest_seconds:{type:'integer'}, technique:{type:'string'}
  }
};
const SESSION = {
  type:'object', additionalProperties:false,
  required:['title','objective','duration_minutes','load','reason','exercises'],
  properties:{
    title:{type:'string'}, objective:{type:'string'}, duration_minutes:{type:'integer'},
    load:{type:'string',enum:['baja','media','alta']}, reason:{type:'string'},
    exercises:{type:'array',items:EXERCISE}
  }
};
const SCHEMA = {
  type:'object', additionalProperties:false,
  required:['status','needs_confirmation','clinical_update','session','message'],
  properties:{
    status:{type:'string',enum:['ready','pending_physio','recovery_only','stop']},
    needs_confirmation:{type:'boolean'},
    clinical_update:{
      type:'object',additionalProperties:false,
      required:['treatment','exercises','permissions','restrictions','crutches','weight_bearing','next_appointment','summary'],
      properties:{
        treatment:{type:'array',items:{type:'string'}},exercises:{type:'array',items:{type:'string'}},
        permissions:{type:'array',items:{type:'string'}},restrictions:{type:'array',items:{type:'string'}},
        crutches:{type:['integer','null']},weight_bearing:{type:['string','null']},
        next_appointment:{type:['string','null']},summary:{type:'string'}
      }
    },
    session:{anyOf:[{type:'null'},SESSION]},message:{type:'string'}
  }
};
const CHAT_SCHEMA={
  type:'object',additionalProperties:false,required:['reply','updated_session'],
  properties:{reply:{type:'string'},updated_session:{anyOf:[{type:'null'},SESSION]}}
};
const GARMIN_SCHEMA={
  type:'object',additionalProperties:false,
  required:['type','date','duration_minutes','distance_km','avg_hr','max_hr','elevation_m','calories','notes'],
  properties:{
    type:{type:'string',enum:['Fuerza','Carrera','Bici','Caminar','Movilidad','Otro']},
    date:{type:['string','null']},duration_minutes:{type:['number','null']},distance_km:{type:['number','null']},
    avg_hr:{type:['integer','null']},max_hr:{type:['integer','null']},elevation_m:{type:['number','null']},
    calories:{type:['integer','null']},notes:{type:'string'}
  }
};

const INSTRUCTIONS=`Eres el motor de un entrenador personal digital. El usuario tiene una recuperación activa del Aquiles izquierdo. Una prohibición o restricción explícita del traumatólogo o fisioterapeuta tiene prioridad absoluta, igual que las señales rojas.
No conviertas la ausencia de autorización clínica explícita en una prohibición automática. Considera disponible una actividad que el historial demuestre realizada y tolerada sin dolor, tirantez, inflamación ni empeoramiento posterior, aunque el fisio no haya escrito literalmente que está permitida. Esto incluye la bicicleta estática. Mantén, en cambio, un criterio estricto para carrera, trail, saltos, impactos, movimientos explosivos, bici de carretera, cargas nuevas relevantes sobre el miembro lesionado y ejercicios o progresiones nuevas de rehabilitación.
Interpreta las notas del fisio, pero devuelve needs_confirmation=true cuando extraigas o cambies permisos, restricciones, apoyo, muletas o ejercicios. No conviertas texto ambiguo en autorización ni en prohibición. Si hay dolor claramente mayor, pérdida funcional, inflamación importante o síntomas preocupantes, status=stop y no generes sesión. Si hay fisio pendiente hoy y aún no hay notas posteriores, status=pending_physio.
Evalúa la respuesta de las 24 horas posteriores a la última carga comparable: si está igual o mejor, mantén o progresa una sola variable de forma gradual; si hay un empeoramiento leve, reduce carga, volumen o duración; si hay empeoramiento claro o una señal roja, detén esa actividad y prioriza revisión clínica.
Diseña únicamente la sesión de hoy. Lee ejercicios, grupos musculares, cardio y carga del historial reciente. No repitas por inercia la misma plantilla ni los mismos grupos en días consecutivos: alterna inteligentemente fuerza, cardio disponible, core, recuperación y descanso según recuperación, energía, sueño, fatiga, objetivos y tiempo. Repite un grupo solo cuando su recuperación y el objetivo lo justifiquen, y explícalo brevemente.
Si checkin.places_available contiene varias opciones, son posibilidades reales, no una orden. Tú eliges dónde y qué modalidad usar, y nunca algo fuera de esas opciones.
Aprovecha el tiempo disponible de forma coherente. No recortes core o rehabilitación sin motivo: si los omites por tiempo, carga o seguridad, indícalo brevemente en reason.
Si las notas del fisio contienen ejercicios de rehabilitación explícitamente autorizados, inclúyelos cuando corresponda con el mismo movimiento indicado y explica técnica de forma clara; no inventes ejercicios ni progresiones no autorizadas.
Los ejercicios deben permitir registro por series, repeticiones y carga. Para fuerza usa rangos prácticos y load_guidance concreto cuando haya historial; para rehabilitación usa carga/material autorizado y explicación clara. No des diagnóstico médico. Devuelve exclusivamente el esquema solicitado.`;

const CHAT_INSTRUCTIONS=`Eres el entrenador contextual durante una sesión. Responde en español, breve, práctico y sin juzgar. Tienes el plan actual, progreso ya realizado, historial, check-in, fisio y restricciones.
Puedes resolver cambios como máquina ocupada, cansancio, reducir tiempo, cambiar ejercicio, añadir cardio o preguntar por pierna. Respeta siempre prohibiciones y restricciones explícitas y señales rojas. La ausencia de permiso explícito no es por sí sola una prohibición: una actividad ya realizada y tolerada sin empeoramiento puede mantenerse, incluida la bicicleta estática. Usa la respuesta a 24 horas para mantener, progresar gradualmente o reducir. Sé más estricto con impacto, carrera, trail, saltos, movimientos explosivos, bici de carretera y ejercicios o progresiones nuevas de rehabilitación.
Consulta el historial para no repetir automáticamente ejercicios o grupos musculares ya cargados en la sesión anterior. Si el usuario plantea algo expresamente restringido o aparecen señales rojas, explícalo y adapta el plan.
Si el cambio solicitado es razonable y seguro, devuelve updated_session con la sesión completa ya modificada. Si solo respondes una duda sin cambiar la sesión, updated_session=null. Respeta lo ya completado cuando sea relevante y no aumentes varias variables importantes a la vez.`;

const GARMIN_INSTRUCTIONS=`Analiza una captura de Garmin Connect o de un dispositivo Garmin. Extrae únicamente datos visibles con confianza. No inventes valores. Si un dato no aparece o no es legible, devuelve null. Clasifica la actividad como Fuerza, Carrera, Bici, Caminar, Movilidad u Otro. Convierte la duración a minutos decimales si es necesario. Devuelve notes con una frase corta sobre cualquier dato relevante visible que no tenga campo propio.`;

function cors(origin,allowed){
  const ok=origin===allowed||origin===`${allowed}/`;
  return {'Access-Control-Allow-Origin':ok?origin:allowed,'Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin','Content-Type':'application/json; charset=utf-8'};
}
async function responses(env,{instructions,input,schema,name}){
  let api,data;
  try{
    api=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',headers:{'Authorization':`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({model:env.OPENAI_MODEL||'gpt-5-mini',store:false,instructions,input,text:{format:{type:'json_schema',name,strict:true,schema}}})
    });
    data=await api.json();
  }catch(error){throw new Error(error?.message||'No se pudo conectar con OpenAI')}
  if(!api.ok)throw new Error(data?.error?.message||'Coach service error');
  const output=data.output_text||data.output?.flatMap(x=>x.content||[]).find(x=>x.type==='output_text')?.text;
  if(!output)throw new Error('Respuesta vacía');
  try{return JSON.parse(output)}catch{throw new Error('Respuesta no válida')}
}

export default {
  async fetch(request,env){
    const origin=request.headers.get('Origin')||'';
    const headers=cors(origin,env.ALLOWED_ORIGIN);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    const url=new URL(request.url);
    if(url.pathname==='/health')return Response.json({ok:true,version:'0.5.8'},{headers});
    if(request.method!=='POST')return Response.json({error:'Not found'},{status:404,headers});
    if(origin&&origin!==env.ALLOWED_ORIGIN)return Response.json({error:'Origin not allowed'},{status:403,headers});
    if(!env.OPENAI_API_KEY)return Response.json({error:'Server not configured'},{status:503,headers});
    let payload;try{payload=await request.json()}catch{return Response.json({error:'Invalid JSON'},{status:400,headers})}
    try{
      if(url.pathname==='/coach'){
        const safePayload={profile:payload.profile||{},checkin:payload.checkin||{},physio:payload.physio||{},recentHistory:Array.isArray(payload.recentHistory)?payload.recentHistory.slice(-14):[],confirmedRestrictions:payload.confirmedRestrictions||[]};
        const out=await responses(env,{instructions:INSTRUCTIONS,input:JSON.stringify(safePayload),schema:SCHEMA,name:'coach_plan'});
        return Response.json(out,{headers});
      }
      if(url.pathname==='/chat'){
        const safe={message:String(payload.message||'').slice(0,1200),profile:payload.profile||{},checkin:payload.checkin||{},daily:payload.daily||{},currentPlan:payload.currentPlan||null,workoutProgress:payload.workoutProgress||null,recentHistory:Array.isArray(payload.recentHistory)?payload.recentHistory.slice(-12):[],confirmedRestrictions:payload.confirmedRestrictions||[],chatHistory:Array.isArray(payload.chatHistory)?payload.chatHistory.slice(-8):[]};
        const out=await responses(env,{instructions:CHAT_INSTRUCTIONS,input:JSON.stringify(safe),schema:CHAT_SCHEMA,name:'coach_chat'});
        return Response.json(out,{headers});
      }
      if(url.pathname==='/garmin'){
        const image=String(payload.image||'');
        if(!image.startsWith('data:image/'))return Response.json({error:'Imagen no válida'},{status:400,headers});
        if(image.length>2600000)return Response.json({error:'Imagen demasiado grande'},{status:413,headers});
        const input=[{role:'user',content:[{type:'input_text',text:'Extrae los datos de esta captura Garmin.'},{type:'input_image',image_url:image}]}];
        const out=await responses(env,{instructions:GARMIN_INSTRUCTIONS,input,schema:GARMIN_SCHEMA,name:'garmin_activity'});
        return Response.json(out,{headers});
      }
      return Response.json({error:'Not found'},{status:404,headers});
    }catch(error){return Response.json({error:'Coach service error',detail:error?.message||'Unknown error'},{status:502,headers})}
  }
};
