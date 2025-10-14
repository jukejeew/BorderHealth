// ===== WebApp.gs (v2.5 – Server: use client epoch, write Thai string) =====
const SHEET_ID   = '1-3kt0h1dkuV_1TUdRwnnc3zv17wiyX3CEjTLq1lPqAw';
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

/* --------------------- เพิ่ม: หัวคอลัมน์ภาษาไทย + สไตล์ --------------------- */
const HEADERS_TH = [
  'เวลา (ไทย)',            // A: TimeTH
  'ชื่อ',                  // B: Name
  'เลขพาสปอร์ต',           // C: Passport
  'สัญชาติ',               // D: Nation
  'เที่ยวบิน',             // E: Flight
  'อุณหภูมิ (°C)',         // F: Temp
  'อาการ',                 // G: Symptoms
  'บันทึก',                // H: Note
  'รหัสบันทึก',            // I: RecordID
  'เวลาจริง (Epoch ms)',   // J: TsEpoch
  'โซนเวลา',               // K: TZ
  'ออฟเซ็ต (นาที)',        // L: TZ_Offset
  'รุ่นแอป'                // M: AppVer
];

// วางหัวคอลัมน์ (idempotent) และจัดสไตล์สวยงาม
function ensureHeaderTH_(sh) {
  const nCols = HEADERS_TH.length;

  if (sh.getLastRow() === 0) {
    sh.getRange(1,1,1,nCols).setValues([HEADERS_TH]);
    styleHeader_(sh, nCols);
    return;
  }

  const firstRow = sh.getRange(1,1,1,nCols).getValues()[0];
  const isExact = firstRow.every((v,i) => String(v||'') === HEADERS_TH[i]);

  if (isExact) { styleHeader_(sh, nCols); return; }

  const isEmpty = firstRow.every(v => v === '' || v == null);
  if (!isEmpty) sh.insertRowBefore(1);
  sh.getRange(1,1,1,nCols).setValues([HEADERS_TH]);
  styleHeader_(sh, nCols);
}

// สไตล์หัว: โทนฟ้าอ่านง่าย, ตัวหนา, กึ่งกลาง, freeze แถว, auto resize, ฟอร์แมตเบื้องต้น
function styleHeader_(sh, nCols) {
  const header = sh.getRange(1,1,1,nCols);
  header
    .setBackground('#0ea5e9')   // ฟ้า (sky-500)
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  header.setBorder(false,false,true,false,false,false,'#0ea5e9',SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  sh.setRowHeights(1,1,28);
  sh.setFrozenRows(1);

  // ห่อบรรทัดให้คอลัมน์บันทึก
  sh.getRange(2, 8, Math.max(1, sh.getMaxRows()-1), 1)
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

  // ฟอร์แมตตัวเลขพื้นฐาน
  sh.getRange(2, 6, Math.max(1, sh.getMaxRows()-1), 1).setNumberFormat('0.0'); // F: Temp
  sh.getRange(2,10, Math.max(1, sh.getMaxRows()-1), 1).setNumberFormat('0');   // J: TsEpoch

  // จัดแนวคอลัมน์ข้อความที่เหมาะสม
  sh.getRange(2, 2, Math.max(1, sh.getMaxRows()-1), 1).setHorizontalAlignment('left'); // B
  sh.getRange(2, 3, Math.max(1, sh.getMaxRows()-1), 1).setHorizontalAlignment('left'); // C
  sh.getRange(2, 4, Math.max(1, sh.getMaxRows()-1), 1).setHorizontalAlignment('left'); // D
  sh.getRange(2, 5, Math.max(1, sh.getMaxRows()-1), 1).setHorizontalAlignment('left'); // E
  sh.getRange(2, 7, Math.max(1, sh.getMaxRows()-1), 1).setHorizontalAlignment('left'); // G
  sh.getRange(2, 8, Math.max(1, sh.getMaxRows()-1), 1).setHorizontalAlignment('left'); // H

  // ปรับความกว้าง
  sh.autoResizeColumns(1, nCols);
  sh.setColumnWidth(8, 340); // H: บันทึก
}
/* ------------------- จบส่วนที่เพิ่ม: หัวคอลัมน์ภาษาไทย ------------------- */

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
  try {
    // เรียกสร้าง/ตรวจหัวคอลัมน์ภาษาไทย (ปลอดภัย เรียกซ้ำได้)
    ensureHeaderTH_(sh);

    sh.appendRow(row);
  }
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
