// ===== app.js (v2.5 – Production-Ready, Offline-First) =====
const GAS_URL = "https://script.google.com/macros/s/AKfycbzMQHSAKRdJ3PxGmzK4IXhyUSLLTAncwuKYKNPxMDNZseGSMMwq8p4TJvcmTv3f83T0/exec";
const APP_VERSION = "2.5.0";

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const byId = (id) => document.getElementById(id);

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

async function sendPayload(payload) {
  if (!GAS_URL || GAS_URL.startsWith("PUT_YOUR_")) throw new Error("ยังไม่ได้ตั้งค่า GAS_URL");
  const body = new URLSearchParams({ data: JSON.stringify(payload) });
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(GAS_URL, { method: "POST", body, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  } catch (err) {
    try { await fetch(GAS_URL, { method: "POST", body, mode: "no-cors" }); } catch (_) {}
    throw err;
  } finally {
    clearTimeout(t);
  }
}

async function refreshQueueCount() {
  const items = await listQueue();
  if (qBadge) qBadge.textContent = `ค้างส่ง: ${items.length}`;
  return items.length;
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
    if (msg) msg.textContent = "⚠️ ส่งไม่สำเร็จ: เก็บคิวไว้ก่อน (จะลองใหม่อัตโนมัติ)";
  } finally {
    refreshQueueCount();
  }
}

let _flushing = false;
async function flushQueue() {
  if (_flushing) return refreshQueueCount();
  _flushing = true;
  try {
    const items = await listQueue();
    if (!navigator.onLine || items.length === 0) return refreshQueueCount();
    if (msg) msg.textContent = `🔄 กำลังส่งคิวค้าง ${items.length} รายการ...`;
    byId("flushBtn") && (byId("flushBtn").disabled = true);
    const sentIds = [];
    let delay = 600;
    for (const item of items) {
      try { await sendPayload(item.payload); sentIds.push(item.id); delay = 600; }
      catch (e) { await new Promise(r => setTimeout(r, delay)); delay = Math.min(delay * 2, 10000); }
    }
    for (const id of sentIds) await removeFromQueue(id);
    const remaining = await refreshQueueCount();
    if (msg) msg.textContent = remaining === 0 ? "☑️ อัปเดตคิวทั้งหมดเสร็จสิ้น" : `⚠️ เหลือ ${remaining} รายการ จะพยายามส่งใหม่ภายหลัง`;
    byId("flushBtn") && (byId("flushBtn").disabled = false);
  } finally { _flushing = false; }
}

function collectForm() {
  const activeSymptoms = $$("#symptoms button.active").map((b) => b.dataset.s);
  const tRaw = byId("temp") ? byId("temp").value : "";
  const tNum = parseFloat((tRaw || "").replace(",", "."));
  const record_id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now() + "-" + Math.random());
  return {
    record_id,
    name:        (byId("name")?.value || "").trim(),
    passport:    (byId("passport")?.value || "").trim(),
    nation:      (byId("nationality")?.value || "").trim(),
    flight:      (byId("flight")?.value || "").trim(),
    temp:        Number.isFinite(tNum) ? tNum : null,
    symptoms:    activeSymptoms,
    note:        (byId("note")?.value || "").trim(),
    ts:          Date.now(),
    tz:          (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'),
    tz_offset:   -new Date().getTimezoneOffset(),
    app_version: APP_VERSION,
  };
}

function downloadCSV(rows) {
  if (!rows || !rows.length) return;
  const header = ["record_id","ts_epoch","ts_th","tz","tz_offset","name","passport","nation","flight","temp","symptoms","note"];
  const lines = [header.join(",")];
  const fmtTH = new Intl.DateTimeFormat('th-TH',{dateStyle:'medium', timeStyle:'short', timeZone:'Asia/Bangkok'});
  for (const r of rows) {
    const p = r.payload || {};
    const ts = Number(p.ts) || null;
    const th = ts ? fmtTH.format(new Date(ts)) : "";
    const arr = [
      p.record_id || "",
      ts ?? "",
      th,
      p.tz || "",
      p.tz_offset ?? "",
      p.name || "",
      p.passport || "",
      p.nation || "",
      p.flight || "",
      (p.temp ?? ""),
      (p.symptoms || []).join("|"),
      (p.note || "").replace(/[
,]/g, " ")
    ].map(v => `"${String(v).replace(/"/g, '""')}"`);
    lines.push(arr.join(","));
  }
  const blob = new Blob([lines.join("
")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `bhg-backup-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function initChips() {
  $$("#symptoms button").forEach((btn) => {
    btn.addEventListener("click", () => btn.classList.toggle("active"));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("[BHG] app.js", APP_VERSION, "loaded");
  updateNetUI(); initChips(); refreshQueueCount(); if (navigator.onLine) flushQueue();
  document.addEventListener("visibilitychange", ()=>{ if (!document.hidden && navigator.onLine) flushQueue(); });

  const form = byId("reportForm");
  const saveBtn = byId("saveBtn");
  if (form) form.addEventListener("submit", async (e) => {
    e.preventDefault(); const btn = e.submitter || saveBtn;
    let data;
    try { data = collectForm(); }
    catch (err) { if (msg) msg.textContent = "กรุณาตรวจช่องข้อมูล: " + (err?.message || err); return; }
    if (!data.name || !data.passport) { if (msg) msg.textContent = "โปรดกรอก ชื่อ และ เลขพาสปอร์ต ให้ครบ"; byId("name")?.focus(); return; }
    if (data.temp && (data.temp < 30 || data.temp > 45)) { if (msg) msg.textContent = "อุณหภูมิผิดปกติ ตรวจอีกครั้งนะคะ"; byId("temp")?.focus(); return; }
    if (btn) { btn.disabled = true; btn.textContent = "กำลังบันทึก..."; }
    try { await sendOrQueue(data); form.reset(); $$("#symptoms button.active").forEach((b) => b.classList.remove("active")); }
    catch (err) { if (msg) msg.textContent = "⚠️ บันทึกไม่สำเร็จ: " + (err?.message || err); }
    finally { if (btn) { btn.disabled = false; btn.textContent = "บันทึก"; } refreshQueueCount(); }
  });

  byId("flushBtn")?.addEventListener("click", flushQueue);
  byId("exportBtn")?.addEventListener("click", async () => {
    const items = await listQueue();
    if (!items.length) { if (msg) msg.textContent = "ไม่มีรายการค้างส่งให้แบ็กอัป"; return; }
    downloadCSV(items);
  });
});
