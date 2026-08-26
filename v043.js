(() => {
  'use strict';
  const init=()=>{
    const group=document.querySelector('[data-f="place"]');
    if(!group||group.dataset.multiReady==='1')return;
    group.dataset.multiReady='1';

    const row=group.closest('.row');
    const label=row?.querySelector('.label');
    if(label) label.textContent='Opciones disponibles hoy · puedes marcar varias';

    const ensure=(value,labelText)=>{
      if(group.querySelector(`[data-v="${value}"]`))return;
      const b=document.createElement('button');
      b.type='button';b.className='chip';b.dataset.v=value;b.textContent=labelText;
      group.appendChild(b);
    };
    ensure('Spa','🧖 Spa');
    ensure('Piscina','🏊 Piscina');

    group.addEventListener('click',e=>{
      const b=e.target.closest('.chip');
      if(!b)return;
      e.preventDefault();
      e.stopImmediatePropagation();
      b.classList.toggle('on');
    },true);

    const selectedPlaces=()=>[...group.querySelectorAll('.chip.on')].map(b=>b.dataset.v||b.textContent.trim()).filter(Boolean);

    const nativeFetch=window.fetch.bind(window);
    window.fetch=async (input,init={})=>{
      const url=typeof input==='string'?input:input?.url||'';
      if(url.includes('entrenador-personal-coach')&&init?.body){
        try{
          const body=JSON.parse(init.body);
          const places=selectedPlaces();
          if(body?.checkin){
            body.checkin.places_available=places;
            body.checkin.place=places.join(', ');
          }
          init={...init,body:JSON.stringify(body)};
        }catch{}
      }
      return nativeFetch(input,init);
    };

    const form=document.querySelector('#check');
    form?.addEventListener('submit',()=>{
      setTimeout(()=>{
        const places=selectedPlaces();
        const summary=document.querySelector('#summary');
        if(summary&&places.length){
          const txt=`Opciones disponibles: ${places.join(' · ')}`;
          if(!summary.textContent.includes('Opciones disponibles:')) summary.insertAdjacentHTML('beforeend',`<br>${txt}`);
        }
      },150);
    });

    const style=document.createElement('style');
    style.textContent='[data-f="place"] .chip.on{box-shadow:0 0 0 2px rgba(114,242,179,.18)}';
    document.head.appendChild(style);

    const version=document.querySelector('.version');
    if(version)version.textContent='Entrenador Personal · v0.4.3';
    const date=document.querySelector('#date');
    if(date)date.innerHTML=date.innerHTML.replace(/v0\.4(?:\.2)?/,'v0.4.3');
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));else setTimeout(init,0);
})();
