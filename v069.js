(() => {
'use strict';
const PLANS='entrenador-v04-plans',WORKOUTS='entrenador-v05-workouts',CORE='entrenador-v03',DAILY='entrenador-v032-daily',DAY_RULES='entrenador-v059-day-rules';
const $=s=>document.querySelector(s);
const iso=()=>{const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000);return d.toISOString().slice(0,10)};
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||f}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function resetTodayCompletely(){
 const day=iso();
 const all=read(WORKOUTS,{}),w=all[day];
 if(w&&(w.completedAt||w.status==='completed')){alert('Este entrenamiento ya está finalizado. Para borrarlo usa Historial.');return;}
 if(!confirm('¿Eliminar el entrenamiento de hoy y volver al inicio? Se borrarán la sesión, la propuesta y el check-in de hoy para que puedas introducir los datos de nuevo.'))return;
 delete all[day];write(WORKOUTS,all);
 const plans=read(PLANS,{});delete plans[day];write(PLANS,plans);
 const core=read(CORE,{checkins:{},activities:[]});
 core.checkins=core.checkins||{};delete core.checkins[day];
 core.activities=(core.activities||[]).filter(a=>!(a.workoutDate===day&&!a.completedAt));write(CORE,core);
 const daily=read(DAILY,{});if(daily&&typeof daily==='object'){delete daily[day];write(DAILY,daily)}
 const rules=read(DAY_RULES,{});if(rules&&typeof rules==='object'){delete rules[day];write(DAY_RULES,rules)}
 sessionStorage.removeItem('v059-plan-changed');
 alert('Entrenamiento y check-in de hoy eliminados. Volvemos al inicio para introducir los datos de nuevo.');
 location.reload();
}
function replaceDeleteButtons(){
 ['#v065Discard','#v062Discard','#discardWorkout','#v062ModalDiscard'].forEach(sel=>{
  const b=$(sel);if(!b||b.dataset.v069)return;
  const n=b.cloneNode(true);n.dataset.v066='1';n.dataset.v069='1';n.textContent='🗑️ ELIMINAR Y VOLVER AL INICIO';b.replaceWith(n);
  n.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();resetTodayCompletely()});
 });
}
const obs=new MutationObserver(replaceDeleteButtons);obs.observe(document.body,{childList:true,subtree:true});replaceDeleteButtons();setInterval(replaceDeleteButtons,900);
const ver=()=>{const d=$('#date');if(d)d.innerHTML=d.innerHTML.split('<br>')[0]+'<br>v0.6.9';const v=$('.version');if(v)v.textContent='Entrenador Personal · v0.6.9'};ver();setTimeout(ver,900);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=069').then(r=>r.update()).catch(()=>{}));
})();
