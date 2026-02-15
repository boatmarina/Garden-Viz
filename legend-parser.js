/**
 * Legend image parser.
 * Detects color swatches across the entire image (supporting multi-column layouts),
 * and uses Tesseract.js OCR to read plant names.
 */
const LegendParser = (() => {

  /**
   * Parse a legend image and return color-to-name mappings.
   * Supports multi-column legends by detecting swatches anywhere in the image.
   * @param {HTMLImageElement|HTMLCanvasElement} imageSource
   * @param {function} onProgress - ({status, progress, message})
   * @returns {Promise<Array<{color: number[], name: string, confidence: number, templateDataUrl: string, templateWidth: number, templateHeight: number, templateGrayData: number[]}>>}
   */
  async function parse(imageSource, onProgress) {
    const canvas = renderToCanvas(imageSource);
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (onProgress) onProgress({ status: 'segmenting', progress: 0, message: 'Detecting color swatches...' });

    // 1. Detect all swatches across the entire image
    const swatches = detectSwatches(imgData);

    // Debug: Log detected swatches
    console.log(`[LegendParser] Detected ${swatches.length} swatches:`);
    swatches.forEach((s, i) => {
      const w = s.bounds.maxX - s.bounds.minX;
      const h = s.bounds.maxY - s.bounds.minY;
      console.log(`  [${i}] color: rgb(${s.color.join(',')}), size: ${w}x${h}, pos: (${s.bounds.minX}, ${s.bounds.minY})`);
    });

    if (swatches.length === 0) {
      // Fallback to row-based approach if no swatches detected
      console.log('[LegendParser] No swatches found, falling back to row-based parsing');
      return await parseWithRows(canvas, imgData, onProgress);
    }

    // 2. Run OCR on the full legend image
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
      return swatches.map(swatch => ({
        color: swatch.color,
        name: '',
        confidence: 0,
        bounds: swatch.bounds
      }));
    }

    // 3. Associate each swatch with text to its right using exclusive assignment
    //    Each word goes to only its nearest swatch to prevent fragments
    const entries = [];
    const words = ocrResult.data.words || [];

    // Build a map of which swatches each word could belong to, with distances
    const wordCandidates = new Map(); // word index -> [{swatchIdx, distance}]

    for (let si = 0; si < swatches.length; si++) {
      const swatch = swatches[si];
      const swatchCenterY = (swatch.bounds.minY + swatch.bounds.maxY) / 2;
      const swatchHeight = swatch.bounds.maxY - swatch.bounds.minY;
      const swatchRight = swatch.bounds.maxX;

      for (let wi = 0; wi < words.length; wi++) {
        const w = words[wi];
        const wordCenterY = (w.bbox.y0 + w.bbox.y1) / 2;
        const wordLeft = w.bbox.x0;

        // Vertical alignment: word center within swatch's vertical range (with padding)
        const verticalPadding = swatchHeight * 0.75;
        const verticallyAligned = wordCenterY >= swatch.bounds.minY - verticalPadding &&
                                   wordCenterY <= swatch.bounds.maxY + verticalPadding;

        // Horizontal position: word starts after swatch ends (with small tolerance)
        // and is not too far away (max ~40% of image width)
        const maxTextDistance = imgData.width * 0.4;
        const horizontallyValid = wordLeft >= swatchRight - 5 &&
                                   wordLeft <= swatchRight + maxTextDistance;

        if (verticallyAligned && horizontallyValid) {
          // Compute distance from word to swatch (prioritize horizontal proximity)
          const hDist = Math.max(0, wordLeft - swatchRight);
          const vDist = Math.abs(wordCenterY - swatchCenterY);
          const dist = Math.sqrt(hDist * hDist + vDist * vDist);

          if (!wordCandidates.has(wi)) {
            wordCandidates.set(wi, []);
          }
          wordCandidates.get(wi).push({ swatchIdx: si, distance: dist });
        }
      }
    }

    // Assign each word exclusively to its nearest swatch
    const swatchAssignedWords = new Map(); // swatch index -> [word objects]
    for (const [wi, candidates] of wordCandidates) {
      candidates.sort((a, b) => a.distance - b.distance);
      const closestSwatchIdx = candidates[0].swatchIdx;

      if (!swatchAssignedWords.has(closestSwatchIdx)) {
        swatchAssignedWords.set(closestSwatchIdx, []);
      }
      swatchAssignedWords.get(closestSwatchIdx).push(words[wi]);
    }

    // Build entries from exclusively assigned words
    for (let si = 0; si < swatches.length; si++) {
      const swatch = swatches[si];
      const assignedWords = swatchAssignedWords.get(si) || [];

      if (assignedWords.length === 0) continue;

      const swatchHeight = swatch.bounds.maxY - swatch.bounds.minY;

      // Sort by vertical position first, then horizontal
      assignedWords.sort((a, b) => {
        const aY = (a.bbox.y0 + a.bbox.y1) / 2;
        const bY = (b.bbox.y0 + b.bbox.y1) / 2;
        if (Math.abs(aY - bY) > swatchHeight * 0.3) return aY - bY;
        return a.bbox.x0 - b.bbox.x0;
      });

      // Combine all assigned words into the plant name
      let name = assignedWords.map(w => w.text).join(' ').trim();
      name = cleanOcrText(name);

      const avgConfidence = assignedWords.reduce((s, w) => s + w.confidence, 0) / assignedWords.length;

      // Skip entries with invalid names (fragments, too short, etc.)
      if (!isValidPlantName(name)) {
        continue;
      }

      // Extract template from swatch region
      const template = extractSwatchTemplateFromBounds(canvas, swatch.bounds);

      const entry = {
        color: swatch.color,
        name: name,
        confidence: Math.round(avgConfidence),
        bounds: swatch.bounds
      };

      if (template) {
        entry.templateDataUrl = template.dataUrl;
        entry.templateWidth = template.width;
        entry.templateHeight = template.height;
        entry.templateGrayData = template.grayData;
      }

      entries.push(entry);
    }

    // Debug: Log final entries
    console.log(`[LegendParser] Final entries (${entries.length}):`);
    entries.forEach((e, i) => {
      console.log(`  [${i}] "${e.name}" - rgb(${e.color.join(',')})`);
    });

    if (onProgress) onProgress({ status: 'done', progress: 100, message: 'Done!' });
    return entries;
  }

  /**
   * Detect colored rectangular regions (swatches) across the entire image.
   * Uses connected-component labeling to find distinct colored regions.
   */
  function detectSwatches(imgData) {
    const { width, height, data } = imgData;

    // Create a mask of "colored" pixels (not white, not black, not gray)
    const colorMask = new Uint8Array(width * height);
    const colorValues = []; // Store RGB for each pixel

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const off = idx * 4;
        const r = data[off], g = data[off + 1], b = data[off + 2];

        // Check if pixel is "colored" (not white/black/gray)
        const brightness = (r + g + b) / 3;
        const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));

        // Consider it colored if:
        // 1. Not too bright (white) or too dark (black)
        // 2. Has some color saturation (not pure gray/black text)
        const isBrightEnough = brightness > 30 && brightness < 240;
        const hasColor = maxDiff > 10;

        if (isBrightEnough && hasColor) {
          colorMask[idx] = 1;
          colorValues[idx] = [r, g, b];
        }
      }
    }

    // Connected-component labeling with 8-connectivity using efficient BFS
    const labels = new Int32Array(width * height);
    const labelColors = new Map(); // label -> {pixels: [[r,g,b], ...], bounds: {minX, maxX, minY, maxY}}
    let nextLabel = 1;
    const dx = [-1, 1, 0, 0, -1, 1, -1, 1];
    const dy = [0, 0, -1, 1, -1, -1, 1, 1];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (colorMask[idx] === 0 || labels[idx] !== 0) continue;

        // BFS flood fill with index-based queue for O(1) dequeue
        const label = nextLabel++;
        labels[idx] = label;
        const queue = [[x, y]];
        let qIdx = 0;
        let minX = x, maxX = x, minY = y, maxY = y;
        const pixels = [colorValues[idx]];

        while (qIdx < queue.length) {
          const [cx, cy] = queue[qIdx++];

          // Check 8-connectivity neighbors
          for (let d = 0; d < 8; d++) {
            const nx = cx + dx[d];
            const ny = cy + dy[d];

            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

            const nIdx = ny * width + nx;
            if (colorMask[nIdx] === 0 || labels[nIdx] !== 0) continue;

            // Label immediately to prevent re-adding to queue
            labels[nIdx] = label;
            pixels.push(colorValues[nIdx]);
            minX = Math.min(minX, nx);
            maxX = Math.max(maxX, nx);
            minY = Math.min(minY, ny);
            maxY = Math.max(maxY, ny);

            queue.push([nx, ny]);
          }
        }

        labelColors.set(label, { pixels, bounds: { minX, maxX, minY, maxY } });
      }
    }

    // Filter to regions that look like swatches
    const swatches = [];
    const minSwatchSize = 10; // Minimum dimension
    const maxSwatchSize = Math.min(width, height) * 0.15; // Max 15% of image dimension
    const minPixels = 50; // Minimum number of pixels

    for (const [label, data] of labelColors) {
      const { pixels, bounds } = data;
      const w = bounds.maxX - bounds.minX;
      const h = bounds.maxY - bounds.minY;

      // Size filters
      if (w < minSwatchSize || h < minSwatchSize) continue;
      if (w > maxSwatchSize && h > maxSwatchSize) continue;
      if (pixels.length < minPixels) continue;

      // Aspect ratio filter: swatches are usually roughly square or slightly rectangular
      const aspectRatio = Math.max(w, h) / Math.min(w, h);
      if (aspectRatio > 5) continue; // Too elongated, probably not a swatch

      // Fill ratio: swatches should be mostly filled
      const area = w * h;
      const fillRatio = pixels.length / area;
      if (fillRatio < 0.3) continue; // Too sparse, probably not a solid swatch

      // Calculate average color
      let rSum = 0, gSum = 0, bSum = 0;
      for (const [r, g, b] of pixels) {
        rSum += r;
        gSum += g;
        bSum += b;
      }
      const n = pixels.length;
      const avgColor = [Math.round(rSum / n), Math.round(gSum / n), Math.round(bSum / n)];

      swatches.push({
        color: avgColor,
        bounds: bounds,
        pixelCount: pixels.length
      });
    }

    // Sort swatches by position: top to bottom, then left to right
    swatches.sort((a, b) => {
      const rowA = Math.floor(a.bounds.minY / 30);
      const rowB = Math.floor(b.bounds.minY / 30);
      if (rowA !== rowB) return rowA - rowB;
      return a.bounds.minX - b.bounds.minX;
    });

    // Merge swatches that are very close and have similar colors
    const merged = mergeCloseSwatches(swatches);

    // Filter by median size - real swatches in a legend are consistently sized
    return filterByMedianSize(merged);
  }

  /**
   * Filter swatches to remove extreme outliers by size.
   * Uses a very permissive filter to avoid removing valid swatches.
   */
  function filterByMedianSize(swatches) {
    if (swatches.length < 5) return swatches;

    const areas = swatches.map(s => {
      const w = s.bounds.maxX - s.bounds.minX;
      const h = s.bounds.maxY - s.bounds.minY;
      return w * h;
    });

    const sorted = [...areas].sort((a, b) => a - b);
    // Use 25th percentile as reference to avoid outliers skewing the filter
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];

    // Keep swatches that aren't extreme outliers (very permissive range)
    return swatches.filter((s, i) => {
      // Keep if area is at least 5% of q1 (not tiny) and at most 20x q3 (not huge)
      return areas[i] >= q1 * 0.05 && areas[i] <= q3 * 20;
    });
  }

  /**
   * Merge swatches that are close together and have similar colors.
   */
  function mergeCloseSwatches(swatches) {
    if (swatches.length === 0) return swatches;

    const merged = [];
    const used = new Set();

    for (let i = 0; i < swatches.length; i++) {
      if (used.has(i)) continue;

      let current = { ...swatches[i], bounds: { ...swatches[i].bounds } };
      used.add(i);

      // Look for nearby swatches with similar colors to merge
      for (let j = i + 1; j < swatches.length; j++) {
        if (used.has(j)) continue;

        const other = swatches[j];

        // Check if colors are similar
        const colorDist = Math.sqrt(
          Math.pow(current.color[0] - other.color[0], 2) +
          Math.pow(current.color[1] - other.color[1], 2) +
          Math.pow(current.color[2] - other.color[2], 2)
        );

        if (colorDist > 50) continue; // Colors too different

        // Check if bounds are close
        const gap = 10;
        const close = !(other.bounds.minX > current.bounds.maxX + gap ||
                       other.bounds.maxX < current.bounds.minX - gap ||
                       other.bounds.minY > current.bounds.maxY + gap ||
                       other.bounds.maxY < current.bounds.minY - gap);

        if (close) {
          // Merge bounds
          current.bounds.minX = Math.min(current.bounds.minX, other.bounds.minX);
          current.bounds.maxX = Math.max(current.bounds.maxX, other.bounds.maxX);
          current.bounds.minY = Math.min(current.bounds.minY, other.bounds.minY);
          current.bounds.maxY = Math.max(current.bounds.maxY, other.bounds.maxY);
          current.pixelCount += other.pixelCount;
          used.add(j);
        }
      }

      merged.push(current);
    }

    return merged;
  }

  /**
   * Group words into lines based on vertical position.
   */
  function groupWordsIntoLines(words, lineHeight) {
    if (words.length === 0) return [];

    const lines = [];
    let currentLine = [words[0]];
    let currentY = (words[0].bbox.y0 + words[0].bbox.y1) / 2;

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const wordY = (word.bbox.y0 + word.bbox.y1) / 2;

      // If word is on roughly the same line
      if (Math.abs(wordY - currentY) < lineHeight * 0.6) {
        currentLine.push(word);
      } else {
        lines.push(currentLine);
        currentLine = [word];
        currentY = wordY;
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Extract template from specific bounds.
   */
  function extractSwatchTemplateFromBounds(canvas, bounds) {
    const ctx = canvas.getContext('2d');
    const w = bounds.maxX - bounds.minX;
    const h = bounds.maxY - bounds.minY;

    if (w < 8 || h < 8) return null;

    const templateCanvas = document.createElement('canvas');
    templateCanvas.width = w;
    templateCanvas.height = h;
    const tCtx = templateCanvas.getContext('2d');
    tCtx.drawImage(canvas, bounds.minX, bounds.minY, w, h, 0, 0, w, h);

    const imgData = tCtx.getImageData(0, 0, w, h);
    const grayData = [];
    for (let i = 0; i < w * h; i++) {
      const off = i * 4;
      grayData.push(0.299 * imgData.data[off] + 0.587 * imgData.data[off + 1] + 0.114 * imgData.data[off + 2]);
    }

    return {
      dataUrl: templateCanvas.toDataURL(),
      width: w,
      height: h,
      grayData: grayData
    };
  }

  /**
   * Fallback: Parse using row-based approach for single-column legends.
   */
  async function parseWithRows(canvas, imgData, onProgress) {
    // 1. Find row regions
    const rows = segmentRows(imgData);
    if (rows.length === 0) {
      return [];
    }

    // 2. Extract swatch color and pattern template per row
    const swatches = rows.map(row => extractSwatchColor(imgData, row));
    const templates = rows.map(row => extractSwatchTemplate(canvas, row));

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

      wordsInRow.sort((a, b) => a.bbox.x0 - b.bbox.x0);

      const swatchEndX = Math.floor(imgData.width * 0.25);
      const textWords = wordsInRow.filter(w => w.bbox.x0 >= swatchEndX);

      let name = textWords.map(w => w.text).join(' ').trim();
      name = cleanOcrText(name);

      const avgConfidence = textWords.length > 0
        ? textWords.reduce((s, w) => s + w.confidence, 0) / textWords.length
        : 0;

      if (!name || name.length < 2) {
        continue;
      }

      const entry = {
        color: swatches[i],
        name: name,
        confidence: Math.round(avgConfidence),
        rowBounds: row
      };

      if (templates[i]) {
        entry.templateDataUrl = templates[i].dataUrl;
        entry.templateWidth = templates[i].width;
        entry.templateHeight = templates[i].height;
        entry.templateGrayData = templates[i].grayData;
      }

      entries.push(entry);
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
   * Extract a pattern template from the swatch area of a row.
   * Captures a 32x32 region centered on the swatch for pattern matching.
   * @param {HTMLCanvasElement} canvas - Source canvas
   * @param {Object} row - Row bounds {yStart, yEnd}
   * @returns {{dataUrl: string, width: number, height: number, grayData: number[]}|null}
   */
  function extractSwatchTemplate(canvas, row) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;

    // Swatch is in the left portion of the row
    const swatchWidth = Math.floor(width * 0.25);
    const rowHeight = row.yEnd - row.yStart;

    // Use a 32x32 template or smaller if the row is small
    const templateSize = Math.min(32, rowHeight, swatchWidth);
    if (templateSize < 8) return null;

    // Center the template in the swatch area
    const cx = Math.floor(swatchWidth / 2);
    const cy = Math.floor((row.yStart + row.yEnd) / 2);

    const halfSize = Math.floor(templateSize / 2);
    const x0 = Math.max(0, cx - halfSize);
    const y0 = Math.max(0, cy - halfSize);
    const x1 = Math.min(width, x0 + templateSize);
    const y1 = Math.min(canvas.height, y0 + templateSize);
    const w = x1 - x0;
    const h = y1 - y0;

    if (w < 8 || h < 8) return null;

    // Create template canvas
    const templateCanvas = document.createElement('canvas');
    templateCanvas.width = w;
    templateCanvas.height = h;
    const tCtx = templateCanvas.getContext('2d');
    tCtx.drawImage(canvas, x0, y0, w, h, 0, 0, w, h);

    // Convert to grayscale for pattern matching
    const imgData = tCtx.getImageData(0, 0, w, h);
    const grayData = [];
    for (let i = 0; i < w * h; i++) {
      const off = i * 4;
      // Luminance formula
      grayData.push(0.299 * imgData.data[off] + 0.587 * imgData.data[off + 1] + 0.114 * imgData.data[off + 2]);
    }

    return {
      dataUrl: templateCanvas.toDataURL(),
      width: w,
      height: h,
      grayData: grayData
    };
  }

  /**
   * Check if a name looks like a valid plant name, not a text fragment.
   */
  function isValidPlantName(name) {
    if (!name || name.length < 3) return false;

    // Name should start with a capital letter (proper plant name)
    // or be all caps (some legends use that style)
    const startsWithCapital = /^[A-Z]/.test(name);
    const isAllCaps = name === name.toUpperCase() && /[A-Z]/.test(name);

    if (!startsWithCapital && !isAllCaps) return false;

    // Reject names that contain OCR artifacts like brackets
    if (/[\[\]{}]/.test(name)) return false;

    // Reject names that are just common words/fragments
    const invalidPatterns = [
      /^form\b/i,           // "form - white"
      /^type\b/i,           // "type A"
      /^color\b/i,          // "color: red"
      /^size\b/i,           // "size: large"
      /^var\.?\b/i,         // "var." or "variety"
      /^cv\.?\b/i,          // "cv." (cultivar abbreviation alone)
      /^sp\.?\b/i,          // "sp." or "species" alone
      /^spp\.?\b/i,         // "spp." alone
      /^or\b/i,             // "or similar"
      /^and\b/i,            // "and white"
      /^with\b/i,           // "with yellow"
      /^worn\b/i,           // OCR artifact
      /^cond\b/i,           // OCR artifact "cond vy"
      /^soon\b/i,           // OCR artifact
      /^[-–—]/,             // Starts with dash
      /^\(/,                // Starts with parenthesis
      /^\d/,                // Starts with number
      /^[a-z]{1,3}\b/,      // Starts with 1-3 lowercase letters (likely fragment)
      /^[A-Z][a-z]?\s+[a-z]{1,2}\b/i,  // Pattern like "Is si" or "Oe" - garbled OCR
    ];

    for (const pattern of invalidPatterns) {
      if (pattern.test(name)) return false;
    }

    // Reject very short names that are likely fragments
    const words = name.split(/\s+/);
    if (words.length === 1 && words[0].length < 4) return false;

    // Reject if first word is too short (less than 3 chars) - likely OCR fragment
    if (words[0].length < 3) return false;

    // Reject if most words are very short (garbled OCR like "Is si")
    const shortWords = words.filter(w => w.length <= 2).length;
    if (shortWords > words.length * 0.5 && words.length > 1) return false;

    // Reject if it's mostly punctuation or numbers
    const alphaCount = (name.match(/[a-zA-Z]/g) || []).length;
    if (alphaCount < name.length * 0.5) return false;

    // Reject common non-plant words that might pass other checks
    const nonPlantWords = ['one', 'two', 'three', 'four', 'five', 'none', 'some', 'more', 'less'];
    const firstWordLower = words[0].toLowerCase();
    if (nonPlantWords.includes(firstWordLower)) return false;

    return true;
  }

  /**
   * Clean up common OCR artifacts in plant names.
   */
  function cleanOcrText(text) {
    if (!text) return '';

    let cleaned = text;

    // Fix common OCR mistakes first
    cleaned = cleaned
      .replace(/[|]/g, 'l')
      .replace(/[0O](?=[a-z])/g, 'o')
      .replace(/\b1(?=[a-z])/gi, 'l');

    // Remove container/pot sizes: #1, #2, #3, #5, #5t, #7, #10, #15, etc.
    cleaned = cleaned.replace(/#\d+[a-z]?\b/gi, '');

    // Remove gallon sizes: 1 gal, 3 gal, 5 gal, 1-gal, etc.
    cleaned = cleaned.replace(/\d+[\s-]?gal(lon)?s?\b/gi, '');

    // Remove inch/foot measurements: 18", 24", 6', 4-5', 12" o.c., etc.
    cleaned = cleaned.replace(/\d+[-–]\d+['"]\s*(o\.?c\.?)?/gi, '');
    cleaned = cleaned.replace(/\d+['"]\s*(o\.?c\.?)?/gi, '');
    cleaned = cleaned.replace(/\d+\s*ft\.?\b/gi, '');
    cleaned = cleaned.replace(/\d+\s*in\.?\b/gi, '');

    // Remove size specs like "ht", "height", "spread", "wide", "tall"
    cleaned = cleaned.replace(/\b\d+[-–]?\d*\s*(ht|height|spread|wide|tall|high)\b/gi, '');

    // Remove quantity indicators: 10x, x5, (5), [5], qty 5, etc.
    cleaned = cleaned.replace(/\bx\d+\b/gi, '');
    cleaned = cleaned.replace(/\b\d+x\b/gi, '');
    cleaned = cleaned.replace(/\(\d+\)/g, '');
    cleaned = cleaned.replace(/\[\d+\]/g, '');
    cleaned = cleaned.replace(/\bqty\.?\s*\d+/gi, '');

    // Remove plant category labels (these are section headers, not part of the name)
    const categoryLabels = [
      'perennials?', 'annuals?', 'groundcovers?', 'ground\\s*covers?',
      'shrubs?', 'trees?', 'grasses?', 'ornamental\\s*grasses?',
      'vines?', 'ferns?', 'succulents?', 'bulbs?', 'evergreens?',
      'deciduous', 'flowering', 'native', 'accent', 'specimen'
    ];
    const categoryRegex = new RegExp(`^(${categoryLabels.join('|')})\\s*[-–:]?\\s*`, 'gi');
    cleaned = cleaned.replace(categoryRegex, '');

    // Also remove if they appear at the end after a dash or colon
    const endCategoryRegex = new RegExp(`\\s*[-–:]\\s*(${categoryLabels.join('|')})\\s*$`, 'gi');
    cleaned = cleaned.replace(endCategoryRegex, '');

    // Remove common non-name suffixes
    cleaned = cleaned.replace(/\s*[-–]\s*(new|featured|native|recommended)\s*$/gi, '');

    // Remove standalone single letters that are NOT:
    // - followed by a period (botanical abbreviations like "b.", "f.", "m.")
    // - the letter 'x' (hybrid cross marker in "Camellia x williamsii")
    cleaned = cleaned.replace(/\b[a-wyz]\b(?!\.)/gi, '');
    cleaned = cleaned.replace(/\b\d{1,2}\b/g, '');

    // Remove parenthetical notes that aren't cultivar names
    // Keep things like 'Moonbeam' but remove things like '(sun)' or '(deer resistant)'
    cleaned = cleaned.replace(/\([^)]*\b(sun|shade|water|deer|rabbit|drought|native|zone)\b[^)]*\)/gi, '');

    // Remove bracket content (often OCR artifacts or notes)
    cleaned = cleaned.replace(/\[[^\]]*\]/g, '');
    cleaned = cleaned.replace(/\{[^}]*\}/g, '');

    // Clean up extra punctuation
    cleaned = cleaned.replace(/[-–:,;]+\s*$/, '');
    cleaned = cleaned.replace(/^[-–:,;]+\s*/, '');

    // Collapse multiple spaces and trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  }

  /**
   * Extract the core plant name for database lookup.
   * This is more aggressive than cleanOcrText - it tries to get just the essential name.
   */
  function extractCorePlantName(text) {
    if (!text) return '';

    // Start with the cleaned text
    let core = cleanOcrText(text);

    // Remove variety/cultivar names in quotes for lookup purposes
    // (Keep them for display, but look up the base plant)
    const withoutCultivar = core.replace(/['"][^'"]+['"]/g, '').trim();

    // If removing cultivar leaves us with something reasonable, use it for lookup
    if (withoutCultivar.length > 3) {
      core = withoutCultivar;
    }

    // Remove common descriptive prefixes that aren't the plant name
    core = core.replace(/^(dwarf|giant|miniature|variegated|golden|purple|red|blue|white|pink|yellow)\s+/gi, '');

    // Collapse spaces again
    core = core.replace(/\s+/g, ' ').trim();

    return core;
  }

  return { parse, segmentRows, extractSwatchColor, renderToCanvas, cleanOcrText, extractCorePlantName };
})();
