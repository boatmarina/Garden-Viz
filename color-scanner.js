/**
 * Color-based blob detection for landscape plan images.
 * Scans an image for regions matching a target color and returns centroids.
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
      // Skip near-white and near-black pixels (likely background or lines)
      if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) continue;
      if (data[i] < 15 && data[i + 1] < 15 && data[i + 2] < 15) continue;
      rSum += data[i];
      gSum += data[i + 1];
      bSum += data[i + 2];
      count++;
    }
    if (count === 0) {
      // Fallback: just use center pixel
      const cd = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
      return [cd[0], cd[1], cd[2]];
    }
    return [Math.round(rSum / count), Math.round(gSum / count), Math.round(bSum / count)];
  }

  /**
   * Scan the full image for blobs matching the target color.
   * Uses connected-component labeling.
   *
   * @param {ImageData} imageData - Full image data from getImageData
   * @param {number[]} targetRGB - [r, g, b] target color
   * @param {number} tolerance - Color distance threshold (default 40)
   * @param {number} minBlobSize - Minimum pixels for a blob (default 30)
   * @param {function} onProgress - Progress callback(percent)
   * @returns {Promise<Array<{x: number, y: number, size: number, color: number[]}>>} centroids
   */
  function scan(imageData, targetRGB, tolerance, minBlobSize, onProgress) {
    tolerance = tolerance || 40;
    minBlobSize = minBlobSize || 30;

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
        if (a < 128) continue; // Skip transparent
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
        let head = 0;

        while (head < queue.length) {
          const idx = queue[head++];
          const px = idx % w;
          const py = (idx - px) / w;
          sumX += px;
          sumY += py;
          count++;
          const off = idx * 4;
          rSum += data[off];
          gSum += data[off + 1];
          bSum += data[off + 2];

          // 4-connected neighbors
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
        return { x: sumX / count, y: sumY / count, size: count,
                 color: [Math.round(rSum / count), Math.round(gSum / count), Math.round(bSum / count)] };
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
        if (onProgress) onProgress(Math.round((row / h) * 100));
        if (row < h) {
          setTimeout(processChunk, 0);
        } else {
          resolve(blobs);
        }
      }
      processChunk();
    });
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

  return { sampleColor, scan, countMatches, drawHighlight };
})();
