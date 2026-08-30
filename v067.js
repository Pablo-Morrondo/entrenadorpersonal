(() => {
'use strict';
const COACH='https://entrenador-personal-coach.morrondin.workers.dev/coach';
const $=s=>document.querySelector(s);
const previousFetch=window.fetch.bind(window);
window.fetch=async(input,init={})=>{
 const url=typeof input==='string'?input:(input?.url||'');
 const method=(init?.method||'GET').toUpperCase();
 if(method==='POST'&&url===COACH){
   const controller=new AbortController();
   const timer=setTimeout(()=>controller.abort(),45000);
   try{
     return await previousFetch(input,{...init,signal:controller.signal});
   }catch(e){
     if(e?.name==='AbortError')throw new Error('El entrenador ha tardado demasiado en preparar la sesión. Pulsa REINTENTAR.');
     throw e;
   }finally{clearTimeout(timer)}
 }
 return previousFetch(input,init);
};

function addTimeoutHint(){
 const st=$('#coachStatus');
 if(!st||st.classList.contains('hide'))return;
 if(st.querySelector('.coach-spin')&&!st.querySelector('#v067Hint')){
   const p=document.createElement('p');p.id='v067Hint';p.className='v32note';p.style.marginTop='8px';p.textContent='Si tarda más de 45 s, se cancelará automáticamente y podrás reintentar.';st.querySelector('.coach-state')?.appendChild(p);
 }
}
const obs=new MutationObserver(addTimeoutHint);obs.observe(document.body,{childList:true,subtree:true,attributes:true});addTimeoutHint();
const ver=()=>{const d=$('#date');if(d)d.innerHTML=d.innerHTML.split('<br>')[0]+'<br>v0.6.7';const v=$('.version');if(v)v.textContent='Entrenador Personal · v0.6.7'};ver();setTimeout(ver,900);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=067').then(r=>r.update()).catch(()=>{}));
})();
