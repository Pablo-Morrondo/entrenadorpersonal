(() => {
  'use strict';
  const CORE='entrenador-v03';
  const today=()=>{const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000);return d.toISOString().slice(0,10)};
  const readCore=()=>{try{return {checkins:{},activities:[],...JSON.parse(localStorage.getItem(CORE)||'{}')}}catch{return {checkins:{},activities:[]}}};
  const writeCore=db=>localStorage.setItem(CORE,JSON.stringify(db));

  const init=()=>{
    const group=document.querySelector('[data-f="place"]');
    if(!group||group.dataset.multiReady==='1')return;
    group.dataset.multiReady='1';

    const row=group.closest('.row');
    const label=row?.querySelector('.label');
    if(label)label.textContent='Opciones disponibles hoy · puedes marcar varias';

    const ensure=(value,labelText)=>{
      if(group.querySelector(`[data-v="${value}"]`))return;
      const b=document.createElement('button');
      b.type='button';b.className='chip';b.dataset.v=value;b.textContent=labelText;
      group.appendChild(b);
    };
    ensure('Spa','🧖 Spa');
    ensure('Piscina','🏊 Piscina');

    const selectedPlaces=()=>[...group.querySelectorAll('.chip.on')].map(b=>b.dataset.v||b.textContent.trim()).filter(Boolean);
    const saved=readCore().checkins?.[today()]||{};
    const savedPlaces=Array.isArray(saved.placesAvailable)&&saved.placesAvailable.length?saved.placesAvailable:(saved.place?[saved.place]:[]);
    if(savedPlaces.length){
      group.querySelectorAll('.chip').forEach(b=>b.classList.toggle('on',savedPlaces.includes(b.dataset.v)));
    }

    group.onclick=e=>{
      const b=e.target.closest('.chip');
      if(!b)return;
      b.classList.toggle('on');
    };

    const nativeFetch=window.fetch.bind(window);
    window.fetch=async (input,options={})=>{
      const url=typeof input==='string'?input:input?.url||'';
      if(url.includes('entrenador-personal-coach')&&options?.body){
        try{
          const body=JSON.parse(options.body);
          const core=readCore(), c=core.checkins?.[today()]||{};
          const places=selectedPlaces().length?selectedPlaces():(Array.isArray(c.placesAvailable)&&c.placesAvailable.length?c.placesAvailable:(c.place?[c.place]:[]));
          if(body?.checkin){
            body.checkin.places_available=places;
            body.checkin.place=places.join(', ');
          }
          options={...options,body:JSON.stringify(body)};
        }catch{}
      }
      return nativeFetch(input,options);
    };

    const form=document.querySelector('#check');
    form?.addEventListener('submit',()=>{
      const places=selectedPlaces();
      setTimeout(()=>{
        const core=readCore(), d=today();
        if(core.checkins?.[d]&&places.length){
          core.checkins[d].placesAvailable=places;
          core.checkins[d].place=places.join(', ');
          writeCore(core);
        }
        const summary=document.querySelector('#summary');
        if(summary&&places.length){
          const base=summary.textContent.replace(/ · Opciones disponibles:.*$/,'');
          summary.textContent=`${base} · Opciones disponibles: ${places.join(' / ')}`;
        }
      },30);
    });

    const style=document.createElement('style');
    style.textContent='[data-f="place"] .chip.on{box-shadow:0 0 0 2px rgba(114,242,179,.18)}';
    document.head.appendChild(style);

    const version=document.querySelector('.version');
    if(version)version.textContent='Entrenador Personal · v0.4.3';
    const date=document.querySelector('#date');
    if(date)date.innerHTML=date.innerHTML.replace(/v0\.4(?:\.2)?|v0\.3\.2/,'v0.4.3');
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));else setTimeout(init,0);
})();
