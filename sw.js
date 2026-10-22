const CACHE='pearlday-kiosk-v12';
const FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
// page: try the network first (latest version), fall back to the saved copy when offline or slow
function networkFirst(req){
  return new Promise(resolve=>{
    let done=false;
    const fallback=()=>caches.match('./index.html').then(r=>r||caches.match('./'));
    const t=setTimeout(()=>{ if(!done){ done=true; fallback().then(resolve); } },4000);
    fetch(req,{cache:'no-store'}).then(res=>{
      if(res&&res.ok){ const copy=res.clone(); caches.open(CACHE).then(c=>c.put('./index.html',copy)); }
      if(!done){ done=true; clearTimeout(t); resolve(res); }
    }).catch(()=>{ if(!done){ done=true; clearTimeout(t); fallback().then(resolve); } });
  });
}
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  if(e.request.mode==='navigate'){ e.respondWith(networkFirst(e.request)); return; }
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=>hit||fetch(e.request)));
});
