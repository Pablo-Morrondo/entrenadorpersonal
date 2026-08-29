(() => {
'use strict';
const $=s=>document.querySelector(s);
const WORKOUTS='entrenador-v05-workouts',CORE='entrenador-v03',MIGRATION='entrenador-v058-real-session-2026-08-28';
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||f}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const id=()=>crypto.randomUUID?crypto.randomUUID():'recovered-'+Date.now()+'-'+Math.random().toString(16).slice(2);
const series=(weights,reps)=>weights.map((weight,i)=>({set:i+1,weight:String(weight??''),reps:String(reps[i]??''),done:true}));
const exercise=(name,weights=[],reps=[],note='')=>({id:id(),name,planned:{sets:weights.length,reps:note,rest_seconds:'',load_guidance:note,technique:''},sets:series(weights,reps),done:true});
function recoveredWorkout(){return {date:'2026-08-28',title:'Entrenamiento real · pierna, bici, core y rehabilitación',source:'manual-recovery-v058',startedAt:'2026-08-28T12:00:00+02:00',completedAt:'2026-08-28T12:00:00+02:00',duration:20,exercises:[
 exercise('Bicicleta estática',[],[],'20 minutos'),exercise('Extensión de cuádriceps',[20,20,25],[12,12,12],'3 × 12'),
 exercise('Curl femoral',[20,20,20],['','',''],'3 series; repeticiones no registradas'),exercise('Abductores',[30,30,30],['','',''],'3 series; repeticiones no registradas'),
 exercise('Aductores',[30,30,30],['','',''],'3 series; repeticiones no registradas'),exercise('Core',[],[],'Realizado; ejercicios y series no registrados'),
 exercise('Ejercicios de rehabilitación',[],[],'Realizados; ejercicios y series no registrados')]}}
function activityFrom(w){return {id:'manual-session-'+w.date,date:w.date,workoutDate:w.date,type:'Entrenamiento',duration:'20',distance:'',avgHr:'',maxHr:'',elevation:'',calories:'',rpe:'',postAchilles:'',notes:'Bicicleta estática 20 min; pierna, core y rehabilitación realizados.',exerciseLog:w.exercises.map(e=>({name:e.name,sets:e.sets,done:e.done,planned:e.planned})),savedAt:w.completedAt,source:w.source}}
function migrate(){if(localStorage.getItem(MIGRATION))return;const w=recoveredWorkout(),all=read(WORKOUTS,{}),core=read(CORE,{checkins:{},activities:[]});if(!all[w.date])all[w.date]=w;if(!(core.activities||[]).some(a=>a.workoutDate===w.date))core.activities.push(activityFrom(all[w.date]||w));write(WORKOUTS,all);write(CORE,core);write(MIGRATION,{doneAt:new Date().toISOString(),date:w.date})}
migrate();
const ver=()=>{const d=$('#date');if(d)d.innerHTML=d.innerHTML.split('<br>')[0]+'<br>v0.5.8';const v=$('.version');if(v)v.textContent='Entrenador Personal · v0.5.8'};ver();setTimeout(ver,950);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=058').then(r=>r.update()).catch(()=>{}));
})();
