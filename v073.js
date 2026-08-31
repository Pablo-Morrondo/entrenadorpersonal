(() => {
'use strict';
const CORE='entrenador-v03',WORKOUTS='entrenador-v05-workouts',MIGRATION='entrenador-v073-integrity-migration';
const TARGET_DATE='2026-08-31',TARGET_ID='completed-workout-2026-08-31-v073';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const iso=()=>{const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000);return d.toISOString().slice(0,10)};
const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v&&typeof v==='object'?v:f}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const completed=w=>Boolean(w&&(w.completedAt||w.status==='completed'));
const doneSet=(set,weight,reps)=>({set,weight:String(weight),reps:String(reps),done:true});
const exercise=(name,weights=[])=>({name,done:true,sets:weights.map((weight,i)=>doneSet(i+1,weight,10))});

function reportedWorkout(existing){
 const completedAt=existing?.completedAt||'2026-08-31T22:00:00+02:00';
 return {
  ...(existing||{}),id:existing?.id||TARGET_ID,date:TARGET_DATE,
  title:'Entrenamiento real · bici, tren superior, core y rehabilitación',
  source:'manual-recovery-v073',status:'completed',startedAt:existing?.startedAt||completedAt,completedAt,duration:20,
  exercises:[
   {name:'Bicicleta estática',done:true,sets:[],duration:20,unit:'min'},
   exercise('Press de pecho sentado',[20,25,35]),
   exercise('Press de hombro',[7,8,8]),
   exercise('Remo sentado',[40,45,50]),
   {name:'Core',done:true,sets:[]},
   {name:'Rehabilitación habitual',done:true,sets:[]}
  ]
 };
}
function activityFrom(w,existing={}){
 return {...existing,id:TARGET_ID,date:w.date,workoutDate:w.date,type:'Entrenamiento',duration:'20',distance:'',
  notes:'Bicicleta estática 20 min; press de pecho sentado, press de hombro, remo sentado, core y rehabilitación habitual realizados.',
  exerciseLog:w.exercises.map(e=>({name:e.name,sets:e.sets||[],done:true,duration:e.duration||undefined,unit:e.unit||undefined})),
  savedAt:w.completedAt,completedAt:w.completedAt,status:'completed',source:w.source};
}
function migrateAndReconcile(){
 const workouts=read(WORKOUTS,{}),core=read(CORE,{checkins:{},activities:[]});
 core.checkins=core.checkins&&typeof core.checkins==='object'?core.checkins:{};
 core.activities=Array.isArray(core.activities)?core.activities:[];
 const alreadyMigrated=Boolean(localStorage.getItem(MIGRATION));
 if(!alreadyMigrated)workouts[TARGET_DATE]=reportedWorkout(workouts[TARGET_DATE]);
 Object.values(workouts).forEach(w=>{if(w&&w.date&&completed(w)){w.status='completed';if(!w.completedAt)w.completedAt=w.savedAt||new Date(`${w.date}T12:00:00`).toISOString()}});
 if(!workouts[TARGET_DATE]){write(WORKOUTS,workouts);write(CORE,core);return false}
 const matches=core.activities.filter(a=>a&&(a.workoutDate===TARGET_DATE||(a.date===TARGET_DATE&&Array.isArray(a.exerciseLog))));
 const canonical=activityFrom(workouts[TARGET_DATE],matches[0]||{});
 core.activities=core.activities.filter(a=>!matches.includes(a));
 core.activities.push(canonical);
 write(WORKOUTS,workouts);write(CORE,core);
 if(!alreadyMigrated)write(MIGRATION,{doneAt:new Date().toISOString(),date:TARGET_DATE,version:'0.7.3'});
 return !alreadyMigrated;
}
function hideCompletedToday(){
 const w=read(WORKOUTS,{})[iso()];if(!completed(w))return;
 $('#v062InProgress')?.remove();$$('.v065-workout').forEach(x=>x.remove());
 const plan=$('#coachPlan');if(plan)plan.classList.add('hide');
 const status=$('#coachStatus');if(status)status.classList.add('hide');
 ['#v05StartWorkout','#v05ChatBefore','#beginCoach','#coachStart'].forEach(s=>$(s)?.remove());
 const start=$('#start');if(start){start.classList.add('hide');start.disabled=true}
 const saved=$('#saved');if(saved&&!saved.querySelector('#v073Completed'))saved.insertAdjacentHTML('beforeend','<p id="v073Completed" class="coach-alert" style="margin-top:10px">✓ Entrenamiento completado. Está guardado en Historial, Progreso y Calendario.</p>');
}
function protectCompleted(e){
 const target=e.target.closest('#v065Discard,#v062Discard,#discardWorkout,#v062ModalDiscard,#v05StartWorkout,#beginCoach,#coachStart,#start');
 if(!target||!completed(read(WORKOUTS,{})[iso()]))return;
 e.preventDefault();e.stopImmediatePropagation();hideCompletedToday();
 if(!target.matches('#start'))alert('El entrenamiento de hoy ya está completado. Se conserva en Historial, Progreso y Calendario.');
}

const migrated=migrateAndReconcile();
if(migrated){setTimeout(()=>location.reload(),50);return}
hideCompletedToday();
document.addEventListener('click',protectCompleted,true);
const observer=new MutationObserver(hideCompletedToday);observer.observe(document.body,{childList:true,subtree:true});
$$('.tab').forEach(t=>t.addEventListener('click',()=>setTimeout(hideCompletedToday,50)));
const ver=()=>{const d=$('#date');if(d)d.innerHTML=d.innerHTML.split('<br>')[0]+'<br>v0.7.3';const v=$('.version');if(v)v.textContent='Entrenador Personal · v0.7.3'};ver();setTimeout(ver,900);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=073').then(r=>r.update()).catch(()=>{}));
})();
