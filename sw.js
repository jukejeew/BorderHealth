
const CACHE='bhg-v145-app-1';
const ASSETS=[
  './','./index.html','./manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png',
  './assets/tesseract/tesseract.min.js',
  './assets/tesseract/worker.min.js',
  './assets/tesseract/tesseract-core.wasm.js',
  './assets/tessdata/eng.traineddata'
];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS).catch(()=>{})));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
});
self.addEventListener('fetch',e=>{
  const req=e.request, url=req.url;
  if(/unpkg\.com|tessdata\.projectnaptha\.com|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net/i.test(url)){
    e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(net=>{
      caches.open(CACHE).then(c=>c.put(req,net.clone())); return net;
    }).catch(()=>caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(net=>{
    caches.open(CACHE).then(c=>c.put(req,net.clone())); return net;
  }).catch(()=>caches.match('./index.html'))));
});
