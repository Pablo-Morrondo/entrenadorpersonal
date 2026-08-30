(() => {
  'use strict';
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  load('./v042-base.js?v=042')
    .then(()=>load('./v043.js?v=043'))
    .then(()=>load('./v05.js?v=050'))
    .then(()=>load('./v051.js?v=051'))
    .then(()=>load('./v052.js?v=053'))
    .then(()=>load('./v054.js?v=054'))
    .then(()=>load('./v055.js?v=055'))
    .then(()=>load('./v056.js?v=056'))
    .then(()=>load('./v057.js?v=057'))
    .then(()=>load('./v058.js?v=058'))
    .then(()=>load('./v059.js?v=059'))
    .then(()=>load('./v060.js?v=060'))
    .then(()=>load('./v061.js?v=061'))
    .then(()=>load('./v062.js?v=062'))
    .then(()=>load('./v063.js?v=063'))
    .then(()=>load('./v064.js?v=064'))
    .catch(err=>console.error('No se pudo cargar v0.6',err));
})();
