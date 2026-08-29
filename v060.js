(() => {
'use strict';
const CORE='entrenador-v03',WORKOUTS='entrenador-v05-workouts';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||f}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

function normalizedActivityFromWorkout(w){
  return {
    id:'workout-sync-'+w.date,
    date:w.date,
    workoutDate:w.date,
    type:'Entrenamiento',
    duration:String(Number(w.duration||0)),
    distance:'',avgHr:'',maxHr:'',elevation:'',calories:'',rpe:'',postAchilles:'',
    notes:w.title||'Entrenamiento',
    exerciseLog:(w.exercises||[]).map(e=>({name:e.name,sets:e.sets||[],done:Boolean(e.done),planned:e.planned||null})),
    savedAt:w.completedAt||new Date().toISOString(),
    source:w.source||'workout-sync'
  };
}

function reconcile(){
  const workouts=read(WORKOUTS,{}),core=read(CORE,{checkins:{},activities:[]});
  let changed=false;
  const activities=Array.isArray(core.activities)?core.activities:[];
  Object.values(workouts).filter(w=>w?.completedAt&&w?.date).forEach(w=>{
    const same=activities.find(a=>a.workoutDate===w.date || (a.date===w.date && Array.isArray(a.exerciseLog)));
    if(!same){activities.push(normalizedActivityFromWorkout(w));changed=true;return;}
    if(!same.workoutDate){same.workoutDate=w.date;changed=true;}
    if(!Array.isArray(same.exerciseLog)||!same.exerciseLog.length){same.exerciseLog=normalizedActivityFromWorkout(w).exerciseLog;changed=true;}
    if((same.duration==null||same.duration==='')&&w.duration!=null){same.duration=String(Number(w.duration||0));changed=true;}
  });
  if(changed){core.activities=activities;write(CORE,core)}
  return {workouts,core};
}

function refreshProgress(){
  const {workouts,core}=reconcile();
  const completed=Object.values(workouts).filter(w=>w?.completedAt&&w?.date);
  const byDate=new Map(completed.map(w=>[w.date,w]));
  const nonWorkout=(core.activities||[]).filter(a=>!a.workoutDate&&!byDate.has(a.date));
  const all=[...completed.map(w=>({date:w.date,duration:Number(w.duration||0),distance:0})),...nonWorkout.map(a=>({date:a.date,duration:Number(a.duration||0),distance:Number(a.distance||0)}))];
  const stats=$('#stats');
  if(stats){
    const mins=all.reduce((s,a)=>s+(Number(a.duration)||0),0),km=all.reduce((s,a)=>s+(Number(a.distance)||0),0);
    stats.innerHTML=`<div class="stat"><b>${all.length}</b><small>actividades</small></div><div class="stat"><b>${mins}</b><small>minutos</small></div><div class="stat"><b>${km.toFixed(1)}</b><small>kilómetros</small></div>`;
  }
  const week=$('#week');
  if(week){
    const names=['dom','lun','mar','mié','jue','vie','sáb'],rows=[];
    for(let i=6;i>=0;i--){
      const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-i);
      const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0'),key=`${y}-${m}-${dd}`;
      const count=all.filter(a=>a.date===key).length;
      rows.push(`<div class="item"><h3>${names[d.getDay()]} ${d.getDate()}</h3><p>${count?`${count} actividad(es)`:'Sin registro'}</p></div>`);
    }
    week.innerHTML=rows.join('');
  }
}

reconcile();
$$('.tab').forEach(t=>t.addEventListener('click',()=>{if(t.dataset.tab==='progreso')setTimeout(refreshProgress,80)}));
setTimeout(()=>{if($('#v-progreso')?.classList.contains('on'))refreshProgress()},250);

const ver=()=>{const d=$('#date');if(d)d.innerHTML=d.innerHTML.split('<br>')[0]+'<br>v0.6.0';const v=$('.version');if(v)v.textContent='Entrenador Personal · v0.6.0'};ver();setTimeout(ver,900);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=060').then(r=>r.update()).catch(()=>{}));
})();
