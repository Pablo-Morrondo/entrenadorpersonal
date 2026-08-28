(() => {
'use strict';
const CORE='entrenador-v03',PROFILE='entrenador-v032-profile',PLANS='entrenador-v04-plans',WORKOUTS='entrenador-v05-workouts',CLINICAL='entrenador-v04-clinical';
const COACH='https://entrenador-personal-coach.morrondin.workers.dev';
const iso=()=>{const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000);return d.toISOString().slice(0,10)};
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||f}catch{return f}};
const compactHistory=()=>Object.values(read(WORKOUTS,{})).filter(w=>w?.completedAt).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))).slice(-3).map(w=>({date:w.date,title:w.title||'Entrenamiento',exercises:(w.exercises||[]).filter(e=>e.done).map(e=>e.name).slice(0,12)}));
const previousFetch=window.fetch.bind(window);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const wantsChange=t=>/\b(cambia|cambiar|metemos|meter|añade|anade|quita|solo cardio|solo bici|pierna|bici|cardio|sustituye|sustituir|haz|hacemos)\b/i.test(t||'');

async function coachCall(body,timeoutMs=60000){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{return await previousFetch(COACH+'/coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal})}
 finally{clearTimeout(timer)}
}

window.fetch=async(input,init={})=>{
 const url=typeof input==='string'?input:(input?.url||''),method=(init?.method||'GET').toUpperCase();
 if(method==='POST'&&url===COACH+'/chat'&&init?.body){
   let q={};try{q=JSON.parse(init.body)}catch{}
   const text=String(q.message||'').trim(),core=read(CORE,{checkins:{}}),today=core.checkins?.[iso()]||{},profile=read(PROFILE,{}),clinical=read(CLINICAL,{}),plans=read(PLANS,{}),current=plans[iso()]?.session||q.currentPlan?.session||null,change=wantsChange(text);
   const currentCompact=current?{title:current.title,objective:current.objective,exercises:(current.exercises||[]).map(e=>e.name)}:null;
   const request=change
    ?`El usuario quiere revisar la sesión propuesta y pregunta: "${text}". Decide si conviene modificarla. Si la cambias, genera una nueva sesión completa y segura. Si no conviene, conserva una sesión coherente y explica brevemente por qué en message. Ten muy en cuenta lo entrenado ayer y no repitas por inercia.`
    :`Modo conversación breve. El usuario pregunta sobre su sesión actual: "${text}". Contesta de forma breve y útil en message. No regeneres la sesión salvo que sea imprescindible; session puede ser null. No inventes autorizaciones clínicas.`;
   const body={
     profile:{age:profile.age||54,height_m:profile.height||1.78,weight:profile.weight||'70-73',days_per_week:profile.days||5,resources:profile.resources||[],available_minutes:Number(q.daily?.availableTime||40),coach_request:request,current_session:currentCompact},
     checkin:{date:iso(),can_train:true,place:today.place||'',energy:Number(today.energy||0),sleep:today.sleep||'',fatigue:today.fatigue||'',achilles:today.achilles||'',swelling:today.swelling||''},
     physio:{appointment_today:today.physio==='Sí',notes:today.physioNotes||'',after_appointment:Boolean((today.physioNotes||'').trim())},
     recentHistory:[...compactHistory(),{kind:'user_question',text}].slice(-8),
     confirmedRestrictions:q.confirmedRestrictions||clinical.confirmedRestrictions||[]
   };
   let lastErr='';
   for(let attempt=0;attempt<2;attempt++){
     try{
       if(attempt)await sleep(1800);
       const r=await coachCall(body,attempt?65000:50000),d=await r.json().catch(()=>({}));
       if(!r.ok){lastErr=d.detail||d.error||`Error ${r.status}`;if((r.status===429||r.status>=500)&&attempt===0)continue;return new Response(JSON.stringify({error:'No se pudo consultar al entrenador',detail:lastErr}),{status:r.status,headers:{'Content-Type':'application/json'}})}
       let reply=String(d.message||d.session?.reason||'').trim();if(!reply)reply='He revisado tu pregunta.';
       return new Response(JSON.stringify({reply,updated_session:change&&d.session?d.session:null,needs_confirmation:Boolean(d.needs_confirmation),clinical_update:d.clinical_update||null}),{status:200,headers:{'Content-Type':'application/json'}});
     }catch(e){lastErr=e?.name==='AbortError'?'El entrenador tardó demasiado en responder.':(e?.message||'Error de conexión');if(attempt===0)continue}
   }
   return new Response(JSON.stringify({error:'No se pudo consultar al entrenador',detail:lastErr||'Inténtalo de nuevo dentro de un momento.'}),{status:504,headers:{'Content-Type':'application/json'}});
 }
 return previousFetch(input,init);
};

const ver=()=>{const d=document.querySelector('#date');if(d)d.innerHTML=d.innerHTML.split('<br>')[0]+'<br>v0.5.7';const v=document.querySelector('.version');if(v)v.textContent='Entrenador Personal · v0.5.7'};ver();setTimeout(ver,900);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=057').then(r=>r.update()).catch(()=>{}));
})();
