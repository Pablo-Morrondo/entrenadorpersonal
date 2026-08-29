(() => {
'use strict';
const WORKOUTS='entrenador-v05-workouts',CORE='entrenador-v03';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const iso=()=>{const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000);return d.toISOString().slice(0,10)};
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||f}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

function migrateStates(){
 const all=read(WORKOUTS,{});let changed=false;
 Object.values(all).forEach(w=>{if(!w)return;const wanted=w.completedAt?'completed':'in_progress';if(w.status!==wanted){w.status=wanted;changed=true}});
 if(changed)write(WORKOUTS,all);
}
function todayWorkout(){return read(WORKOUTS,{})[iso()]||null}
function setTodayStatus(status){const all=read(WORKOUTS,{}),w=all[iso()];if(!w)return;if(w.status!==status){w.status=status;write(WORKOUTS,all)}}
function removePendingActivity(){const core=read(CORE,{checkins:{},activities:[]});const before=(core.activities||[]).length;core.activities=(core.activities||[]).filter(a=>!(a.workoutDate===iso() && !a.completedAt && (a.source==='in_progress'||a.status==='in_progress')));if(core.activities.length!==before)write(CORE,core)}

function addInProgressCard(){
 const view=$('#v-hoy');if(!view)return;let card=$('#v062InProgress');
 const w=todayWorkout();
 if(!w||w.completedAt||w.status==='completed'){card?.remove();return}
 if(!card){card=document.createElement('div');card.id='v062InProgress';card.className='card hero';const saved=$('#saved');(saved||view.firstElementChild)?.insertAdjacentElement(saved?'afterend':'beforebegin',card)}
 card.innerHTML=`<span class="tag">ENTRENAMIENTO EN CURSO</span><h2 style="margin-top:6px">${w.title||'Sesión de hoy'}</h2><p class="sub">Esta sesión todavía no cuenta en Historial, Progreso ni Calendario.</p><button class="btn" id="v062Resume">CONTINUAR ENTRENAMIENTO</button><button class="btn bad" id="v062Discard" style="margin-top:8px">🗑️ DESCARTAR ENTRENAMIENTO</button>`;
 $('#v062Resume').onclick=()=>{const start=$('#startWorkout,#beginWorkout,#startTraining,.v05-start,#coachStart');if(start)start.click();else document.querySelector('#coachPlan .v05-chatbtn')?.scrollIntoView({behavior:'smooth'})};
 $('#v062Discard').onclick=discardToday;
}
function discardToday(){
 const all=read(WORKOUTS,{}),w=all[iso()];
 if(!w)return alert('No hay un entrenamiento en curso.');
 if(w.completedAt||w.status==='completed')return alert('Ese entrenamiento ya está completado. Puedes borrarlo desde Historial.');
 if(!confirm('¿Descartar el entrenamiento en curso de hoy? Se borrarán las series marcadas, pero se conservará la propuesta del entrenador.'))return;
 delete all[iso()];write(WORKOUTS,all);removePendingActivity();alert('Entrenamiento descartado.');location.reload();
}
function enhanceWorkoutModal(){
 $$('.v05-modal').forEach(modal=>{
  const finish=modal.querySelector('#finishWorkout');if(!finish)return;
  const w=todayWorkout();if(w&&!w.completedAt)setTodayStatus('in_progress');
  let label=modal.querySelector('#v062State');if(!label){label=document.createElement('div');label.id='v062State';label.className='tag';label.textContent='● EN CURSO';finish.insertAdjacentElement('beforebegin',label)}
  let discard=modal.querySelector('#discardWorkout,#v062ModalDiscard');if(!discard){discard=document.createElement('button');discard.type='button';discard.id='v062ModalDiscard';discard.className='btn bad';discard.style.marginTop='10px';discard.textContent='🗑️ DESCARTAR ENTRENAMIENTO';discard.onclick=discardToday;finish.insertAdjacentElement('afterend',discard)}
 });
}
function markCompletedAfterFinish(e){
 const b=e.target.closest('#finishWorkout');if(!b)return;
 setTimeout(()=>{const all=read(WORKOUTS,{}),w=all[iso()];if(w?.completedAt){w.status='completed';write(WORKOUTS,all);addInProgressCard()}},250);
}
function cleanupProgressSources(){
 const core=read(CORE,{checkins:{},activities:[]});let changed=false;
 (core.activities||[]).forEach(a=>{if(a.workoutDate){const w=read(WORKOUTS,{})[a.workoutDate];if(w?.completedAt){if(a.status!=='completed'){a.status='completed';a.completedAt=w.completedAt;changed=true}}}});if(changed)write(CORE,core)
}

migrateStates();cleanupProgressSources();addInProgressCard();
const obs=new MutationObserver(()=>{enhanceWorkoutModal();addInProgressCard()});obs.observe(document.body,{childList:true,subtree:true});
document.addEventListener('click',markCompletedAfterFinish,true);
$$('.tab').forEach(t=>t.addEventListener('click',()=>{if(t.dataset.tab==='hoy')setTimeout(addInProgressCard,80)}));

const ver=()=>{const d=$('#date');if(d)d.innerHTML=d.innerHTML.split('<br>')[0]+'<br>v0.6.2';const v=$('.version');if(v)v.textContent='Entrenador Personal · v0.6.2'};ver();setTimeout(ver,900);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=062').then(r=>r.update()).catch(()=>{}));
})();
