(() => {
'use strict';
const PLANS='entrenador-v04-plans',WORKOUTS='entrenador-v05-workouts',CORE='entrenador-v03';
const $=s=>document.querySelector(s);
const iso=()=>{const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000);return d.toISOString().slice(0,10)};
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||f}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function deleteTodayCompletely(){
 const day=iso();
 const all=read(WORKOUTS,{}),w=all[day];
 if(w&&(w.completedAt||w.status==='completed')){alert('Este entrenamiento ya está finalizado. Para borrarlo usa Historial.');return;}
 if(!confirm('¿Eliminar completamente el entrenamiento de hoy? Se borrarán la sesión iniciada, las series marcadas y la propuesta del entrenador. Además, hoy quedará marcado como NO entreno.'))return;
 delete all[day];write(WORKOUTS,all);
 const plans=read(PLANS,{});delete plans[day];write(PLANS,plans);
 const core=read(CORE,{checkins:{},activities:[]});
 core.checkins=core.checkins||{};
 core.checkins[day]={...(core.checkins[day]||{}),training:'No',can_train:false};
 core.activities=(core.activities||[]).filter(a=>!(a.workoutDate===day && !a.completedAt));
 write(CORE,core);
 alert('Entrenamiento de hoy eliminado. Hoy queda marcado como no entreno.');
 location.reload();
}
function replaceDiscardButtons(){
 ['#v065Discard','#v062Discard','#discardWorkout','#v062ModalDiscard'].forEach(sel=>{
  const b=$(sel);if(!b||b.dataset.v066)return;
  const n=b.cloneNode(true);n.dataset.v066='1';n.textContent='🗑️ ELIMINAR ENTRENAMIENTO DE HOY';b.replaceWith(n);
  n.addEventListener('click',e=>{e.preventDefault();deleteTodayCompletely()});
 });
}
const obs=new MutationObserver(replaceDiscardButtons);obs.observe(document.body,{childList:true,subtree:true});replaceDiscardButtons();setInterval(replaceDiscardButtons,900);
const ver=()=>{const d=$('#date');if(d)d.innerHTML=d.innerHTML.split('<br>')[0]+'<br>v0.6.6';const v=$('.version');if(v)v.textContent='Entrenador Personal · v0.6.6'};ver();setTimeout(ver,900);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=066').then(r=>r.update()).catch(()=>{}));
})();
