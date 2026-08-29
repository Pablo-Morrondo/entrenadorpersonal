(() => {
'use strict';
const PLANS='entrenador-v04-plans',WORKOUTS='entrenador-v05-workouts',DAY_RULES='entrenador-v059-day-rules';
const COACH='https://entrenador-personal-coach.morrondin.workers.dev';
const iso=()=>{const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000);return d.toISOString().slice(0,10)};
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||f}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const isBikeName=n=>/\b(bici|bicicleta|spinning|ciclismo|cycling|cicloerg[oó]metro)\b/i.test(String(n||''));
const noBikeText=t=>/(\bno\s+(quiero|hago|hacer|metas?|pongas?|bici|bicicleta)\b|\b(sin|quita|quitar|elimina|eliminar)\s+(la\s+)?(bici|bicicleta)\b|\bno\s+bici\b)/i.test(String(t||''));
const previousFetch=window.fetch.bind(window);

function rules(){return read(DAY_RULES,{})}
function setNoBike(){const r=rules();r[iso()]={...(r[iso()]||{}),noBike:true,updatedAt:new Date().toISOString()};write(DAY_RULES,r)}
function hasNoBike(){return Boolean(rules()[iso()]?.noBike)}
function stripBike(session){
 if(!session)return session;
 const next=JSON.parse(JSON.stringify(session));
 if(Array.isArray(next.exercises))next.exercises=next.exercises.filter(e=>!isBikeName(e?.name));
 if(Array.isArray(next.blocks))next.blocks=next.blocks.map(b=>({...b,exercises:Array.isArray(b.exercises)?b.exercises.filter(e=>!isBikeName(e?.name)):b.exercises})).filter(b=>!isBikeName(b?.name)&&(!Array.isArray(b.exercises)||b.exercises.length));
 return next;
}
function persistSession(session){
 if(!session)return;
 const plans=read(PLANS,{}),old=plans[iso()]||{};
 plans[iso()]={...old,session,generatedAt:new Date().toISOString()};write(PLANS,plans);
 const all=read(WORKOUTS,{}),w=all[iso()];
 if(w&&!w.completedAt){delete all[iso()];write(WORKOUTS,all)}
 sessionStorage.setItem('v059-plan-changed','1');
}
function jsonResponse(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}})}

window.fetch=async(input,init={})=>{
 const url=typeof input==='string'?input:(input?.url||''),method=(init?.method||'GET').toUpperCase();
 if(method==='POST'&&url===COACH+'/chat'&&init?.body){
   let q={};try{q=JSON.parse(init.body)}catch{}
   const explicitNoBike=noBikeText(q.message);
   if(explicitNoBike)setNoBike();
   const r=await previousFetch(input,init),d=await r.clone().json().catch(()=>null);
   if(!d)return r;
   if(r.ok){
     let session=d.updated_session||null;
     if(hasNoBike()){
       const current=read(PLANS,{})[iso()]?.session||null;
       session=stripBike(session||current);
       d.reply=explicitNoBike?'He quitado la bici de la sesión de hoy. Al cerrar el chat verás el entrenamiento actualizado.':(d.reply||'Sesión revisada.');
     }
     if(session){session=hasNoBike()?stripBike(session):session;persistSession(session);d.updated_session=session;}
   }
   return jsonResponse(d,r.status);
 }
 if(method==='POST'&&url===COACH+'/coach'&&init?.body&&hasNoBike()){
   let body;try{body=JSON.parse(init.body)}catch{return previousFetch(input,init)}
   body.profile={...(body.profile||{}),day_constraint:'El usuario ha indicado explícitamente que HOY no quiere bicicleta. No incluyas bici, bicicleta estática, spinning ni ciclismo en la sesión de hoy.'};
   const r=await previousFetch(input,{...init,body:JSON.stringify(body)}),d=await r.clone().json().catch(()=>null);
   if(!d)return r;
   if(r.ok&&d.session)d.session=stripBike(d.session);
   return jsonResponse(d,r.status);
 }
 return previousFetch(input,init);
};

document.addEventListener('click',e=>{
 const close=e.target.closest('[data-close],.v05-close');
 if(!close||sessionStorage.getItem('v059-plan-changed')!=='1')return;
 const modal=close.closest('.v05-modal');if(!modal?.querySelector('#chatLog'))return;
 sessionStorage.removeItem('v059-plan-changed');setTimeout(()=>location.reload(),120);
},true);

const ver=()=>{const d=document.querySelector('#date');if(d)d.innerHTML=d.innerHTML.split('<br>')[0]+'<br>v0.5.9';const v=document.querySelector('.version');if(v)v.textContent='Entrenador Personal · v0.5.9'};ver();setTimeout(ver,900);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=059').then(r=>r.update()).catch(()=>{}));
})();
