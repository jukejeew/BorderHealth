@echo off
echo [BHG] Downloading OCR assets (tesseract.js 5.1.1 / tesseract.js-core 5.1.1 / eng.traineddata)...
setlocal
if not exist assets\tesseract mkdir assets\tesseract
if not exist assets\tessdata  mkdir assets\tessdata
curl -L --fail "https://unpkg.com/tesseract.js@5.1.1/dist/tesseract.min.js" -o "assets\tesseract\tesseract.min.js"
curl -L --fail "https://unpkg.com/tesseract.js@5.1.1/dist/worker.min.js"     -o "assets\tesseract\worker.min.js"
curl -L --fail "https://unpkg.com/tesseract.js-core@5.1.1/tesseract-core.wasm.js" -o "assets\tesseract\tesseract-core.wasm.js"
curl -L --fail "https://raw.githubusercontent.com/tesseract-ocr/tessdata_best/4.0.0/eng.traineddata" -o "assets\tessdata\eng.traineddata"
echo Done. Commit these files to enable full offline OCR.
