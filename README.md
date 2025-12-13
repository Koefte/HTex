# TypeScript Hello World → PDF

This tiny project generates a PDF with the text "Hello, World!" using `pdfkit`.

## Quick Start (Windows PowerShell)

```powershell
# From the project root
npm install
npm run build
npm start
# The PDF will be at .\out\hello.pdf
```

### Dev run without build
```powershell
npm run dev
```

## Notes
- Output is written to `out/hello.pdf`.
- Change the message in `src/index.ts`.
