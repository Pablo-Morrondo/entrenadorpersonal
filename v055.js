(() => {
'use strict';
const CORE='entrenador-v03',PROFILE='entrenador-v032-profile',PLANS='entrenador-v04-plans',WORKOUTS='entrenador-v05-workouts',CLINICAL='entrenador-v04-clinical';
const COACH='https://entrenador-personal-coach.morrondin.workers.dev';
const PATCH='entrenador-v055-history-patch';
const iso=()=>{const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000);return d.toISOString().slice(0,10)};
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||f}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const workoutHistory=()=>Object.values(read(WORKOUTS,{})).filter(w=>w&&w.completedAt).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))).slice(-10).map(w=>({
  kind:'completed_workout',date:w.date,title:w.title||'Entrenamiento',duration_minutes:Number(w.duration||0),
  exercises:(w.exercises||[]).map(e=>({name:e.name,done:Boolean(e.done),sets:(e.sets||[]).map(s=>({weight:s.weight||'',reps:s.reps||'',done:Boolean(s.done)}))}))
}));
const baseFetch=window.fetch.bind(window);
window.fetch=async(input,init={})=>{
  const url=typeof input==='string'?input:(input?.url||'');
  const isPost=(init?.method||'GET').toUpperCase()==='POST';
  if(isPost&&url===COACH+'/coach'&&init?.body){
    try{
      const body=JSON.parse(init.body),history=workoutHistory();
      body.recentHistory=[...(Array.isArray(body.recentHistory)?body.recentHistory:[]),...history].slice(-14);
      body.profile={...(body.profile||{}),training_history_instruction:'Usa los entrenamientos completados como historial real. Evita repetir automáticamente los mismos grupos musculares y ejercicios de la sesión anterior; alterna fuerza, cardio autorizado, recuperación o descanso según objetivos, fatiga, fisio y tiempo. Si repites un ejercicio, debe existir una razón de progresión clara.'};
      init={...init,body:JSON.stringify(body)};
    }catch{}
    return baseFetch(input,init);
  }
  if(isPost&&url===COACH+'/chat'&&init?.body){
    try{
      const q=JSON.parse(init.body),c=q.checkin||{},profile=q.profile||read(PROFILE,{}),clinical=read(CLINICAL,{});
      const requestBody={
        profile:{...profile,user_request:q.message||'',current_session:q.currentPlan?.session||null,workout_progress:q.workoutProgress||null,training_history_instruction:'Esta es una conversación antes o durante el entrenamiento. Responde a la petición del usuario modificando la sesión solo si tiene sentido y es segura. Ten en cuenta la sesión anterior y no repitas automáticamente los mismos grupos musculares. Si propone pierna, cardio u otro cambio, valora primero restricciones clínicas.'},
        checkin:{...c,can_train:c.can_train??c.training==='Sí'},
        physio:{appointment_today:c.physio==='Sí',notes:c.physioNotes||'',after_appointment:Boolean((c.physioNotes||'').trim())},
        recentHistory:[...(Array.isArray(q.recentHistory)?q.recentHistory:[]),...workoutHistory(),{kind:'user_change_request',text:q.message||''}].slice(-14),
        confirmedRestrictions:q.confirmedRestrictions||clinical.confirmedRestrictions||[]
      };
      const r=await baseFetch(COACH+'/coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(requestBody)});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)return new Response(JSON.stringify(d),{status:r.status,headers:{'Content-Type':'application/json'}});
      const reply=d.message||d.session?.reason||'He revisado tu propuesta.';
      return new Response(JSON.stringify({reply,updated_session:d.session||null,needs_confirmation:d.needs_confirmation||false,clinical_update:d.clinical_update||null}),{status:200,headers:{'Content-Type':'application/json'}});
    }catch(e){return new Response(JSON.stringify({error:'No se pudo procesar la conversación',detail:e?.message||'Error'}),{status:502,headers:{'Content-Type':'application/json'}})}
  }
  return baseFetch(input,init);
};

// La primera vez con el parche descarta únicamente el plan de hoy no completado,
// para regenerarlo con el historial real en lugar de conservar una propuesta repetida.
if(!localStorage.getItem(PATCH)){
  const allW=read(WORKOUTS,{}),todayW=allW[iso()];
  if(!todayW?.completedAt){const plans=read(PLANS,{});if(plans[iso()]){delete plans[iso()];write(PLANS,plans)}if(todayW){delete allW[iso()];write(WORKOUTS,allW)}}
  write(PATCH,{appliedAt:new Date().toISOString()});
}
const ver=()=>{const d=document.querySelector('#date');if(d)d.innerHTML=d.innerHTML.split('<br>')[0]+'<br>v0.5.5';const v=document.querySelector('.version');if(v)v.textContent='Entrenador Personal · v0.5.5'};ver();setTimeout(ver,900);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=055').then(r=>r.update()).catch(()=>{}));
})();