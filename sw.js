const C='entrenador-personal-v0.4.3',A=['./','./index.html','./v032.js','./v04.js?v=042','./v043.js?v=043','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(async r=>{
      let html=await r.text();
      if(!html.includes('v043.js'))html=html.replace('</body>','<script src="./v043.js?v=043"></script></body>');
      return new Response(html,{status:r.status,statusText:r.statusText,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'}});
    }).catch(()=>caches.match('./index.html').then(async r=>{
      if(!r)return Response.error();
      let html=await r.text();
      if(!html.includes('v043.js'))html=html.replace('</body>','<script src="./v043.js?v=043"></script></body>');
      return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8'}});
    })));
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{let x=r.clone();caches.open(C).then(c=>c.put(e.request,x));return r}).catch(()=>caches.match(e.request)));
});