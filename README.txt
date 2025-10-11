BorderHealth Guardian v1.4.5 — Production Bundle

สิ่งที่ได้:
- OCR MRZ ทำงานจริง (CDN/Local, auto fallback)
- คัดกรองด่วน: บันทึก, สรุป, Export CSV
- จัดการโรคเสี่ยง: เพิ่ม/แก้/ลบ/สวิตช์แจ้งเตือน
- หน้าแรก: โรคยอดนิยม (อัปเดตตามรายการ), ตัวเลขสรุป
- PWA ออฟไลน์ (Service Worker cache: bhg-v145-app-1)
- ปุ่ม "ตรวจไฟล์ OCR" แสดงผลถูกต้อง

วิธีใช้งาน:
1) อัปโหลดไฟล์ทั้งหมดขึ้น GitHub Pages (แทนของเดิม)
2) เปิดหน้าเว็บ → รีเฟรชแบบ Hard Reload (Ctrl+F5) ครั้งแรก
3) OCR: 
   - ถ้ายังไม่มีไฟล์ภาษาที่โลคัล ระบบจะใช้ CDN ให้อัตโนมัติ
   - ต้องการออฟไลน์: รัน fetch-ocr-assets.bat (Windows) หรือ fetch-ocr-assets.ps1 แล้ว commit ไฟล์ใน assets/

จบงานจริง — ถ้ามีคำขอเพิ่ม (เช่น PDF/ZIP รายวัน, PIN เข้ารหัสข้อมูล) แจ้งได้เลย
