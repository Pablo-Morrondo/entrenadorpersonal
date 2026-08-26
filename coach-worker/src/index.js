const SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['status','needs_confirmation','clinical_update','session','message'],
  properties: {
    status: {type:'string',enum:['ready','pending_physio','recovery_only','stop']},
    needs_confirmation: {type:'boolean'},
    clinical_update: {
      type:'object', additionalProperties:false,
      required:['treatment','exercises','permissions','restrictions','crutches','weight_bearing','next_appointment','summary'],
      properties:{
        treatment:{type:'array',items:{type:'string'}}, exercises:{type:'array',items:{type:'string'}},
        permissions:{type:'array',items:{type:'string'}}, restrictions:{type:'array',items:{type:'string'}},
        crutches:{type:['integer','null']}, weight_bearing:{type:['string','null']},
        next_appointment:{type:['string','null']}, summary:{type:'string'}
      }
    },
    session:{
      anyOf:[{type:'null'},{type:'object',additionalProperties:false,
        required:['title','objective','duration_minutes','load','reason','exercises'],
        properties:{title:{type:'string'},objective:{type:'string'},duration_minutes:{type:'integer'},load:{type:'string',enum:['baja','media','alta']},reason:{type:'string'},exercises:{type:'array',items:{type:'object',additionalProperties:false,required:['name','sets','reps','load_guidance','rest_seconds','technique'],properties:{name:{type:'string'},sets:{type:'integer'},reps:{type:'string'},load_guidance:{type:'string'},rest_seconds:{type:'integer'},technique:{type:'string'}}}}}
      }]},
    message:{type:'string'}
  }
};

const INSTRUCTIONS = `Eres el motor de un entrenador personal para un hombre de 54 años con lesión parcial del Aquiles izquierdo en el segundo mes de recuperación. Las indicaciones del traumatólogo y fisioterapeuta tienen prioridad absoluta. Nunca autorices carrera, trail, saltos, movimientos explosivos, bici de carretera, carga del miembro lesionado ni ejercicios nuevos de rehabilitación sin permiso clínico explícito en los datos recibidos. La bicicleta estática solo puede proponerse si figura como permitida y el semáforo no es rojo. Interpreta las notas del fisio, pero devuelve needs_confirmation=true cuando extraigas o cambies permisos, restricciones, apoyo, muletas o ejercicios. No conviertas el texto ambiguo en autorización. Si hay dolor claramente mayor, pérdida funcional, inflamación importante o síntomas preocupantes, status=stop y no generes sesión. Si hay fisio pendiente hoy y aún no hay notas posteriores, status=pending_physio. Diseña únicamente la sesión de hoy, usando ejercicios sentados o tumbados cuando sea necesario para proteger el Aquiles. No des diagnóstico médico. Sé conciso y devuelve exclusivamente el esquema solicitado.`;

function cors(origin, allowed){
  const ok=origin===allowed||origin===`${allowed}/`;
  return {'Access-Control-Allow-Origin':ok?origin:allowed,'Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin','Content-Type':'application/json; charset=utf-8'};
}

export default {
  async fetch(request, env){
    const origin=request.headers.get('Origin')||'';
    const headers=cors(origin,env.ALLOWED_ORIGIN);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(new URL(request.url).pathname==='/health')return Response.json({ok:true},{headers});
    if(request.method!=='POST'||new URL(request.url).pathname!=='/coach')return Response.json({error:'Not found'},{status:404,headers});
    if(origin&&origin!==env.ALLOWED_ORIGIN)return Response.json({error:'Origin not allowed'},{status:403,headers});
    if(!env.OPENAI_API_KEY)return Response.json({error:'Server not configured'},{status:503,headers});
    let payload;try{payload=await request.json()}catch{return Response.json({error:'Invalid JSON'},{status:400,headers})}
    const safePayload={profile:payload.profile||{},checkin:payload.checkin||{},physio:payload.physio||{},recentHistory:Array.isArray(payload.recentHistory)?payload.recentHistory.slice(-14):[],confirmedRestrictions:payload.confirmedRestrictions||[]};
    const api=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Authorization':`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:env.OPENAI_MODEL||'gpt-5-mini',store:false,instructions:INSTRUCTIONS,input:JSON.stringify(safePayload),text:{format:{type:'json_schema',name:'coach_plan',strict:true,schema:SCHEMA}}})});
    const data=await api.json();
    if(!api.ok)return Response.json({error:'Coach service error',detail:data?.error?.message||'Unknown error'},{status:502,headers});
    const output=data.output_text||data.output?.flatMap(x=>x.content||[]).find(x=>x.type==='output_text')?.text;
    try{return Response.json(JSON.parse(output),{headers})}catch{return Response.json({error:'Invalid coach response'},{status:502,headers})}
  }
};
