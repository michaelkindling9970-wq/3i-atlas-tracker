const C='atlas-v1';self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(['./','index.html','app.js','data/traj.json','data/pins.json','icon.svg']))));
self.addEventListener('fetch',e=>e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request))));
