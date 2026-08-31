const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const values=new Map();
const localStorage={getItem:k=>values.has(k)?values.get(k):null,setItem:(k,v)=>values.set(k,String(v))};
const emptyElement=()=>({remove(){},classList:{add(){},remove(){}},querySelector(){return null},insertAdjacentHTML(){},addEventListener(){}});
const document={
 body:emptyElement(),querySelector(){return null},querySelectorAll(){return []},
 addEventListener(){}
};
const context={localStorage,sessionStorage:{removeItem(){}},document,navigator:{},location:{reload(){}},MutationObserver:class{observe(){}},Date,console,setTimeout(fn){fn()},alert(){}};
const run=()=>vm.runInNewContext(fs.readFileSync('v073.js','utf8'),context);
const oldActivities=[
 {id:'old-27',date:'2026-08-27',workoutDate:'2026-08-27',exerciseLog:[]},
 {id:'duplicate-a',date:'2026-08-31',workoutDate:'2026-08-31',exerciseLog:[{name:'antiguo'}]},
 {id:'duplicate-b',date:'2026-08-31',workoutDate:'2026-08-31',exerciseLog:[{name:'duplicado'}]}
];
values.set('entrenador-v05-workouts',JSON.stringify({
 '2026-08-27':{date:'2026-08-27',completedAt:'2026-08-27T12:00:00+02:00',exercises:[]},
 '2026-08-28':{date:'2026-08-28',completedAt:'2026-08-28T12:00:00+02:00',exercises:[]},
 '2026-08-31':{date:'2026-08-31',status:'in_progress',title:'sesión atascada',exercises:[]}
}));
values.set('entrenador-v03',JSON.stringify({checkins:{},activities:oldActivities}));

run();
let workouts=JSON.parse(values.get('entrenador-v05-workouts'));
let core=JSON.parse(values.get('entrenador-v03'));
assert.equal(workouts['2026-08-31'].status,'completed');
assert.equal(workouts['2026-08-31'].duration,20);
assert.deepEqual(workouts['2026-08-31'].exercises[1].sets.map(s=>s.weight),['20','25','35']);
assert.deepEqual(workouts['2026-08-31'].exercises[2].sets.map(s=>s.weight),['7','8','8']);
assert.deepEqual(workouts['2026-08-31'].exercises[3].sets.map(s=>s.weight),['40','45','50']);
assert.equal(workouts['2026-08-31'].exercises[4].sets.length,0);
assert.equal(workouts['2026-08-31'].exercises[5].sets.length,0);
assert.ok(workouts['2026-08-27']);
assert.ok(workouts['2026-08-28']);
assert.equal(core.activities.filter(a=>a.workoutDate==='2026-08-31').length,1);
assert.equal(core.activities.filter(a=>a.workoutDate==='2026-08-27').length,1);

workouts['2026-08-31'].title='Título editado después de migrar';
values.set('entrenador-v05-workouts',JSON.stringify(workouts));
run();
workouts=JSON.parse(values.get('entrenador-v05-workouts'));
core=JSON.parse(values.get('entrenador-v03'));
assert.equal(workouts['2026-08-31'].title,'Título editado después de migrar');
assert.equal(core.activities.filter(a=>a.workoutDate==='2026-08-31').length,1);
console.log('v0.7.3 migration and reconciliation tests passed');
