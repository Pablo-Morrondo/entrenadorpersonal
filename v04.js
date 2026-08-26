(() => {
  'use strict';
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const CORE='entrenador-v03', PROFILE='entrenador-v032-profile', DAILY='entrenador-v032-daily';
  const PLANS='entrenador-v04-plans', CLINICAL='entrenador-v04-clinical';
  const COACH='https://entrenador-personal-coach.morrondin.workers.dev/coach';
  const iso=()=>{const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000);return d.toISOString().slice(0,10)};
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}};
  const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const selected=f=>document.querySelector(`[data-f="${f}"] .on`)?.dataset.v||document.querySelector(`[data-f="${f}"] .on`)?.textContent.trim()||'';
  const chosen=f=>document.querySelector(`[data-v32="${f}"] .on`)?.dataset.v||'';
  const notify=msg=>{const t=$('#toast');t.textContent=msg;t.classList.remove('hide');setTimeout(()=>t.classList.add('hide'),2600)};
  let plans=read(PLANS,{}), clinical=read(CLINICAL,{confirmedRestrictions:['Sin carrera','Sin trail running','Sin saltos ni impacto','Sin bicicleta de carretera','Sin ejercicios nuevos de rehabilitación sin permiso del fisio'],lastConfirmed:null});

  const style=document.createElement('style');
  style.textContent=`html,body{max-width:100%;overflow-x:hidden}.coach-state{display:flex;gap:9px;align-items:center;padding:12px;border-radius:14px;background:#081813;border:1px solid var(--l);margin:10px 0}.coach-spin{width:20px;height:20px;border:3px solid #285141;border-top-color:var(--g);border-radius:50%;animation:coachspin .8s linear infinite;flex:0 0 auto}@keyframes coachspin{to{transform:rotate(360deg)}}.coach-card{border-color:#3e8067}.coach-title{font-size:20px;margin:0 0 5px}.coach-meta{color:var(--g);font-weight:800;font-size:12px;margin-bottom:12px}.coach-reason{color:var(--m);font-size:13px;line-height:1.45}.coach-ex{background:#081813;border:1px solid var(--l);border-radius:14px;padding:13px;margin:9px 0}.coach-ex h3{margin:0 0 6px;font-size:15px}.coach-ex p{margin:4px 0;color:var(--m);font-size:12px;line-height:1.4}.coach-num{display:inline-grid;place-items:center;width:25px;height:25px;border-radius:50%;background:var(--g);color:#07120f;margin-right:7px}.coach-alert{background:#3c3020;color:#ffe39a;border-radius:12px;padding:11px;font-size:12px;margin:10px 0}.coach-stop{background:#4b282c;color:#ffdada}.physio-help{font-size:12px;color:var(--m);line-height:1.45;margin:8px 0}.tabs{overflow-x:auto;justify-content:flex-start}.tabs button{flex:1 0 70px}`;
  document.head.appendChild(style);

  document.querySelector('[data-v32="trainingType"] [data-v="Otro"]')?.classList.add('on');
  const typeTitle=$('.v32-training .label');
  typeTitle?.closest('.v32-training')?.classList.add('hide');
  if(typeTitle) typeTitle.textContent='El entrenador elegirá la actividad';
  const physioNotes=$('#physioNotes');
  if(physioNotes){
    physioNotes.placeholder='Escribe o pega lo que te ha hecho y dicho el fisio: tratamiento, ejercicios, apoyo, muletas, lo que permite y lo que prohíbe…';
    physioNotes.insertAdjacentHTML('beforebegin','<p class="physio-help">Si todavía no has salido del fisio, déjalo vacío: el entrenador esperará sus indicaciones antes de decidir la sesión.</p>');
  }

  const saved=$('#saved');
  const status=document.createElement('div');status.id='coachStatus';status.className='hide';
  const planCard=document.createElement('div');planCard.id='coachPlan';planCard.className='card coach-card hide';
  saved.after(status,planCard);
  $('#start').textContent='VER ENTRENAMIENTO DE HOY';
  $('#summary').insertAdjacentHTML('afterend','<p class="physio-help">El entrenador decide la sesión según tu check-in, las notas del fisio y tu evolución.</p>');

  function payload(){
    const profile=read(PROFILE,{}), core=read(CORE,{checkins:{},activities:[]}), daily=read(DAILY,{}), today=iso();
    const c=core.checkins?.[today]||{};
    return {
      profile:{age:profile.age||54,height_m:profile.height||1.78,weight:profile.weight||'70-73',days_per_week:profile.days||5,resources:profile.resources||[],goals:profile.goals||{},available_minutes:Number(chosen('availableTime')||daily[today]?.availableTime||40),experience:'Experiencia prolongada en fuerza'},
      checkin:{date:today,can_train:(selected('training')||c.training)==='Sí',place:selected('place')||c.place,energy:Number(selected('energy')||c.energy||0),sleep:selected('sleep')||c.sleep,fatigue:selected('fatigue')||c.fatigue,achilles:selected('achilles')||c.achilles,swelling:selected('swelling')||c.swelling,weight:$('#weight')?.value||c.weight||'',sleep_hours:$('#sleepHours')?.value||daily[today]?.sleepHours||'',sleep_score:$('#sleepScore')?.value||daily[today]?.sleepScore||''},
      physio:{appointment_today:(selected('physio')||c.physio)==='Sí',notes:$('#physioNotes')?.value||c.physioNotes||'',current_state:'Segundo mes de recuperación de lesión parcial del Aquiles izquierdo; una muleta según último dato confirmado.',after_appointment:Boolean(($('#physioNotes')?.value||c.physioNotes||'').trim())},
      recentHistory:[...(core.activities||[]).slice(-10),...Object.values(core.checkins||{}).slice(-7)].slice(-14),
      confirmedRestrictions:clinical.confirmedRestrictions
    };
  }

  function setBusy(on,msg='El entrenador está preparando tu sesión…'){
    status.className=on?'card':'hide';
    if(on)status.innerHTML=`<div class="coach-state"><span class="coach-spin"></span><div><strong>${safe(msg)}</strong><p class="v32note">Está revisando tu estado y las restricciones del Aquiles.</p></div></div>`;
  }
  function renderPlan(plan){
    if(!plan)return;
    status.className='hide';planCard.classList.remove('hide');
    const clinicalBlock=plan.needs_confirmation?`<div class="coach-alert"><strong>Confirma la interpretación del fisio</strong><p>${safe(plan.clinical_update?.summary||'Revisa que permisos, restricciones, apoyo y muletas coincidan con lo indicado por tu fisio.')}</p><button class="btn alt" id="confirmClinical">CONFIRMAR INTERPRETACIÓN</button></div>`:'';
    if(plan.status==='stop'){
      planCard.innerHTML=`<h2>⛔ Hoy no se genera entrenamiento</h2><div class="coach-alert coach-stop">${safe(plan.message)}</div>${clinicalBlock}`;
    }else if(plan.status==='pending_physio'){
      planCard.innerHTML=`<h2>⏳ Esperando las notas del fisio</h2><p class="coach-reason">${safe(plan.message)}</p><button class="btn alt" id="editPhysio">AÑADIR NOTAS DEL FISIO</button>`;
    }else if(!plan.session){
      planCard.innerHTML=`<h2>Recuperación para hoy</h2><p class="coach-reason">${safe(plan.message)}</p>${clinicalBlock}`;
    }else{
      const s=plan.session;
      planCard.innerHTML=`<p class="tag">SESIÓN ELEGIDA POR TU ENTRENADOR</p><h2 class="coach-title">${safe(s.title)}</h2><div class="coach-meta">${safe(s.duration_minutes)} min · Carga ${safe(s.load)}</div><p class="coach-reason"><strong>Objetivo:</strong> ${safe(s.objective)}<br>${safe(s.reason)}</p>${clinicalBlock}<div>${s.exercises.map((x,i)=>`<div class="coach-ex"><h3><span class="coach-num">${i+1}</span>${safe(x.name)}</h3><p><strong>${safe(x.sets)} series · ${safe(x.reps)}</strong> · descanso ${safe(x.rest_seconds)} s</p><p>${safe(x.load_guidance)}</p><p>${safe(x.technique)}</p></div>`).join('')}</div><button class="btn" id="beginCoach">EMPEZAR ESTA SESIÓN</button>`;
    }
    $('#confirmClinical')?.addEventListener('click',()=>{const u=plan.clinical_update||{};clinical={...clinical,lastConfirmed:new Date().toISOString(),lastUpdate:u,confirmedRestrictions:[...new Set([...(clinical.confirmedRestrictions||[]),...(u.restrictions||[])])]};write(CLINICAL,clinical);plan.needs_confirmation=false;plans[iso()]=plan;write(PLANS,plans);renderPlan(plan);notify('Interpretación confirmada')});
    $('#editPhysio')?.addEventListener('click',()=>$('#edit').click());
    $('#beginCoach')?.addEventListener('click',()=>{plan.startedAt=new Date().toISOString();plans[iso()]=plan;write(PLANS,plans);document.querySelector('#garmin')?.scrollIntoView({behavior:'smooth'});notify('Sesión iniciada')});
  }

  async function askCoach(){
    setBusy(true);
    try{
      const res=await fetch(COACH,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload())});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(data.detail||data.error||`Error ${res.status}`);
      plans[iso()]={...data,generatedAt:new Date().toISOString()};write(PLANS,plans);renderPlan(plans[iso()]);notify('Entrenamiento preparado');
    }catch(err){
      status.className='card';status.innerHTML=`<div class="coach-alert coach-stop"><strong>No se pudo preparar la sesión</strong><p>${safe(err.message)}</p><button class="btn alt" id="retryCoach">REINTENTAR</button></div>`;
      $('#retryCoach').onclick=askCoach;
    }
  }

  $('#check').addEventListener('submit',()=>setTimeout(()=>{if(read(CORE,{checkins:{}}).checkins?.[iso()])askCoach()},80));
  $('#start').addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const p=plans[iso()];p?renderPlan(p):askCoach()},{capture:true});
  const oldEdit=$('#edit').onclick;$('#edit').onclick=e=>{planCard.classList.add('hide');status.className='hide';oldEdit?.call(e.currentTarget,e)};
  const existing=plans[iso()];if(existing)renderPlan(existing);

  const resources=$('#resources');
  if(resources&&!resources.querySelector('[data-resource="Bici estática"]')){
    resources.insertAdjacentHTML('beforeend','<button type="button" class="chip" data-resource="Bici estática">Bici estática</button>');
    const b=resources.lastElementChild;b.onclick=()=>b.classList.toggle('on');
  }
  $('#date').innerHTML=$('#date').innerHTML.replace(/v0\.3\.2/,'v0.4');
  $('.version').textContent='Entrenador Personal · v0.4';
  if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=040').then(r=>r.update()).catch(()=>{}));
})();
