(() => {
'use strict';
const WORKOUTS='entrenador-v05-workouts';
const iso=()=>{const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000);return d.toISOString().slice(0,10)};
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||f}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

function addDiscardButton(){
  document.querySelectorAll('.v05-modal').forEach(modal=>{
    if(!modal.querySelector('#finishWorkout') || modal.querySelector('#discardWorkout'))return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.id='discardWorkout';
    btn.className='btn bad';
    btn.style.marginTop='10px';
    btn.textContent='🗑️ DESCARTAR ENTRENAMIENTO DE HOY';
    btn.onclick=()=>{
      const all=read(WORKOUTS,{}),w=all[iso()];
      if(w?.completedAt){alert('Este entrenamiento ya está finalizado. Para borrarlo usa Historial.');return;}
      if(!w){alert('No hay un entrenamiento iniciado pendiente.');return;}
      if(!confirm('¿Descartar el entrenamiento iniciado de hoy? Se borrarán las series o cambios que hayas marcado en esta sesión, pero se conservará el plan propuesto.'))return;
      delete all[iso()];write(WORKOUTS,all);
      alert('Entrenamiento iniciado descartado.');
      location.reload();
    };
    modal.querySelector('#finishWorkout').insertAdjacentElement('afterend',btn);
  });
}

const obs=new MutationObserver(addDiscardButton);obs.observe(document.body,{childList:true,subtree:true});
addDiscardButton();

const ver=()=>{const d=document.querySelector('#date');if(d)d.innerHTML=d.innerHTML.split('<br>')[0]+'<br>v0.6.1';const v=document.querySelector('.version');if(v)v.textContent='Entrenador Personal · v0.6.1'};ver();setTimeout(ver,900);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=061').then(r=>r.update()).catch(()=>{}));
})();
