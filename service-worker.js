/* service-worker.js — BorderHealth v2.0 (subpath-safe) */
const SW_VERSION = 'bh-v2.3';

/** รายการไฟล์แกน (อย่าใส่สแลชนำหน้า) */
const APP_SHELL = [
  './index.html',
  './styles.css',      // มีจริงคงดี ถ้าไม่มี SW จะข้าม
  './app.js',
  './db.js',           // ถ้าไม่มี ไฟล์จะถูกข้าม
  './favicon.ico',     // ถ้าไม่มี ไฟล์จะถูกข้าม
];

/** ช่วย: แปลงพาธสัมพัทธ์ให้เป็น Request ภายใต้ scope ปัจจุบัน */
function toScopeURL(path) {
  return new URL(path, self.registration.scope).toString();
}

/** ติดตั้ง: เติม cache ทีละไฟล์ (ข้ามตัวที่ 404) */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SW_VERSION);
    for (const path of APP_SHELL) {
      const url = toScopeURL(path);
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (res.ok) await cache.put(url, res.clone());
      } catch (_) { /* ข้ามไฟล์ที่หาไม่เจอ */ }
    }
  })());
  self.skipWaiting();
});

/** เปิดใช้งาน: ลบ cache เก่าที่ชื่อไม่ตรงเวอร์ชัน */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k === SW_VERSION ? null : caches.delete(k))));
    // จัดการ clients ให้ใช้ SW ตัวใหม่
    await self.clients.claim();
  })());
});

/** กลยุทธ์:
 * - นำทาง (HTML): network-first กับ fallback index.html ใน cache
 * - Static (.js/.css/.png/.svg/...): stale-while-revalidate (+ ignoreSearch)
 * - อื่น ๆ: พยายามผ่านเน็ต ถ้าพังและมี cache ก็ให้ cache
 */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // รับเฉพาะ GET
  if (req.method !== 'GET') return;

  const isSameOrigin = url.origin === self.location.origin;
  const isHTMLNav =
    req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  // 1) Navigation requests → Network first, fallback cache
  if (isSameOrigin && isHTMLNav) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-cache' });
        // อัปเดต index.html ใน cache ไว้ใช้ยาม offline
        const cache = await caches.open(SW_VERSION);
        const indexURL = toScopeURL('./index.html');
        cache.put(indexURL, fresh.clone()).catch(() => {});
        return fresh;
      } catch (_) {
        const cache = await caches.open(SW_VERSION);
        const fallback = await cache.match(toScopeURL('./index.html'), { ignoreSearch: true });
        return fallback || new Response('<h1>Offline</h1>', {
          headers: { 'Content-Type': 'text/html; charset=UTF-8' },
          status: 200
        });
      }
    })());
    return;
  }

  // 2) Static assets → stale-while-revalidate
  const ext = url.pathname.split('.').pop()?.toLowerCase();
  const isStatic = ['js', 'css', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'woff', 'woff2'].includes(ext || '');

  if (isSameOrigin && isStatic) {
    event.respondWith((async () => {
      const cache = await caches.open(SW_VERSION);
      const cached = await cache.match(req, { ignoreSearch: true });
      const fetchAndUpdate = fetch(req).then((res) => {
        if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
        return res;
      }).catch(() => null);
      return cached || (await fetchAndUpdate) || new Response('', { status: 504 });
    })());
    return;
  }

  // 3) อื่น ๆ → พยายามสดจากเน็ต, ถ้าเน็ตล่มแล้วมี cache ก็ใช้
  event.respondWith((async () => {
    try {
      return await fetch(req);
    } catch (_) {
      const cache = await caches.open(SW_VERSION);
      const cached = await cache.match(req, { ignoreSearch: true });
      return cached || new Response('', { status: 504 });
    }
  })());
});
