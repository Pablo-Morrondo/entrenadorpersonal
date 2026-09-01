(() => {
'use strict';
const CORE='entrenador-v03',WORKOUTS='entrenador-v05-workouts',PLANS='entrenador-v04-plans';
const MIGRATION='entrenador-v074-real-workout-2026-09-01',TARGET_DATE='2026-09-01',TARGET_ID='completed-workout-2026-09-01-v074';
const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v&&typeof v==='object'?v:f}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const doneSet=(set,weight,reps,extra={})=>({set,weight:String(weight),reps:String(reps),done:true,...extra});
const exercise=(name,weights,reps)=>({name,done:true,sets:weights.map((weight,i)=>doneSet(i+1,weight,reps[i]))});

function realWorkout(){
 return {
  id:TARGET_ID,date:TARGET_DATE,title:'Entrenamiento real · bici, pierna, brazos, core, rehabilitación y fisioterapia',
  source:'manual-recovery-v074',status:'completed',startedAt:TARGET_DATE,completedAt:TARGET_DATE,duration:10,
  exercises:[
   {name:'Bicicleta estática',done:true,sets:[],duration:10,unit:'min'},
   exercise('Extensión de cuádriceps',[25,30,35],[12,12,12]),
   exercise('Curl femoral sentado',[20,20,20],[10,10,10]),
   {name:'Aductores en máquina · ambos ejercicios/máquinas',done:true,sets:[
    ...[1,2,3].map(set=>doneSet(set,35,10,{machineGroup:1})),
    ...[1,2,3].map(set=>doneSet(set,35,10,{machineGroup:2}))
   ],machines:2,setsPerMachine:3},
   exercise('Curl de bíceps sentado',[8,9,10],[10,10,10]),
   exercise('Tríceps en polea',[15,15,15],[10,10,10]),
   {name:'Core · dead bug',done:true,sets:[doneSet(1,'',15,{side:'cada lado'}),doneSet(2,'',15,{side:'cada lado'})],rounds:2},
   {name:'Rehabilitación completa',done:true,sets:[]},
   {name:'Fisioterapia · tratamiento',done:true,sets:[]}
  ]
 };
}
function activityFrom(w){
 return {id:TARGET_ID,date:TARGET_DATE,workoutDate:TARGET_DATE,type:'Entrenamiento',duration:'10',distance:'',
  notes:'Bicicleta estática 10 min; extensión de cuádriceps; curl femoral sentado; ambos ejercicios/máquinas de aductores; curl de bíceps sentado; tríceps en polea; core con dead bug; rehabilitación completa; fisioterapia: tratamiento.',
  exerciseLog:w.exercises.map(e=>({...e})),savedAt:w.completedAt,completedAt:w.completedAt,status:'completed',source:w.source};
}
function migrate(){
 if(localStorage.getItem(MIGRATION))return false;
 const workouts=read(WORKOUTS,{}),core=read(CORE,{checkins:{},activities:[]}),plans=read(PLANS,{}),w=realWorkout();
 core.checkins=core.checkins&&typeof core.checkins==='object'?core.checkins:{};
 core.activities=Array.isArray(core.activities)?core.activities:[];
 workouts[TARGET_DATE]=w;
 core.activities=core.activities.filter(a=>!(a&&(a.workoutDate===TARGET_DATE||(a.date===TARGET_DATE&&Array.isArray(a.exerciseLog)))));
 core.activities.push(activityFrom(w));
 delete plans[TARGET_DATE];
 write(WORKOUTS,workouts);write(CORE,core);write(PLANS,plans);
 write(MIGRATION,{doneAt:new Date().toISOString(),date:TARGET_DATE,version:'0.7.4'});
 return true;
}
if(migrate()){setTimeout(()=>location.reload(),50);return}
const ver=()=>{const d=document.querySelector('#date');if(d)d.innerHTML=d.innerHTML.split('<br>')[0]+'<br>v0.7.4';const v=document.querySelector('.version');if(v)v.textContent='Entrenador Personal · v0.7.4'};
ver();setTimeout(ver,900);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=074').then(r=>r.update()).catch(()=>{}));
})();
