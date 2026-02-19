# CLAUDE.md

## Project Overview

Garden-Viz is a client-side web application that brings landscape design plans to life. Users upload a landscape plan (PDF or image), the app parses the legend via OCR, scans the drawing for plant locations by color, and lets users annotate each plant with detailed info (name, type, size, bloom season, etc.) with photos fetched from Wikipedia.

## Repository Structure

```
Garden-Viz/
├── CLAUDE.md            # AI assistant guide (this file)
├── index.html           # Single-page app shell, UI layout, CDN script tags
├── style.css            # All styles; uses CSS custom properties for theming
├── app.js               # Main entry point — file upload, canvas, markers, modals, storage
├── color-scanner.js     # Color distance, blob detection, pattern matching on canvas pixels
├── legend-parser.js     # Tesseract.js OCR pipeline to extract plant names from legend
├── plant-database.js    # Hand-curated 48-plant database; fuzzy lookup; Wikipedia URLs
├── image-fetcher.js     # Wikipedia & Wikimedia Commons API calls for plant photos
└── pdf-parser.js        # PDF.js wrapper — renders PDF page to canvas/image
```

## Tech Stack

- **Vanilla JavaScript** (no framework, no build step)
- **HTML5 Canvas API** for image rendering, zoom/pan, pixel-level color scanning
- **Tesseract.js v5** (CDN) — client-side OCR for legend text extraction
- **PDF.js v4.0.379** (CDN) — client-side PDF rendering
- **Wikipedia / Wikimedia Commons REST APIs** — plant photo fetching (no auth required)
- **localStorage** — all persistence; cache versioned at `v2` to invalidate stale data

## Development Setup

No build tools required. Serve the files via any static HTTP server:

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .

# Or just open index.html directly in a browser (some CORS restrictions may apply)
```

## Build / Test / Lint Commands

None configured. There is no package.json, no bundler, no test framework, and no linter. The app runs directly in the browser from source files.

## Key Architecture

### Module Pattern
Each file exports a single global object using the IIFE pattern (no ES6 modules):

```js
const ColorScanner = (function() {
  // private state
  return { publicMethod };
})();
```

Globals in load order: `PdfParser` → `ImageFetcher` → `PlantDatabase` → `ColorScanner` → `LegendParser` → app code in `app.js`.

### Data Flow

1. User uploads PNG/JPG/PDF → rendered to `<canvas>` via Canvas API or PDF.js
2. (Optional) Legend parsed: user uploads/crops legend image → Tesseract.js OCR → color swatches paired with plant names
3. Color scanning: `ColorScanner` samples canvas pixels using Euclidean RGB distance and BFS blob detection to locate plant regions
4. User clicks on canvas → marker placed at coordinates, associated with plant name
5. Plant details loaded: `PlantDatabase` fuzzy-matches name → `ImageFetcher` pulls Wikipedia photos
6. Marker data (coordinates, plant info) persisted to localStorage

### Canvas Transform State
Zoom and pan are tracked as `{ scale, offsetX, offsetY }`. All mouse coordinates must be converted from screen space to image space before use.

### Legend Parser Pipeline
1. Detect color swatches (rectangular colored regions along left edge of legend)
2. Run Tesseract.js OCR on legend image with progress callback
3. Associate OCR words with nearest swatch by column proximity
4. Fall back to row-based parsing if no swatches detected
5. Filter low-confidence results and clean up plant name strings

### Plant Database
`plant-database.js` contains 48 hand-curated entries. Each entry shape:
```js
{
  commonName, botanicalName, type,      // e.g. "Evergreen Shrub"
  height, width,                         // e.g. "3-4 ft"
  bloomSeason, flowerColor,
  sunRequirement, waterRequirement,
  notes, photoUrls                       // Wikipedia image URLs
}
```
`PlantDatabase.findPlant(name)` does case-insensitive fuzzy matching.

### Image Fetcher
Queries `en.wikipedia.org/api/rest_v1/page/summary/{plant}` and the Wikimedia Commons API. Results cached in localStorage by plant name to avoid repeat fetches.

## Conventions

- **Branches**: prefix with `claude/` or `feature/`
- **Commits**: clear, descriptive imperative messages (e.g. "Fix multi-column legend parsing")
- **No framework additions**: keep the vanilla JS / no-build-step approach unless there is strong justification
- **CSS variables**: all theme colors defined as `--var` on `:root` in `style.css`; don't hardcode colors elsewhere
- **localStorage keys**: always include a version suffix (e.g. `gardenData_v2`) so stale cached data can be purged
- **Canvas pixel access**: use `ctx.getImageData` sparingly; cache results where possible since it is slow on large images

## Key Files by Concern

| Concern | File |
|---|---|
| File upload & canvas rendering | `app.js` (top section) |
| Zoom / pan logic | `app.js` (`handleWheel`, `handleMouseMove`) |
| Marker placement & editing | `app.js` (`placeMarker`, `openMarkerModal`) |
| Color region scanning | `color-scanner.js` (`scanForPlant`, `bfsBlob`) |
| OCR legend extraction | `legend-parser.js` (`parseLegend`) |
| Plant info lookup | `plant-database.js` (`findPlant`) |
| Remote image loading | `image-fetcher.js` (`fetchPlantImages`) |
| PDF rendering | `pdf-parser.js` (`renderPage`) |

## Known Limitations / Areas for Improvement

- No automated tests
- Plant database is limited to 48 species; unrecognized plants require manual entry
- OCR accuracy depends on legend image quality and font clarity
- Color scanning struggles with similar hues at low tolerance values
- No server-side component; all processing is in the browser (can be slow for large PDFs)
- localStorage has a ~5 MB cap; very large cached datasets may hit this limit
