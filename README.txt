BorderHealth Guardian v1.4.3 (Simple Upload)

วิธีแบบง่ายสุด:
1) อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ขึ้น GitHub Pages (แทนที่ของเดิม)
2) เปิดหน้าเว็บ → ไปที่แท็บ OCR → เลือกโหมด "CDN" → ถ่าย/เลือกรูป → กด OCR MRZ

อยากใช้ออฟไลน์ (ไม่มีเน็ตก็ใช้ได้):
- Windows: ดับเบิลคลิก  fetch-ocr-assets.bat
- หรือ PowerShell: รัน  .\fetch-ocr-assets.ps1
สคริปต์จะโหลดไฟล์ 4 ตัวไว้ใน assets/   (รวม ~20MB)
  assets/tesseract/tesseract.min.js
  assets/tesseract/worker.min.js
  assets/tesseract/tesseract-core.wasm.js
  assets/tessdata/eng.traineddata
เสร็จแล้ว commit ขึ้น GitHub → เปิดเว็บ กด "ตรวจไฟล์ OCR" ให้ขึ้นครบ ✅ → เลือกโหมด "Local assets"

อัปเดตหน้าแล้วไม่เปลี่ยน:
- เปิด sw.js แล้วเปลี่ยน CACHE เป็นชื่อใหม่ (เช่น bhg-v144-app-1) จากนั้นรีเฟรชแบบ Hard Reload
