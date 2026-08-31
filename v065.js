(() => {
'use strict';
const PLANS='entrenador-v04-plans',WORKOUTS='entrenador-v05-workouts',CORE='entrenador-v03';
const COACH='https://entrenador-personal-coach.morrondin.workers.dev';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const iso=()=>{const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000);return d.toISOString().slice(0,10)};
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||f}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const notify=m=>{const t=$('#toast');if(!t)return;t.textContent=m;t.classList.remove('hide');setTimeout(()=>t.classList.add('hide'),2600)};
const repsDefault=t=>{const m=String(t||'').match(/(\d+)/);return m?m[1]:''};

function getPlan(){return read(PLANS,{})[iso()]||null}
function getStore(){return read(WORKOUTS,{})}
function saveWorkout(w){const all=getStore();all[iso()]=w;write(WORKOUTS,all)}
function lastExercise(name){const ws=Object.values(getStore()).filter(w=>w?.completedAt).sort((a,b)=>String(b.completedAt).localeCompare(String(a.completedAt)));for(const w of ws){const e=(w.exercises||[]).find(x=>String(x.name).toLowerCase()===String(name).toLowerCase());if(e)return e}return null}
function normalizeWorkout(w){if(!w||!Array.isArray(w.exercises))return null;w.exercises=w.exercises.map((e,i)=>({id:e.id||'e'+i,name:e.name||`Ejercicio ${i+1}`,planned:e.planned||{},done:Boolean(e.done),sets:Array.isArray(e.sets)?e.sets:[]}));return w}
function createWorkout(){
 const p=getPlan();if(!p?.session||!Array.isArray(p.session.exercises))throw new Error('La sesión actual no tiene ejercicios válidos. Vuelve a generar el entrenamiento.');
 const all=getStore(),old=normalizeWorkout(all[iso()]);
 if(old&&(old.completedAt||old.status==='completed'))throw new Error('El entrenamiento de hoy ya está completado y guardado en el historial.');
 if(old&&!old.completedAt&&old.planGeneratedAt===p.generatedAt)return old;
 const w={date:iso(),title:p.session.title||'Sesión de hoy',status:'in_progress',startedAt:new Date().toISOString(),planGeneratedAt:p.generatedAt||'',exercises:p.session.exercises.map((e,i)=>{const last=lastExercise(e.name),n=Math.max(1,Number(e.sets)||1);return {id:'e'+i,name:e.name||`Ejercicio ${i+1}`,planned:e,done:false,sets:Array.from({length:n},(_,j)=>({set:j+1,weight:last?.sets?.[j]?.weight||'',reps:repsDefault(e.reps),done:false}))}})};
 all[iso()]=w;write(WORKOUTS,all);return w;
}
function closeModal(m){m?.remove();if(!document.querySelector('.v05-modal'))document.body.style.overflow=''}
function discard(){const all=getStore(),w=all[iso()];if(!w||w.completedAt||w.status==='completed')return notify('No hay un entrenamiento pendiente');if(!confirm('¿Descartar el entrenamiento en curso de hoy? Se borrarán las series marcadas y se conservará la propuesta.'))return;delete all[iso()];write(WORKOUTS,all);notify('Entrenamiento descartado');setTimeout(()=>location.reload(),300)}
function finish(w){w.completedAt=new Date().toISOString();w.status='completed';saveWorkout(w);const core=read(CORE,{checkins:{},activities:[]});core.activities=(core.activities||[]).filter(a=>a.workoutDate!==w.date);core.activities.push({id:'guided-'+w.date,date:w.date,workoutDate:w.date,type:'Entrenamiento',duration:'',distance:'',notes:w.title,exerciseLog:w.exercises.map(e=>({name:e.name,sets:e.sets,done:e.done})),savedAt:w.completedAt,completedAt:w.completedAt,status:'completed',source:'guided'});write(CORE,core);alert('Entrenamiento finalizado y guardado.');location.reload()}

function openWorkout(w){
 w=normalizeWorkout(w);if(!w)throw new Error('No se pudo abrir la sesión en curso.');
 $$('.v065-workout,.v065-chat').forEach(x=>x.remove());
 const m=document.createElement('div');m.className='v05-modal v065-workout';m.innerHTML=`<div class="v05-box"><div class="v05-head"><div><span class="tag">ENTRENAMIENTO EN CURSO</span><h2>${safe(w.title)}</h2></div><button type="button" class="v05-close" data-close>×</button></div><div class="v05-actions"><button type="button" class="btn alt" id="v065Chat">💬 PREGUNTAR / CAMBIAR</button><button type="button" class="btn alt" id="v065Save">GUARDAR Y SALIR</button></div><div id="v065Body"></div><button type="button" class="btn" id="v065Finish">✅ FINALIZAR ENTRENAMIENTO</button><button type="button" class="btn bad" id="v065Discard" style="margin-top:10px">🗑️ DESCARTAR ENTRENAMIENTO</button></div>`;
 document.body.appendChild(m);document.body.style.overflow='hidden';
 const body=m.querySelector('#v065Body');body.innerHTML=w.exercises.map((e,i)=>`<div class="v05-ex"><h3>${i+1}. ${safe(e.name)}</h3><p class="v05-sectionnote">${safe(e.planned?.reps||'')} · descanso ${safe(e.planned?.rest_seconds||'')} s<br>${safe(e.planned?.load_guidance||'')}<br>${safe(e.planned?.technique||'')}</p><div class="v05-setlabels"><span>Serie</span><span>Peso kg</span><span>Reps</span><span>Hecho</span></div>${(e.sets||[]).map((s,j)=>`<div class="v05-set"><b>${j+1}</b><input type="number" step=".5" inputmode="decimal" data-i="${i}" data-j="${j}" data-k="weight" value="${safe(s.weight)}"><input type="number" inputmode="numeric" data-i="${i}" data-j="${j}" data-k="reps" value="${safe(s.reps)}"><button type="button" class="v05-check ${s.done?'on':''}" data-check="${i}:${j}">${s.done?'✓':'○'}</button></div>`).join('')}</div>`).join('');
 m.querySelectorAll('[data-k]').forEach(inp=>inp.addEventListener('change',()=>{w.exercises[+inp.dataset.i].sets[+inp.dataset.j][inp.dataset.k]=inp.value;saveWorkout(w)}));
 m.querySelectorAll('[data-check]').forEach(b=>b.addEventListener('click',()=>{const [i,j]=b.dataset.check.split(':').map(Number),s=w.exercises[i].sets[j];s.done=!s.done;w.exercises[i].done=w.exercises[i].sets.length>0&&w.exercises[i].sets.every(x=>x.done);b.classList.toggle('on',s.done);b.textContent=s.done?'✓':'○';saveWorkout(w)}));
 const close=()=>{saveWorkout(w);closeModal(m)};
 m.querySelector('[data-close]').addEventListener('click',close);m.querySelector('#v065Save').addEventListener('click',close);m.querySelector('#v065Discard').addEventListener('click',discard);m.querySelector('#v065Finish').addEventListener('click',()=>finish(w));m.querySelector('#v065Chat').addEventListener('click',()=>openChat(w));
}

let chatHistory=[];
function openChat(w=null){
 $$('.v065-chat').forEach(x=>x.remove());const m=document.createElement('div');m.className='v05-modal v065-chat';m.innerHTML=`<div class="v05-box"><div class="v05-head"><div><span class="tag">ENTRENADOR</span><h2>Pregunta o cambia algo</h2></div><button type="button" class="v05-close" data-close>×</button></div><div class="card"><div id="v065Log" class="v05-chatlog"></div><textarea id="v065Text" placeholder="Escribe tu pregunta…"></textarea><button type="button" class="btn" id="v065Send" style="margin-top:8px">ENVIAR</button></div></div>`;document.body.appendChild(m);document.body.style.overflow='hidden';const log=m.querySelector('#v065Log');const render=()=>{log.innerHTML=chatHistory.map(x=>`<div class="v05-msg ${x.role==='me'?'v05-me':'v05-coach'}">${safe(x.text)}</div>`).join('');log.scrollTop=log.scrollHeight};render();let changed=false;
 m.querySelector('[data-close]').addEventListener('click',()=>{closeModal(m);if(changed)setTimeout(()=>location.reload(),100)});
 m.querySelector('#v065Send').addEventListener('click',async()=>{const input=m.querySelector('#v065Text'),text=input.value.trim(),btn=m.querySelector('#v065Send');if(!text)return;chatHistory.push({role:'me',text});render();input.value='';btn.disabled=true;btn.textContent='EL ENTRENADOR ESTÁ PENSANDO…';const core=read(CORE,{checkins:{},activities:[]}),plans=read(PLANS,{});try{const r=await fetch(COACH+'/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,checkin:core.checkins?.[iso()]||{},currentPlan:plans[iso()]||null,workoutProgress:w||getStore()[iso()]||null,recentHistory:(core.activities||[]).slice(-8)})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.detail||d.error||`Error ${r.status}`);chatHistory.push({role:'coach',text:d.reply||'He revisado tu petición.'});if(d.updated_session){const p=plans[iso()]||{};p.session=d.updated_session;p.generatedAt=new Date().toISOString();plans[iso()]=p;write(PLANS,plans);const all=getStore();if(all[iso()]&&!all[iso()].completedAt)delete all[iso()];write(WORKOUTS,all);changed=true;chatHistory.push({role:'coach',text:'Sesión actualizada. Al cerrar el chat verás el nuevo entrenamiento.'})}render()}catch(err){chatHistory.push({role:'coach',text:'No pude responder: '+err.message});render()}finally{btn.disabled=false;btn.textContent='ENVIAR'}});
}

function replaceActionButtons(){
 const start=$('#v05StartWorkout');if(start&&!start.dataset.v065){const n=start.cloneNode(true);n.dataset.v065='1';start.replaceWith(n);n.addEventListener('click',e=>{e.preventDefault();try{const w=createWorkout();openWorkout(w)}catch(err){console.error(err);alert('No se pudo iniciar el entrenamiento: '+err.message)}})}
 const chat=$('#v05ChatBefore');if(chat&&!chat.dataset.v065){const n=chat.cloneNode(true);n.dataset.v065='1';chat.replaceWith(n);n.addEventListener('click',e=>{e.preventDefault();try{openChat(getStore()[iso()]||null)}catch(err){console.error(err);alert('No se pudo abrir el chat: '+err.message)}})}
 const resume=$('#v062Resume');if(resume&&!resume.dataset.v065){const n=resume.cloneNode(true);n.dataset.v065='1';resume.replaceWith(n);n.addEventListener('click',()=>{try{const existing=getStore()[iso()];if(existing&&(existing.completedAt||existing.status==='completed'))throw new Error('El entrenamiento de hoy ya está completado y guardado en el historial.');const w=existing||createWorkout();openWorkout(w)}catch(err){alert('No se pudo continuar: '+err.message)}})}
 const discardBtn=$('#v062Discard');if(discardBtn&&!discardBtn.dataset.v065){const n=discardBtn.cloneNode(true);n.dataset.v065='1';discardBtn.replaceWith(n);n.addEventListener('click',discard)}
}
const obs=new MutationObserver(()=>replaceActionButtons());obs.observe(document.body,{childList:true,subtree:true});replaceActionButtons();setInterval(replaceActionButtons,1000);
const ver=()=>{const d=$('#date');if(d)d.innerHTML=d.innerHTML.split('<br>')[0]+'<br>v0.6.5';const v=$('.version');if(v)v.textContent='Entrenador Personal · v0.6.5'};ver();setTimeout(ver,900);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=065').then(r=>r.update()).catch(()=>{}));
})();
