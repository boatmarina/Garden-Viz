/**
 * Legend image parser.
 * Segments a legend image into rows, extracts color swatches,
 * and uses Tesseract.js OCR to read plant names.
 */
const LegendParser = (() => {

  /**
   * Parse a legend image and return color-to-name mappings.
   * @param {HTMLImageElement|HTMLCanvasElement} imageSource
   * @param {function} onProgress - ({status, progress, message})
   * @returns {Promise<Array<{color: number[], name: string, confidence: number}>>}
   */
  async function parse(imageSource, onProgress) {
    const canvas = renderToCanvas(imageSource);
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (onProgress) onProgress({ status: 'segmenting', progress: 0, message: 'Analyzing legend layout...' });

    // 1. Find row regions
    const rows = segmentRows(imgData);
    if (rows.length === 0) {
      return [];
    }

    // 2. Extract swatch color per row
    const swatches = rows.map(row => extractSwatchColor(imgData, row));

    // 3. Run OCR on the full legend image
    if (onProgress) onProgress({ status: 'ocr', progress: 0, message: 'Starting text recognition...' });

    let ocrResult;
    try {
      ocrResult = await Tesseract.recognize(canvas, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text' && onProgress) {
            onProgress({
              status: 'ocr',
              progress: Math.round(m.progress * 100),
              message: `Recognizing text... ${Math.round(m.progress * 100)}%`
            });
          } else if (m.status && onProgress) {
            onProgress({ status: 'ocr', progress: 0, message: m.status + '...' });
          }
        }
      });
    } catch (err) {
      console.error('OCR failed:', err);
      // Return entries with just colors, no names
      return rows.map((row, i) => ({
        color: swatches[i],
        name: '',
        confidence: 0
      })).filter(e => e.color !== null);
    }

    // 4. Associate OCR words with row regions
    const entries = [];
    const words = ocrResult.data.words || [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!swatches[i]) continue;

      const wordsInRow = words.filter(w => {
        const wordCenterY = (w.bbox.y0 + w.bbox.y1) / 2;
        return wordCenterY >= row.yStart && wordCenterY <= row.yEnd;
      });

      // Sort words left to right
      wordsInRow.sort((a, b) => a.bbox.x0 - b.bbox.x0);

      // Filter out words that overlap with the swatch area (left portion)
      const swatchEndX = Math.floor(imgData.width * 0.25);
      const textWords = wordsInRow.filter(w => w.bbox.x0 >= swatchEndX);

      let name = textWords.map(w => w.text).join(' ').trim();
      // Clean up common OCR artifacts
      name = cleanOcrText(name);

      const avgConfidence = textWords.length > 0
        ? textWords.reduce((s, w) => s + w.confidence, 0) / textWords.length
        : 0;

      entries.push({
        color: swatches[i],
        name: name,
        confidence: Math.round(avgConfidence),
        rowBounds: row
      });
    }

    if (onProgress) onProgress({ status: 'done', progress: 100, message: 'Done!' });
    return entries;
  }

  /**
   * Render an image source to an offscreen canvas.
   */
  function renderToCanvas(source) {
    if (source instanceof HTMLCanvasElement) return source;
    const c = document.createElement('canvas');
    c.width = source.naturalWidth || source.width;
    c.height = source.naturalHeight || source.height;
    c.getContext('2d').drawImage(source, 0, 0);
    return c;
  }

  /**
   * Segment a legend image into horizontal row bands.
   * Finds rows of content separated by whitespace.
   */
  function segmentRows(imgData) {
    const { width, height, data } = imgData;

    // Compute per-row density of non-background pixels
    const density = new Float32Array(height);
    for (let y = 0; y < height; y++) {
      let count = 0;
      for (let x = 0; x < width; x++) {
        const off = (y * width + x) * 4;
        const r = data[off], g = data[off + 1], b = data[off + 2];
        const brightness = (r + g + b) / 3;
        if (brightness > 20 && brightness < 240) count++;
      }
      density[y] = count / width;
    }

    // Group into row bands
    const threshold = 0.05;
    const minRowHeight = 4;
    const rows = [];
    let inRow = false, yStart = 0;

    for (let y = 0; y < height; y++) {
      if (density[y] >= threshold && !inRow) {
        inRow = true;
        yStart = y;
      }
      if ((density[y] < threshold || y === height - 1) && inRow) {
        inRow = false;
        const rowHeight = y - yStart;
        if (rowHeight >= minRowHeight) {
          rows.push({ yStart, yEnd: y });
        }
      }
    }

    // Merge rows that are very close together (within 3px gap)
    const merged = [];
    for (const row of rows) {
      if (merged.length > 0 && row.yStart - merged[merged.length - 1].yEnd < 3) {
        merged[merged.length - 1].yEnd = row.yEnd;
      } else {
        merged.push({ ...row });
      }
    }

    return merged;
  }

  /**
   * Extract the dominant swatch color from the left portion of a row.
   */
  function extractSwatchColor(imgData, row) {
    const { width, data } = imgData;
    const searchWidth = Math.floor(width * 0.35);

    // Collect all colored pixels in the left portion
    const pixels = [];
    for (let y = row.yStart; y <= row.yEnd; y++) {
      for (let x = 0; x < searchWidth; x++) {
        const off = (y * width + x) * 4;
        const r = data[off], g = data[off + 1], b = data[off + 2];
        const brightness = (r + g + b) / 3;
        // Skip white, near-white, black, near-black
        if (brightness > 225 || brightness < 30) continue;
        pixels.push([r, g, b]);
      }
    }

    if (pixels.length < 5) return null;

    // Simple dominant color: average all colored pixels
    // (Could use k-means for patterns, but average works for solid swatches)
    let rSum = 0, gSum = 0, bSum = 0;
    for (const [r, g, b] of pixels) {
      rSum += r;
      gSum += g;
      bSum += b;
    }
    const n = pixels.length;
    return [Math.round(rSum / n), Math.round(gSum / n), Math.round(bSum / n)];
  }

  /**
   * Clean up common OCR artifacts in plant names.
   */
  function cleanOcrText(text) {
    if (!text) return '';
    return text
      // Remove leading/trailing punctuation and digits that are likely artifacts
      .replace(/^[\d\W]+/, '')
      .replace(/[\d\W]+$/, '')
      // Collapse multiple spaces
      .replace(/\s+/g, ' ')
      // Fix common OCR mistakes
      .replace(/[|]/g, 'l')
      .replace(/[0O](?=[a-z])/g, 'o')
      .trim();
  }

  return { parse, segmentRows, extractSwatchColor, renderToCanvas };
})();
