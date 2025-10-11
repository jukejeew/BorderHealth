
BorderHealth Guardian v1.4.2 — Full bundle
- แก้ปัญหา 'Tesseract is not defined' โดยเพิ่ม ensureTesseract(mode) ให้โหลดสคริปต์ตามโหมด
- OCR: CDN (tesseract.js 5.1.1) + Fallback เป็น Local assets อัตโนมัติ
- PWA: sw.js + manifest + icons
- โครงเมนูรวมหน้าเดียว: หน้าแรก / OCR MRZ / คัดกรองด่วน / จัดการโรคเสี่ยง / สถิติ

ไฟล์ OCR สำหรับใช้ออฟไลน์ (วางเอง):
  assets/tesseract/tesseract.min.js         (จาก tesseract.js 5.1.1)
  assets/tesseract/worker.min.js            (จาก tesseract.js 5.1.1)
  assets/tesseract/tesseract-core.wasm.js   (จาก tesseract.js-core 5.1.1)
  assets/tessdata/eng.traineddata           (จาก tessdata_best 4.0.0)

ทดสอบ:
  py -m http.server 8080
  http://localhost:8080 → ปุ่ม "ตรวจไฟล์ OCR" ให้ขึ้นครบ → โหมด Local assets ใช้งานได้

GitHub Pages:
  อัปโหลดทั้งหมด (รวมไฟล์ OCR) → เปิด Pages → โหลดรอบแรกแล้วใช้ออฟไลน์ได้
