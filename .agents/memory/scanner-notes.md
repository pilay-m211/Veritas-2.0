---
name: Scanner page notes
description: Gotchas for the Scanner page OCR, clipboard paste, and CDN script loading.
---

**Clipboard paste:** `window.addEventListener("paste", onPaste)` in a `useEffect(() => {...}, [])`. The handler reads `ClipboardData.items`, finds the first `image/*` item, calls `item.getAsFile()`, then passes to `handleFile()`. Works for screenshots pasted via Ctrl+V/Cmd+V.

**CDN scripts:** Tesseract.js v5 and xlsx v0.18.1 are loaded from CDN via `loadScript()`. Check `window.Tesseract` / `window.XLSX` before calling — the `loadScript` call is fire-and-forget so the scripts may not be ready immediately on mount.

**OCR preprocessing:** Image is scaled to max 1800px on longest side and contrast-boosted (gray → adjusted by factor 1.35) before passing to Tesseract. Preprocessed image is not shown to user — original is displayed in the left panel.

**Parse format:** Lines must match `YYYY-NNNNN score` or `YYYY-NNNNN num/den`. Parser strips all other lines silently.
