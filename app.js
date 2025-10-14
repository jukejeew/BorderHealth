// ===== app.js (clean v2.2) =====
// TODO: ใส่ URL ของ Google Apps Script (Web App) ของคุณที่นี่
const GAS_URL = "https://script.google.com/macros/s/AKfycbzMQHSAKRdJ3PxGmzK4IXhyUSLLTAncwuKYKNPxMDNZseGSMMwq8p4TJvcmTv3f83T0/exec";

// -------- Shorthands & Safe DOM --------
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const byId = (id) => document.getElementById(id);

function mustId(id, label = id) {
  const el = byId(id);
  if (!el) throw new Error(`Missing element #${id} (${label})`);
  return el;
}
function getText(id, label) {
  return (mustId(id, label).value || "").trim();
}

// -------- UI: Network & Queue badges --------
const netBadge = byId("net");
const qBadge   = byId("queueCount");
const msg      = byId("msg");

function updateNetUI() {
  const online = navigator.onLine;
  if (netBadge) {
    netBadge.textContent = online ? "Online" : "Offline";
    netBadge.className = online ? "online" : "offline";
  }
}
window.addEventListener("online", () => { updateNetUI(); flushQueue(); });
window.addEventListener("offline", updateNetUI);

async function refreshQueueCount() {
  const items = await listQueue(); // จาก db.js
  if (qBadge) qBadge.textContent = `ค้างส่ง: ${items.length}`;
  return items.length;
}

// -------- GAS comms --------
async function sendPayload(payload) {
  if (!GAS_URL || GAS_URL.startsWith("PUT_YOUR_")) {
    throw new Error("ยังไม่ได้ตั้งค่า GAS_URL");
  }
  const body = new URLSearchParams();
  body.set("data", JSON.stringify(payload));
  const res = await fetch(GAS_URL, { method: "POST", body });
  if (!res.ok && res.type !== "opaque") throw new Error("ส่งไม่สำเร็จ");
  return true;
}

async function sendOrQueue(payload) {
  try {
    if (navigator.onLine) {
      await sendPayload(payload);
      if (msg) msg.textContent = "✅ ส่งเข้าชีทเรียบร้อย";
    } else {
      await addToQueue(payload);
      if (msg) msg.textContent = "💾 ออฟไลน์: เก็บคิวไว้แล้ว";
    }
  } catch (e) {
    await addToQueue(payload);
    if (msg) msg.textContent = "⚠️ ส่งไม่สำเร็จ: เก็บคิวไว้ก่อน";
  } finally {
    refreshQueueCount();
  }
}

async function flushQueue() {
  const items = await listQueue();
  if (!navigator.onLine || items.length === 0) return refreshQueueCount();

  if (msg) msg.textContent = "🔄 กำลังส่งคิวค้าง...";
  const flushBtn = byId("flushBtn");
  if (flushBtn) flushBtn.disabled = true;

  for (const it of items) {
    try {
      await sendPayload(it.payload);
      await removeFromQueue(it.id);
    } catch (e) {
      if (msg) msg.textContent = "⚠️ ส่งคิวไม่สำเร็จ จะลองใหม่เมื่อออนไลน์";
      if (flushBtn) flushBtn.disabled = false;
      return;
    }
  }

  if (msg) msg.textContent = "☑️ อัปเดตคิวเสร็จ";
  if (flushBtn) flushBtn.disabled = false;
  refreshQueueCount();
}

// -------- Form collection (กันพัง + id ตรงกับหน้า HTML) --------
function collectForm() {
  const activeSymptoms = $$("#symptoms button.active").map((b) => b.dataset.s);
  const tRaw = byId("temp") ? byId("temp").value : "";
  const tNum = parseFloat(tRaw);

  return {
    id: (crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()),
    name:        getText("name", "ชื่อ"),
    passport:    getText("passport", "เลขพาสปอร์ต"),
    nation:      getText("nationality", "สัญชาติ"), // NOTE: ใช้ id="nationality"
    flight:      getText("flight", "เที่ยวบิน"),
    temp:        Number.isFinite(tNum) ? tNum : null,
    symptoms:    activeSymptoms,
    note:        getText("note", "บันทึกเพิ่มเติม"),
    ts:          Date.now(), // ✅ ส่งเลข epoch ms ชัวร์ ไม่ถูกแปลงเป็น Z
  };
}

// -------- CSV backup (จากคิว) --------
function downloadCSV(rows) {
  if (!rows || !rows.length) return;
  const header = ["ts","name","passport","nation","flight","temp","symptoms","note"];
  const lines = [header.join(",")];

  for (const r of rows) {
    const p = r.payload || {};
    const arr = [
      p.ts || "",
      p.name || "",
      p.passport || "",
      p.nation || "",
      p.flight || "",
      p.temp ?? "",
      (p.symptoms || []).join("|"),
      (p.note || "").replace(/[\r\n,]/g, " ")
    ].map(v => `"${String(v).replace(/"/g, '""')}"`);
    lines.push(arr.join(","));
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "mfr-backup.csv"; a.click();
  URL.revokeObjectURL(url);
}

// -------- UI: symptom chips --------
function initChips() {
  $$("#symptoms button").forEach((btn) => {
    btn.addEventListener("click", () => btn.classList.toggle("active"));
  });
}

// -------- Init --------
document.addEventListener("DOMContentLoaded", () => {
  console.log("[MFR] app.js v2.2 loaded");
  updateNetUI();
  initChips();
  refreshQueueCount();
  if (navigator.onLine) flushQueue();

  const form = byId("reportForm");     // <form id="reportForm">...</form>
  const saveBtn = byId("saveBtn");     // <button id="saveBtn" type="submit">บันทึก</button>

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = e.submitter || saveBtn;

      let data;
      try {
        data = collectForm();
      } catch (err) {
        console.error("[MFR] collectForm error:", err);
        if (msg) msg.textContent = "กรุณาตรวจช่องข้อมูล: " + (err && err.message ? err.message : err);
        return;
      }

      if (!data.name || !data.passport) {
        if (msg) msg.textContent = "โปรดกรอก ชื่อ และ เลขพาสปอร์ต ให้ครบ";
        return;
      }
      if (data.temp && (data.temp < 30 || data.temp > 45)) {
        if (msg) msg.textContent = "อุณหภูมิผิดปกติ ตรวจอีกครั้งนะคะ";
        return;
      }

      if (btn) { btn.disabled = true; btn.textContent = "กำลังบันทึก..."; }
      try {
        await sendOrQueue(data);
        form.reset();
        $$("#symptoms button.active").forEach((b) => b.classList.remove("active"));
        if (msg) msg.textContent = navigator.onLine ? "✅ ส่งเข้าชีทแล้ว" : "💾 ออฟไลน์: เก็บคิวแล้ว";
      } catch (err) {
        console.error("[MFR] submit error:", err);
        if (msg) msg.textContent = "⚠️ บันทึกไม่สำเร็จ: " + (err && err.message ? err.message : err);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = "บันทึก"; }
        refreshQueueCount();
      }
    });
  }

  byId("flushBtn")?.addEventListener("click", flushQueue);
  byId("exportBtn")?.addEventListener("click", async () => {
    const items = await listQueue();
    if (!items.length) {
      if (msg) msg.textContent = "ไม่มีรายการค้างส่งให้แบ็กอัป";
      return;
    }
    downloadCSV(items);
  });
});
