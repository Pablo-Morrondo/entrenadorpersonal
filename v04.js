(() => {
  'use strict';
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  load('./v042-base.js?v=042').then(()=>load('./v043.js?v=043')).catch(err=>console.error('No se pudo cargar v0.4.3',err));
})();
