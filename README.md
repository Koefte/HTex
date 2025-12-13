# HTex → LaTeX transpiler

Convert `.htex` files to `.tex` using a minimal TypeScript CLI.

## Quick start (Windows PowerShell)
```powershell
npm install
npm run build
npm start examples/gauss.htex   # writes out/gauss.tex
```

### Dev mode
```powershell
npm run dev examples/gauss.htex
```

## Features
- Headings via `überschrift(...)`
- Paragraphs with inline math `mathe(...)`
- Equations, sums, fractions, plus
- Greek letters, subset/element, arrows, multiplication symbol
- Lists: lines starting with `-` become `itemize`
- Auto document wrapper (`article`, utf8, amsmath, amssymb)

## Output
- LaTeX files are written to `out/<name>.tex` matching the input basename.
