/**
 * Color and pattern-based blob detection for landscape plan images.
 * Scans an image for regions matching a target color AND pattern.
 */
const ColorScanner = (() => {

  /**
   * Compute Euclidean distance between two RGB colors.
   */
  function colorDist(r1, g1, b1, r2, g2, b2) {
    const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  /**
   * Sample the average color in a small region around (x, y) on the canvas.
   * Returns [r, g, b].
   */
  function sampleColor(ctx, x, y, radius) {
    radius = radius || 3;
    const x0 = Math.max(0, Math.floor(x) - radius);
    const y0 = Math.max(0, Math.floor(y) - radius);
    const w = Math.min(ctx.canvas.width - x0, radius * 2 + 1);
    const h = Math.min(ctx.canvas.height - y0, radius * 2 + 1);
    const data = ctx.getImageData(x0, y0, w, h).data;
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) continue;
      if (data[i] < 15 && data[i + 1] < 15 && data[i + 2] < 15) continue;
      rSum += data[i];
      gSum += data[i + 1];
      bSum += data[i + 2];
      count++;
    }
    if (count === 0) {
      const cd = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
      return [cd[0], cd[1], cd[2]];
    }
    return [Math.round(rSum / count), Math.round(gSum / count), Math.round(bSum / count)];
  }

  /**
   * Capture a pattern template from a region around (x, y).
   * Returns a small canvas with the template and its grayscale data.
   * @param {CanvasRenderingContext2D} ctx - Source canvas context
   * @param {number} x - Center x coordinate
   * @param {number} y - Center y coordinate
   * @param {number} size - Template size (will be size x size pixels)
   * @returns {{canvas: HTMLCanvasElement, grayData: Float32Array, width: number, height: number}}
   */
  function captureTemplate(ctx, x, y, size) {
    size = size || 32;
    const halfSize = Math.floor(size / 2);
    const x0 = Math.max(0, Math.floor(x) - halfSize);
    const y0 = Math.max(0, Math.floor(y) - halfSize);
    const x1 = Math.min(ctx.canvas.width, x0 + size);
    const y1 = Math.min(ctx.canvas.height, y0 + size);
    const w = x1 - x0;
    const h = y1 - y0;

    // Create template canvas
    const templateCanvas = document.createElement('canvas');
    templateCanvas.width = w;
    templateCanvas.height = h;
    const tCtx = templateCanvas.getContext('2d');
    tCtx.drawImage(ctx.canvas, x0, y0, w, h, 0, 0, w, h);

    // Convert to grayscale for pattern matching
    const imgData = tCtx.getImageData(0, 0, w, h);
    const grayData = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const off = i * 4;
      // Luminance formula
      grayData[i] = 0.299 * imgData.data[off] + 0.587 * imgData.data[off + 1] + 0.114 * imgData.data[off + 2];
    }

    return { canvas: templateCanvas, grayData, width: w, height: h };
  }

  /**
   * Compute grayscale data from ImageData for a region.
   * @param {ImageData} imageData - Full image data
   * @param {number} x0 - Left coordinate
   * @param {number} y0 - Top coordinate
   * @param {number} w - Width
   * @param {number} h - Height
   * @returns {Float32Array}
   */
  function extractGrayRegion(imageData, x0, y0, w, h) {
    const imgW = imageData.width;
    const data = imageData.data;
    const gray = new Float32Array(w * h);
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const srcIdx = ((y0 + dy) * imgW + (x0 + dx)) * 4;
        gray[dy * w + dx] = 0.299 * data[srcIdx] + 0.587 * data[srcIdx + 1] + 0.114 * data[srcIdx + 2];
      }
    }
    return gray;
  }

  /**
   * Compute normalized cross-correlation between template and candidate region.
   * Returns a value between -1 and 1, where 1 is a perfect match.
   * @param {Float32Array} template - Template grayscale data
   * @param {Float32Array} candidate - Candidate region grayscale data
   * @returns {number} NCC score
   */
  function computeNCC(template, candidate) {
    if (template.length !== candidate.length) return 0;
    const n = template.length;

    // Compute means
    let tMean = 0, cMean = 0;
    for (let i = 0; i < n; i++) {
      tMean += template[i];
      cMean += candidate[i];
    }
    tMean /= n;
    cMean /= n;

    // Compute NCC
    let num = 0, tDenom = 0, cDenom = 0;
    for (let i = 0; i < n; i++) {
      const tDiff = template[i] - tMean;
      const cDiff = candidate[i] - cMean;
      num += tDiff * cDiff;
      tDenom += tDiff * tDiff;
      cDenom += cDiff * cDiff;
    }

    const denom = Math.sqrt(tDenom * cDenom);
    if (denom < 0.0001) return 0;
    return num / denom;
  }

  /**
   * Scan the full image for blobs matching the target color and optionally a pattern template.
   * Uses connected-component labeling + optional pattern verification.
   *
   * @param {ImageData} imageData - Full image data from getImageData
   * @param {number[]} targetRGB - [r, g, b] target color
   * @param {number} tolerance - Color distance threshold (default 40)
   * @param {number} minBlobSize - Minimum pixels for a blob (default 30)
   * @param {function} onProgress - Progress callback(percent)
   * @param {Object} template - Optional pattern template from captureTemplate()
   * @param {number} patternThreshold - Minimum NCC score to accept (default 0.4)
   * @returns {Promise<Array<{x: number, y: number, size: number, color: number[], patternScore: number}>>}
   */
  function scan(imageData, targetRGB, tolerance, minBlobSize, onProgress, template, patternThreshold) {
    tolerance = tolerance || 40;
    minBlobSize = minBlobSize || 30;
    patternThreshold = patternThreshold || 0.4;

    const w = imageData.width;
    const h = imageData.height;
    const data = imageData.data;
    const [tr, tg, tb] = targetRGB;

    return new Promise((resolve) => {
      // Step 1: Build binary mask
      const mask = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) {
        const off = i * 4;
        const r = data[off], g = data[off + 1], b = data[off + 2], a = data[off + 3];
        if (a < 128) continue;
        if (colorDist(r, g, b, tr, tg, tb) < tolerance) {
          mask[i] = 1;
        }
      }

      // Step 2: Connected-component labeling (BFS)
      const visited = new Uint8Array(w * h);
      const blobs = [];

      function bfs(startIdx) {
        const queue = [startIdx];
        visited[startIdx] = 1;
        let sumX = 0, sumY = 0, count = 0;
        let rSum = 0, gSum = 0, bSum = 0;
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        let head = 0;

        while (head < queue.length) {
          const idx = queue[head++];
          const px = idx % w;
          const py = (idx - px) / w;
          sumX += px;
          sumY += py;
          count++;
          minX = Math.min(minX, px);
          maxX = Math.max(maxX, px);
          minY = Math.min(minY, py);
          maxY = Math.max(maxY, py);
          const off = idx * 4;
          rSum += data[off];
          gSum += data[off + 1];
          bSum += data[off + 2];

          const neighbors = [];
          if (px > 0) neighbors.push(idx - 1);
          if (px < w - 1) neighbors.push(idx + 1);
          if (py > 0) neighbors.push(idx - w);
          if (py < h - 1) neighbors.push(idx + w);

          for (const ni of neighbors) {
            if (!visited[ni] && mask[ni]) {
              visited[ni] = 1;
              queue.push(ni);
            }
          }
        }
        return {
          x: sumX / count,
          y: sumY / count,
          size: count,
          color: [Math.round(rSum / count), Math.round(gSum / count), Math.round(bSum / count)],
          bounds: { minX, maxX, minY, maxY }
        };
      }

      // Process in chunks to keep UI responsive
      let row = 0;
      function processChunk() {
        const endRow = Math.min(row + 200, h);
        for (let y = row; y < endRow; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            if (mask[idx] && !visited[idx]) {
              const blob = bfs(idx);
              if (blob.size >= minBlobSize) {
                blobs.push(blob);
              }
            }
          }
        }
        row = endRow;
        if (onProgress) onProgress(Math.round((row / h) * 80)); // 80% for blob detection
        if (row < h) {
          setTimeout(processChunk, 0);
        } else {
          // Step 3: Pattern matching (if template provided)
          if (template && template.grayData) {
            verifyPatterns();
          } else {
            // No pattern matching, assign default score
            blobs.forEach(b => b.patternScore = 1.0);
            resolve(blobs);
          }
        }
      }

      function verifyPatterns() {
        const verified = [];
        const tw = template.width;
        const th = template.height;
        let processed = 0;

        function verifyChunk() {
          const end = Math.min(processed + 50, blobs.length);
          for (let i = processed; i < end; i++) {
            const blob = blobs[i];
            // Extract region around blob centroid
            const cx = Math.round(blob.x);
            const cy = Math.round(blob.y);
            const x0 = Math.max(0, cx - Math.floor(tw / 2));
            const y0 = Math.max(0, cy - Math.floor(th / 2));
            const x1 = Math.min(w, x0 + tw);
            const y1 = Math.min(h, y0 + th);
            const rw = x1 - x0;
            const rh = y1 - y0;

            // If region is too small or different size, try to match anyway
            if (rw >= tw * 0.7 && rh >= th * 0.7) {
              // Resize candidate to match template if needed
              const candidateGray = extractGrayRegion(imageData, x0, y0, rw, rh);

              // If sizes match, compute NCC directly
              if (rw === tw && rh === th) {
                blob.patternScore = computeNCC(template.grayData, candidateGray);
              } else {
                // Simple approach: compare center portions that overlap
                blob.patternScore = computeNCCResized(template.grayData, tw, th, candidateGray, rw, rh);
              }
            } else {
              // Too small to match reliably, give moderate score
              blob.patternScore = 0.5;
            }

            if (blob.patternScore >= patternThreshold) {
              verified.push(blob);
            }
          }
          processed = end;
          if (onProgress) onProgress(80 + Math.round((processed / blobs.length) * 20));

          if (processed < blobs.length) {
            setTimeout(verifyChunk, 0);
          } else {
            resolve(verified);
          }
        }
        verifyChunk();
      }

      processChunk();
    });
  }

  /**
   * Compute NCC between regions of different sizes by comparing center overlap.
   */
  function computeNCCResized(templateGray, tw, th, candidateGray, cw, ch) {
    // Use the smaller dimensions
    const useW = Math.min(tw, cw);
    const useH = Math.min(th, ch);
    const n = useW * useH;
    if (n < 16) return 0.5; // Too small

    // Extract center portions
    const tOffX = Math.floor((tw - useW) / 2);
    const tOffY = Math.floor((th - useH) / 2);
    const cOffX = Math.floor((cw - useW) / 2);
    const cOffY = Math.floor((ch - useH) / 2);

    // Compute means
    let tMean = 0, cMean = 0;
    for (let dy = 0; dy < useH; dy++) {
      for (let dx = 0; dx < useW; dx++) {
        tMean += templateGray[(tOffY + dy) * tw + (tOffX + dx)];
        cMean += candidateGray[(cOffY + dy) * cw + (cOffX + dx)];
      }
    }
    tMean /= n;
    cMean /= n;

    // Compute NCC
    let num = 0, tDenom = 0, cDenom = 0;
    for (let dy = 0; dy < useH; dy++) {
      for (let dx = 0; dx < useW; dx++) {
        const tVal = templateGray[(tOffY + dy) * tw + (tOffX + dx)];
        const cVal = candidateGray[(cOffY + dy) * cw + (cOffX + dx)];
        const tDiff = tVal - tMean;
        const cDiff = cVal - cMean;
        num += tDiff * cDiff;
        tDenom += tDiff * tDiff;
        cDenom += cDiff * cDiff;
      }
    }

    const denom = Math.sqrt(tDenom * cDenom);
    if (denom < 0.0001) return 0.5;
    return num / denom;
  }

  /**
   * Get matching pixel count for a color at a given tolerance (for preview).
   */
  function countMatches(imageData, targetRGB, tolerance) {
    const data = imageData.data;
    const [tr, tg, tb] = targetRGB;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      if (colorDist(data[i], data[i + 1], data[i + 2], tr, tg, tb) < tolerance) {
        count++;
      }
    }
    return count;
  }

  /**
   * Draw a highlight overlay showing matching pixels.
   */
  function drawHighlight(sourceImageData, targetRGB, tolerance, overlayCtx, highlightColor) {
    const w = sourceImageData.width;
    const h = sourceImageData.height;
    const data = sourceImageData.data;
    const [tr, tg, tb] = targetRGB;
    const [hr, hg, hb] = highlightColor || [255, 255, 0];

    overlayCtx.canvas.width = w;
    overlayCtx.canvas.height = h;
    const overlay = overlayCtx.createImageData(w, h);
    const od = overlay.data;

    for (let i = 0; i < w * h; i++) {
      const off = i * 4;
      if (data[off + 3] < 128) continue;
      if (colorDist(data[off], data[off + 1], data[off + 2], tr, tg, tb) < tolerance) {
        od[off] = hr;
        od[off + 1] = hg;
        od[off + 2] = hb;
        od[off + 3] = 140;
      }
    }
    overlayCtx.putImageData(overlay, 0, 0);
  }

  return { sampleColor, captureTemplate, scan, countMatches, drawHighlight, computeNCC, extractGrayRegion };
})();
