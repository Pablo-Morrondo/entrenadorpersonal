const C='entrenador-personal-v0.6.0',A=['./','./index.html','./v032.js','./v04.js?v=060','./v042-base.js?v=042','./v043.js?v=043','./v05.js?v=050','./v051.js?v=051','./v052.js?v=053','./v054.js?v=054','./v055.js?v=055','./v056.js?v=056','./v057.js?v=057','./v058.js?v=058','./v059.js?v=059','./v060.js?v=060','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(r=>r).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{let x=r.clone();caches.open(C).then(c=>c.put(e.request,x));return r}).catch(()=>caches.match(e.request)));
});
