$ErrorActionPreference="Stop"
New-Item -ItemType Directory -Force -Path "./assets/tesseract" | Out-Null
New-Item -ItemType Directory -Force -Path "./assets/tessdata"   | Out-Null
Invoke-WebRequest "https://unpkg.com/tesseract.js@5.1.1/dist/tesseract.min.js" -OutFile "./assets/tesseract/tesseract.min.js" -UseBasicParsing
Invoke-WebRequest "https://unpkg.com/tesseract.js@5.1.1/dist/worker.min.js"     -OutFile "./assets/tesseract/worker.min.js"     -UseBasicParsing
Invoke-WebRequest "https://unpkg.com/tesseract.js-core@5.1.1/tesseract-core.wasm.js" -OutFile "./assets/tesseract/tesseract-core.wasm.js" -UseBasicParsing
Invoke-WebRequest "https://raw.githubusercontent.com/tesseract-ocr/tessdata_best/4.0.0/eng.traineddata" -OutFile "./assets/tessdata/eng.traineddata" -UseBasicParsing
Write-Host "Done. Commit these files to GitHub to enable full offline OCR."
