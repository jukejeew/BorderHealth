# Mini First Report (MVP, PWA + IndexedDB + Google Sheets)

**ของฟรีทั้งหมด**: GitHub Pages (front), PWA (ออฟไลน์), Google Sheets + Apps Script (back)

## ใช้งานเร็ว
1) อัปโหลดโฟลเดอร์นี้ขึ้น GitHub (ตั้งเป็น GitHub Pages) หรือเปิดไฟล์ `index.html` ผ่านเซิร์ฟเวอร์ท้องถิ่น
2) ไปที่ Google Sheets → Extensions → Apps Script แล้ววางโค้ดด้านล่าง จากนั้น Deploy as **Web App**
3) เอา URL ที่ได้มาแทนที่ใน `app.js` ที่ตัวแปร `GAS_URL`
4) เปิดเว็บ → กดบันทึกข้อมูล (ออฟไลน์ก็ได้) → ออนไลน์แล้วข้อมูลจะถูกส่งเข้า Sheet อัตโนมัติ

### Apps Script (คัดลอกไปวาง)
```js
function doPost(e){ 
  const sh = SpreadsheetApp.getActive().getSheetByName('Data');
  const d = JSON.parse(e.postData.contents||'{}');
  sh.appendRow([new Date().toISOString(), d.name||'', d.passport||'', d.nation||'', d.flight||'', d.temp||'', (d.symptoms||[]).join('|'), d.note||'']);
  return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
}
```

> **หมายเหตุความเป็นส่วนตัว**: ใช้สำหรับเดโม่/ต้นแบบหรือข้อมูลที่ไม่อ่อนไหว ถ้าจะใช้จริงควรมีการยินยอม/เข้ารหัส/จำกัดสิทธิ์

## โครงไฟล์
- `index.html` — หน้าเดียว
- `styles.css` — สไตล์เรียบง่าย
- `app.js` — ลอจิกฟอร์ม + คิวส่ง/เช็กสถานะ
- `db.js` — ฟังก์ชัน IndexedDB (queue)
- `service-worker.js` — แคชไฟล์ เปิดออฟไลน์
- `manifest.json` — PWA
- `icons/` — ไอคอนแอป 192/512px

## ทดสอบ
- เปิดหน้าเว็บครั้งแรก (ออนไลน์) → กดติดตั้ง PWA ได้
- ปิดเน็ต → กรอกแบบฟอร์ม → บันทึก (จะเห็นค้างส่งเพิ่ม)
- เปิดเน็ต → ระบบจะส่งค้างเข้า Google Sheets เอง
