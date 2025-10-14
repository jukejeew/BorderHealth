// ===== db.js (v2.5 – IndexedDB queue with cap & index) =====
const DB_NAME = 'bhg-db';
const DB_VER = 2;
const STORE  = 'queue';
const QUEUE_CAP = 1000;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('byCreatedAt', 'createdAt', { unique: false });
      } else if (e.oldVersion < 2) {
        const store = req.transaction.objectStore(STORE);
        if (!store.indexNames.contains('byCreatedAt')) {
          store.createIndex('byCreatedAt', 'createdAt', { unique: false });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function _enforceCap(db) {
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const idx = store.index('byCreatedAt');
    const countReq = store.count();
    countReq.onsuccess = () => {
      const total = countReq.result || 0;
      if (total <= QUEUE_CAP) { res(true); return; }
      const over = total - QUEUE_CAP;
      const delIds = [];
      idx.openCursor().onsuccess = (e) => {
        const cur = e.target.result;
        if (!cur || delIds.length >= over) return;
        delIds.push(cur.primaryKey);
        cur.continue();
      };
      tx.oncomplete = () => {
        if (!delIds.length) { res(true); return; }
        const tx2 = db.transaction(STORE, 'readwrite');
        const s2 = tx2.objectStore(STORE);
        delIds.forEach(id => s2.delete(id));
        tx2.oncomplete = () => res(true);
        tx2.onerror = () => rej(tx2.error);
      };
    };
    tx.onerror = () => rej(tx.error);
  });
}

async function addToQueue(payload) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add({ payload, createdAt: Date.now() });
    tx.oncomplete = async () => { try { await _enforceCap(db); res(true); } catch(e){ res(true); } };
    tx.onerror = () => rej(tx.error);
  });
}

async function listQueue() {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const rows = req.result || [];
      rows.sort((a,b) => a.createdAt - b.createdAt);
      res(rows);
    };
    req.onerror = () => rej(req.error);
  });
}

async function removeFromQueue(id) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => res(true);
    tx.onerror = () => rej(tx.error);
  });
}
