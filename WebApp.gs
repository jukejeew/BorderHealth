// ===== WebApp.gs (v2.5 – Server: use client epoch, write Thai string) =====
const SHEET_ID   = 'PUT_YOUR_SHEET_ID';
const SHEET_NAME = 'Data';
const TZ         = 'Asia/Bangkok';

function sheet_(){ return SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME); }

function parsePayload_(e){
  try{ if(e && e.postData && e.postData.contents) return JSON.parse(e.postData.contents); }catch(err){}
  try{ if(e && e.parameter && e.parameter.data)    return JSON.parse(e.parameter.data);    }catch(err){}
  if(e && e.parameter){ const p = {}; const ks = Object.keys(e.parameter);
    if (ks.length) { ks.forEach(k => p[k] = e.parameter[k]);
      if (typeof p.symptoms==='string') p.symptoms = p.symptoms.includes('|') ? p.symptoms.split('|') : (p.symptoms.includes(',') ? p.symptoms.split(',') : [p.symptoms]);
      return p; } }
  return {};
}
function coerceEpochMs_(ts){
  if (typeof ts === 'number' && isFinite(ts)) return ts;
  if (typeof ts === 'string' && ts.trim()){ const n = Number(ts); if (isFinite(n)) return n; const d = new Date(ts); if (!isNaN(d.getTime())) return d.getTime(); }
  return Date.now();
}
function toThaiString_(ms){ return Utilities.formatDate(new Date(ms), TZ, 'yyyy-MM-dd HH:mm:ss'); }
function S(v,n){ if(v==null) return ''; v=String(v).trim(); return n && v.length>n ? v.slice(0,n) : v; }
function N(v){ const n = Number(v); return isFinite(n) ? n : ''; }
function J(a){ if(!Array.isArray(a)) return S(a,200); return a.map(x=>S(x,80)).join('|'); }

function appendRow_(d){
  const tsEpoch = coerceEpochMs_(d.ts);
  const thStr   = toThaiString_(tsEpoch);
  const row = [
    thStr,                 // A: Thai time string
    S(d.name,120),         // B
    S(d.passport,40),      // C
    S(d.nation,80),        // D
    S(d.flight,40),        // E
    N(d.temp),             // F
    J(d.symptoms),         // G
    S(d.note,1000),        // H
    S(d.record_id,80),     // I
    tsEpoch,               // J
    S(d.tz,60),            // K
    N(d.tz_offset),        // L
    S(d.app_version,20)    // M
  ];
  const sh   = sheet_();
  const lock = LockService.getDocumentLock();
  lock.waitLock(10000);
  try { sh.appendRow(row); }
  finally { lock.releaseLock(); }
}

function doPost(e){
  try { appendRow_(parsePayload_(e)); return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT); }
  catch(err){ return ContentService.createTextOutput('ERR:'+err).setMimeType(ContentService.MimeType.TEXT); }
}
function doGet(e){
  try {
    if (e && e.parameter && (e.parameter.data || Object.keys(e.parameter).length)) {
      appendRow_(parsePayload_(e));
      return ContentService.createTextOutput('OK-GET').setMimeType(ContentService.MimeType.TEXT);
    }
    return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
  } catch(err){
    return ContentService.createTextOutput('ERR:'+err).setMimeType(ContentService.MimeType.TEXT);
  }
}
