(() => {
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const WORKOUTS='entrenador-v05-workouts',CORE='entrenador-v03',MIGRATION='entrenador-v052-real-session';
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||f}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>{const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000);return d.toISOString().slice(0,10)};
const id=()=>crypto.randomUUID?crypto.randomUUID():'manual-'+Date.now()+'-'+Math.random().toString(16).slice(2);
const notify=m=>{const t=$('#toast');if(!t)return;t.textContent=m;t.classList.remove('hide');setTimeout(()=>t.classList.add('hide'),2400)};
const sets=(weights,reps,done=true)=>reps.map((r,i)=>({set:i+1,weight:String(weights[i]??''),reps:String(r),done}));
const exercise=(name,weights,reps,done=true,note='')=>({id:id(),name,planned:{sets:reps.length,reps:note||String(reps[0]??''),rest_seconds:'',load_guidance:note,technique:''},sets:sets(weights,reps,done),done});

function recoveredWorkout(){return {
  date:'2026-08-27',title:'Sesión real recuperada',source:'manual-recovery-v052',startedAt:'2026-08-27T12:00:00+02:00',completedAt:'2026-08-27T12:00:00+02:00',duration:20,
  exercises:[
    exercise('Bici estática',[''],[20],true,'20 minutos'),
    exercise('Press pecho máquina',[15,20,25],[10,10,10]),
    exercise('Remo máquina',[35,40,45],[10,10,10]),
    exercise('Press hombro máquina',[15,15,15],[10,10,10]),
    exercise('Dead bug',['','',''],[15,15,15]),
    exercise('Crunch',['','',''],[15,15,15]),
    exercise('Flexo-extensión de tobillo',['','',''],[15,15,15]),
    exercise('Rotación de tobillo',['','',''],[10,10,10],true,'10 por lado'),
    exercise('Gomas',['','',''],[15,15,15]),
    exercise('Elevaciones de gemelo bilaterales',['','',''],[15,15,15],false,'No realizadas')
  ]
}}
function activityFrom(w,activityId){return {id:activityId||('manual-session-'+w.date),date:w.date,workoutDate:w.date,type:'Fuerza / sesión manual',duration:String(w.duration||''),distance:'',avgHr:'',maxHr:'',elevation:'',calories:'',rpe:'',postAchilles:'',notes:`Sesión manual: ${w.title}. Bici estática: ${w.duration||0} min.`,exerciseLog:w.exercises.map(e=>({name:e.name,sets:e.sets,done:e.done})),savedAt:w.completedAt||new Date().toISOString(),source:w.source||'manual'}};
function storeWorkout(w){
 const all=read(WORKOUTS,{}),core=read(CORE,{checkins:{},activities:[]});
 const old=all[w.date];
 if(old&&old.source!=='manual-recovery-v052'&&!confirm('Ya existe una sesión en esa fecha. ¿Sustituirla?'))return false;
 all[w.date]=w;write(WORKOUTS,all);
 const existing=(core.activities||[]).find(a=>a.workoutDate===w.date);
 core.activities=(core.activities||[]).filter(a=>a!==existing);
 core.activities.push(activityFrom(w,existing?.id));write(CORE,core);return true;
}
function migrate(){
 if(localStorage.getItem(MIGRATION))return;
 const w=recoveredWorkout(),all=read(WORKOUTS,{}),core=read(CORE,{checkins:{},activities:[]});
 if(!all[w.date])all[w.date]=w;
 if(!(core.activities||[]).some(a=>a.workoutDate===w.date))core.activities.push(activityFrom(w));
 write(WORKOUTS,all);write(CORE,core);write(MIGRATION,{doneAt:new Date().toISOString(),date:w.date});
}
function addRow(box,data={}){
 const row=document.createElement('div');row.className='v052-row';
 row.innerHTML=`<input aria-label="Ejercicio" data-name placeholder="Ejercicio" value="${safe(data.name||'')}"><div class="v052-fields"><input aria-label="Pesos" data-weights placeholder="Pesos: 15,20,25" value="${safe(data.weights||'')}"><input aria-label="Repeticiones" data-reps placeholder="Reps: 10,10,10" value="${safe(data.reps||'')}"><select aria-label="Estado" data-done><option value="true">Realizado</option><option value="false" ${data.done===false?'selected':''}>No realizado</option></select><button type="button" class="v05-mini" data-remove>×</button></div>`;
 row.querySelector('[data-remove]').onclick=()=>row.remove();box.appendChild(row);
}
function openImporter(){
 const m=document.createElement('div');m.className='v05-modal';m.innerHTML=`<div class="v05-box"><div class="v05-head"><div><span class="tag">RECUPERAR SESIÓN</span><h2>Añadir entrenamiento manual</h2></div><button class="v05-close" data-close>×</button></div><form class="card" id="v052Form"><div class="grid"><div><label class="label">Fecha</label><input id="v052Date" type="date" required value="${today()}"></div><div><label class="label">Duración total (min)</label><input id="v052Duration" type="number" min="0"></div></div><label class="label" style="margin-top:10px">Nombre</label><input id="v052Title" required value="Sesión recuperada"><p class="sub">Separa pesos y repeticiones por comas. Deja el peso vacío para core, movilidad o rehabilitación.</p><div id="v052Rows"></div><button type="button" class="btn alt" id="v052Add">＋ AÑADIR EJERCICIO</button><button class="btn" style="margin-top:8px">GUARDAR EN HISTORIAL</button></form></div>`;
 document.body.appendChild(m);document.body.style.overflow='hidden';const close=()=>{m.remove();document.body.style.overflow=''};m.querySelector('[data-close]').onclick=close;
 const box=m.querySelector('#v052Rows');addRow(box);m.querySelector('#v052Add').onclick=()=>addRow(box);
 m.querySelector('#v052Form').onsubmit=e=>{e.preventDefault();const exercises=$$('.v052-row',m).map((r,i)=>{const reps=r.querySelector('[data-reps]').value.split(',').map(x=>x.trim()).filter(Boolean),weights=r.querySelector('[data-weights]').value.split(',').map(x=>x.trim());const done=r.querySelector('[data-done]').value==='true';return exercise(r.querySelector('[data-name]').value.trim(),weights,reps,done)}).filter(x=>x.name&&x.sets.length);if(!exercises.length)return notify('Añade al menos un ejercicio con repeticiones');const now=new Date().toISOString(),w={date:m.querySelector('#v052Date').value,title:m.querySelector('#v052Title').value.trim(),duration:+m.querySelector('#v052Duration').value||0,source:'manual',startedAt:now,completedAt:now,exercises};if(storeWorkout(w)){close();renderEntry();notify('Sesión recuperada y añadida al progreso')}};
}
function renderEntry(){
 const view=$('#v-historial');if(!view)return;let card=$('#v052Import');if(!card){card=document.createElement('div');card.id='v052Import';card.className='card';view.prepend(card)}card.innerHTML='<h2>Recuperar una sesión</h2><p class="sub">Añade un entrenamiento pasado con sus series, pesos, repeticiones y ejercicios pendientes.</p><button class="btn" id="v052Open">RECUPERAR / AÑADIR SESIÓN MANUAL</button>';$('#v052Open').onclick=openImporter;
}
const css=document.createElement('style');css.textContent='.v052-row{border-top:1px solid var(--l);padding:12px 0}.v052-row:first-child{border-top:0}.v052-fields{display:grid;grid-template-columns:1fr 1fr 1fr 38px;gap:6px;margin-top:6px}.v052-fields input,.v052-fields select{padding:9px}.v052-fields .v05-mini{font-size:18px}@media(max-width:440px){.v052-fields{grid-template-columns:1fr 1fr}.v052-fields .v05-mini{width:100%}}';document.head.appendChild(css);
migrate();renderEntry();$$('.tab').forEach(t=>t.addEventListener('click',()=>{if(t.dataset.tab==='historial')setTimeout(renderEntry,100)}));
const ver=()=>{const d=$('#date');if(d)d.innerHTML=d.innerHTML.replace(/v0\.5(?:\.1)?|v0\.4(?:\.2|\.3)?|v0\.3(?:\.2)?/,'v0.5.2');const v=$('.version');if(v)v.textContent='Entrenador Personal · v0.5.2'};ver();setTimeout(ver,800);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=052').then(r=>r.update()).catch(()=>{}));
})();
