(() => {
'use strict';
const CORE='entrenador-v03',PROFILE='entrenador-v032-profile',PLANS='entrenador-v04-plans',WORKOUTS='entrenador-v05-workouts',CLINICAL='entrenador-v04-clinical';
const COACH='https://entrenador-personal-coach.morrondin.workers.dev';
const iso=()=>{const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000);return d.toISOString().slice(0,10)};
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||f}catch{return f}};
const workoutHistory=()=>Object.values(read(WORKOUTS,{})).filter(w=>w?.completedAt).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))).slice(-6).map(w=>({kind:'completed_workout',date:w.date,title:w.title||'Entrenamiento',duration_minutes:Number(w.duration||0),exercises:(w.exercises||[]).map(e=>({name:e.name,done:Boolean(e.done),sets:(e.sets||[]).map(s=>({weight:s.weight||'',reps:s.reps||'',done:Boolean(s.done)}))}))}));

const previousFetch=window.fetch.bind(window);
window.fetch=async(input,init={})=>{
 const url=typeof input==='string'?input:(input?.url||'');
 const method=(init?.method||'GET').toUpperCase();
 if(method==='POST'&&url===COACH+'/chat'&&init?.body){
   let q={};try{q=JSON.parse(init.body)}catch{}
   const core=read(CORE,{checkins:{}}),today=core.checkins?.[iso()]||{},profile=read(PROFILE,{}),clinical=read(CLINICAL,{}),plans=read(PLANS,{}),current=plans[iso()]?.session||q.currentPlan?.session||null;
   const userText=String(q.message||'').trim();
   const body={
     profile:{age:profile.age||54,height_m:profile.height||1.78,weight:profile.weight||'70-73',days_per_week:profile.days||5,resources:profile.resources||[],goals:profile.goals||{},available_minutes:Number(q.daily?.availableTime||40),experience:'Experiencia prolongada en fuerza',coach_request:`El usuario está revisando la sesión propuesta y pregunta: "${userText}". Responde a esa petición mediante la sesión y el campo message. Si no conviene cambiar, conserva una sesión segura y explica brevemente por qué. Si conviene cambiar, genera la sesión revisada. Evita repetir sin motivo lo entrenado ayer.`},
     checkin:{date:iso(),can_train:true,place:today.place||'',energy:Number(today.energy||0),sleep:today.sleep||'',fatigue:today.fatigue||'',achilles:today.achilles||'',swelling:today.swelling||'',weight:today.weight||''},
     physio:{appointment_today:today.physio==='Sí',notes:today.physioNotes||'',after_appointment:Boolean((today.physioNotes||'').trim())},
     recentHistory:[...workoutHistory(),{kind:'current_session',session:current},{kind:'user_change_request',text:userText}].slice(-14),
     confirmedRestrictions:q.confirmedRestrictions||clinical.confirmedRestrictions||[]
   };
   const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),30000);
   try{
     const r=await previousFetch(COACH+'/coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal});
     const d=await r.json().catch(()=>({}));
     if(!r.ok)return new Response(JSON.stringify({error:d.error||'No se pudo consultar al entrenador',detail:d.detail||`Error ${r.status}`}),{status:r.status,headers:{'Content-Type':'application/json'}});
     const changed=Boolean(d.session);
     let reply=String(d.message||d.session?.reason||'').trim();
     if(!reply)reply=changed?'He revisado tu propuesta y he ajustado la sesión.':'He revisado tu propuesta. Mantendría la sesión actual.';
     return new Response(JSON.stringify({reply,updated_session:changed?d.session:null,needs_confirmation:Boolean(d.needs_confirmation),clinical_update:d.clinical_update||null}),{status:200,headers:{'Content-Type':'application/json'}});
   }catch(e){
     const timeout=e?.name==='AbortError';
     return new Response(JSON.stringify({error:timeout?'El entrenador está tardando demasiado':'No se pudo consultar al entrenador',detail:timeout?'Prueba de nuevo en unos segundos.':(e?.message||'Error de conexión')}),{status:504,headers:{'Content-Type':'application/json'}});
   }finally{clearTimeout(timer)}
 }
 return previousFetch(input,init);
};

// Añade feedback visible al botón del chat sin tocar la lógica base.
document.addEventListener('click',e=>{
 const b=e.target.closest('#sendChat');if(!b)return;
 setTimeout(()=>{if(b.disabled){b.dataset.oldText=b.textContent;b.textContent='EL ENTRENADOR ESTÁ PENSANDO…'}},0);
 const obs=new MutationObserver(()=>{if(!b.disabled){b.textContent=b.dataset.oldText||'ENVIAR';obs.disconnect()}});obs.observe(b,{attributes:true,attributeFilter:['disabled']});
},true);

const ver=()=>{const d=document.querySelector('#date');if(d)d.innerHTML=d.innerHTML.split('<br>')[0]+'<br>v0.5.6';const v=document.querySelector('.version');if(v)v.textContent='Entrenador Personal · v0.5.6'};ver();setTimeout(ver,900);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=056').then(r=>r.update()).catch(()=>{}));
})();