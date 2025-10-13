
// TODO: ใส่ URL ของ Google Apps Script ที่ deploy เป็น Web App แล้ว
const GAS_URL = "https://script.google.com/macros/s/AKfycbzMQHSAKRdJ3PxGmzK4IXhyUSLLTAncwuKYKNPxMDNZseGSMMwq8p4TJvcmTv3f83T0/exec";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const netBadge = $('#net');
const qBadge = $('#queueCount');
const msg = $('#msg');

function updateNetUI() {
  const online = navigator.onLine;
  netBadge.textContent = online ? 'Online' : 'Offline';
  netBadge.className = online ? 'online' : 'offline';
  netBadge.id = 'net';
}
window.addEventListener('online', () => { updateNetUI(); flushQueue(); });
window.addEventListener('offline', updateNetUI);

async function refreshQueueCount() {
  const items = await listQueue();
  qBadge.textContent = `ค้างส่ง: ${items.length}`;
  return items.length;
}

console.log('[MFR] app.js v2.0 loaded'); // ไว้ดูว่าขึ้นไฟล์ใหม่จริง

async function sendPayload(payload) {
  if (!GAS_URL || GAS_URL.startsWith('PUT_YOUR_')) {
    throw new Error('ยังไม่ได้ตั้งค่า GAS_URL');
  }

  // ห่อข้อมูลเป็นฟอร์ม urlencoded เพื่อให้เบราว์เซอร์ตั้ง Content-Type แบบ simple เอง
  const body = new URLSearchParams();
  body.set('data', JSON.stringify(payload));

  const res = await fetch(GAS_URL, {
    method: 'POST',
    body // สำคัญ: "ห้าม" ใส่ headers เอง จะไปกระตุ้น preflight
  });

  // บางที Apps Script อาจไม่ส่ง CORS header ทำให้อ่าน response ไม่ได้ (opaque)
  // เราถือว่าส่งออกจากเบราว์เซอร์แล้วเป็น "สำเร็จ" สำหรับ MVP
  if (!res.ok && res.type !== 'opaque') {
    throw new Error('ส่งไม่สำเร็จ');
  }
  return true;
}

async function sendOrQueue(payload) {
  const online = navigator.onLine;
  try {
    if (online) {
      await sendPayload(payload);
      msg.textContent = '✅ ส่งเข้าชีทเรียบร้อย';
    } else {
      await addToQueue(payload);
      msg.textContent = '💾 ออฟไลน์: เก็บคิวไว้แล้ว';
    }
  } catch (e) {
    await addToQueue(payload);
    msg.textContent = '⚠️ ส่งไม่สำเร็จ: เก็บคิวไว้ก่อน';
  } finally {
    refreshQueueCount();
  }
}

async function flushQueue() {
  const items = await listQueue();
  if (!navigator.onLine || items.length === 0) return refreshQueueCount();

  msg.textContent = '🔄 กำลังส่งคิวค้าง...';
  $('#flushBtn').disabled = true;
  for (const it of items) {
    try {
      await sendPayload(it.payload);
      await removeFromQueue(it.id);
    } catch (e) {
      // ถ้าส่งรายการหนึ่งไม่สำเร็จ ให้หยุด (มักเป็นเน็ตล่มหรือ URL ผิด)
      msg.textContent = '⚠️ ส่งคิวไม่สำเร็จ จะลองใหม่เมื่อออนไลน์';
      $('#flushBtn').disabled = false;
      break;
    }
  }
  msg.textContent = '☑️ อัปเดตคิวเสร็จ';
  refreshQueueCount();
}

function collectForm() {
  const activeSymptoms = $$('#symptoms button.active').map(b => b.dataset.s);
  const tempVal = parseFloat($('#temp').value);
  return {
    id: (crypto?.randomUUID && crypto.randomUUID()) || String(Date.now()) + Math.random(),
    name: $('#name').value.trim(),
    passport: $('#passport').value.trim(),
    nation: $('#nation').value.trim(),
    flight: $('#flight').value.trim(),
    temp: Number.isFinite(tempVal) ? tempVal : null,
    symptoms: activeSymptoms,
    note: $('#note').value.trim(),
    ts: new Date().toISOString()
  };
}

function downloadCSV(rows) {
  if (!rows.length) return;
  const header = ['ts','name','passport','nation','flight','temp','symptoms','note'];
  const csv = [header.join(',')].concat(rows.map(r => [
    r.payload.ts,
    r.payload.name,
    r.payload.passport,
    r.payload.nation,
    r.payload.flight,
    r.payload.temp ?? '',
    (r.payload.symptoms || []).join('|'),
    (r.payload.note || '').replace(/[\r\n,]/g,' ')
  ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))).join('\n');

  const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mfr-backup.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function initChips() {
  $$('#symptoms button').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('active'));
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  updateNetUI();
  initChips();
  refreshQueueCount();
  if (navigator.onLine) flushQueue();

  const form = document.getElementById('reportForm');
  const saveBtn = document.getElementById('saveBtn'); // <-- ชื่อเดียวกับ index.html

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // ใช้ปุ่มที่กดจริง ๆ ถ้ามี (e.submitter) ตกลงที่ saveBtn เป็นค่า fallback
    const btn = e.submitter || document.getElementById('saveBtn');

    // เก็บข้อมูลจากฟอร์ม
    const data = collectForm();
    if (!data.name || !data.passport) {
      msg.textContent = 'โปรดกรอก ชื่อ และ เลขพาสปอร์ต ให้ครบ';
      return;
    }

    // เช็คอุณหภูมิโดยคร่าว
    if (data.temp && (data.temp < 30 || data.temp > 45)) {
      msg.textContent = 'อุณหภูมิผิดปกติ ตรวจอีกครั้งนะคะ';
      return;
    }

    // กันกดซ้ำ + ใส่สถานะ
    if (btn) { btn.disabled = true; btn.textContent = 'กำลังบันทึก...'; }

    try {
      await sendOrQueue(data); // ภายในจะเรียก sendPayload หรือเก็บคิว
      form.reset();
      document.querySelectorAll('#symptoms button.active').forEach(b => b.classList.remove('active'));
      msg.textContent = navigator.onLine ? '✅ ส่งเข้าชีทแล้ว' : '💾 ออฟไลน์: เก็บคิวแล้ว';
    } catch (err) {
      console.error('[MFR] submit error:', err);
      msg.textContent = '⚠️ บันทึกไม่สำเร็จ: ' + (err?.message || err);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'บันทึก'; }
      refreshQueueCount();
    }
  });

  document.getElementById('flushBtn').addEventListener('click', flushQueue);
  document.getElementById('exportBtn').addEventListener('click', async () => {
    const items = await listQueue();
    if (!items.length) { msg.textContent = 'ไม่มีรายการค้างส่งให้แบ็กอัป'; return; }
    downloadCSV(items);
  });
});

