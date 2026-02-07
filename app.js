(() => {
  // ---- State ----
  let image = null;
  let imageData = null;
  let scale = 1;
  let offsetX = 0, offsetY = 0;
  let markers = [];
  let colorMap = [];
  let selectedId = null;
  let pickingColor = false;
  let dragging = false;
  let dragStart = { x: 0, y: 0, ox: 0, oy: 0 };
  let nextMarkerId = 1;
  let nextColorId = 1;
  let pendingColor = null;
  let pendingTemplate = null; // Template captured when picking color
  let pendingPickCoords = null; // Coordinates where color was picked

  // Crop selection state
  let cropMode = false;
  let cropDragging = false;
  let cropRect = null; // {x, y, w, h} in image coords
  let cropStart = null;

  // Legend modal state
  let legendImageSource = null; // HTMLImageElement or HTMLCanvasElement ready for parsing
  let parsedEntries = []; // Results from LegendParser

  // ---- DOM Refs ----
  const uploadArea = document.getElementById('uploadArea');
  const uploadPrompt = document.getElementById('uploadPrompt');
  const fileInput = document.getElementById('fileInput');
  const viewerContainer = document.getElementById('viewerContainer');
  const canvasWrap = document.getElementById('canvasWrap');
  const canvas = document.getElementById('planCanvas');
  const ctx = canvas.getContext('2d');
  const highlightCanvas = document.getElementById('highlightCanvas');
  const highlightCtx = highlightCanvas.getContext('2d');
  const overlay = document.getElementById('markersOverlay');
  const cropSelection = document.getElementById('cropSelection');
  const panelPlaceholder = document.getElementById('panelPlaceholder');
  const panelContent = document.getElementById('panelContent');

  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnFitView = document.getElementById('btnFitView');
  const btnParseLegend = document.getElementById('btnParseLegend');
  const btnPickColor = document.getElementById('btnPickColor');
  const btnScanAll = document.getElementById('btnScanAll');
  const btnExport = document.getElementById('btnExport');
  const btnImport = document.getElementById('btnImport');
  const importInput = document.getElementById('importInput');
  const btnNewImage = document.getElementById('btnNewImage');

  const colorEntries = document.getElementById('colorEntries');
  const tolSlider = document.getElementById('tolSlider');
  const tolValue = document.getElementById('tolValue');

  const plantName = document.getElementById('plantName');
  const fieldCommon = document.getElementById('fieldCommon');
  const fieldBotanical = document.getElementById('fieldBotanical');
  const fieldType = document.getElementById('fieldType');
  const fieldSize = document.getElementById('fieldSize');
  const fieldBloom = document.getElementById('fieldBloom');
  const fieldSun = document.getElementById('fieldSun');
  const fieldWater = document.getElementById('fieldWater');
  const fieldNotes = document.getElementById('fieldNotes');
  const plantPhotos = document.getElementById('plantPhotos');
  const btnDeleteMarker = document.getElementById('btnDeleteMarker');
  const markerColorSwatch = document.getElementById('markerColorSwatch');

  // Color modal
  const colorModal = document.getElementById('colorModal');
  const modalSwatch = document.getElementById('modalSwatch');
  const modalColorText = document.getElementById('modalColorText');
  const modalPlantName = document.getElementById('modalPlantName');
  const modalCancel = document.getElementById('modalCancel');
  const modalConfirm = document.getElementById('modalConfirm');
  const plantSuggestions = document.getElementById('plantSuggestions');

  // Legend modal
  const legendModal = document.getElementById('legendModal');
  const legendTabs = legendModal.querySelectorAll('.legend-tab');
  const legendTabUpload = document.getElementById('legendTabUpload');
  const legendTabCrop = document.getElementById('legendTabCrop');
  const legendUploadZone = document.getElementById('legendUploadZone');
  const legendFileInput = document.getElementById('legendFileInput');
  const legendUploadPreview = document.getElementById('legendUploadPreview');
  const legendPreviewImg = document.getElementById('legendPreviewImg');
  const btnClearLegendUpload = document.getElementById('btnClearLegendUpload');
  const btnStartCrop = document.getElementById('btnStartCrop');
  const legendCropPreview = document.getElementById('legendCropPreview');
  const legendCropCanvas = document.getElementById('legendCropCanvas');
  const cropSizeText = document.getElementById('cropSizeText');
  const legendProgress = document.getElementById('legendProgress');
  const legendProgressBar = document.getElementById('legendProgressBar');
  const legendProgressText = document.getElementById('legendProgressText');
  const legendResults = document.getElementById('legendResults');
  const legendResultsList = document.getElementById('legendResultsList');
  const legendResultsCount = document.getElementById('legendResultsCount');
  const legendModalCancel = document.getElementById('legendModalCancel');
  const legendModalParse = document.getElementById('legendModalParse');
  const legendModalConfirm = document.getElementById('legendModalConfirm');

  const scanProgress = document.getElementById('scanProgress');
  const scanProgressBar = document.getElementById('scanProgressBar');
  const scanProgressText = document.getElementById('scanProgressText');

  // ---- Populate autocomplete ----
  getPlantNames().forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    plantSuggestions.appendChild(opt);
  });

  // ---- File Upload ----
  uploadPrompt.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => { if (e.target.files[0]) loadFile(e.target.files[0]); });
  uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadPrompt.classList.add('dragover'); });
  uploadArea.addEventListener('dragleave', () => uploadPrompt.classList.remove('dragover'));
  uploadArea.addEventListener('drop', e => {
    e.preventDefault();
    uploadPrompt.classList.remove('dragover');
    if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
  });

  function loadFile(file) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      image = img;
      markers = [];
      colorMap = [];
      selectedId = null;
      nextMarkerId = 1;
      nextColorId = 1;
      imageData = null;
      cropRect = null;
      uploadArea.style.display = 'none';
      viewerContainer.style.display = 'flex';
      drawImage();
      fitView();
      renderMarkers();
      renderColorEntries();
      clearHighlight();
      hideCropSelection();
      const saved = localStorage.getItem('gardenViz_' + file.name);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.colorMap) { colorMap = data.colorMap; nextColorId = Math.max(...colorMap.map(c => c.id), 0) + 1; }
          if (data.markers) { markers = data.markers; nextMarkerId = Math.max(...markers.map(m => m.id), 0) + 1; }
          renderMarkers();
          renderColorEntries();
        } catch (_) {}
      }
      canvas.dataset.filename = file.name;
    };
    img.src = url;
  }

  // ---- Canvas Drawing ----
  function drawImage() {
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
  }

  function getImageData() {
    if (!imageData) {
      imageData = ctx.getImageData(0, 0, image.width, image.height);
    }
    return imageData;
  }

  function fitView() {
    if (!image) return;
    const rect = canvasWrap.getBoundingClientRect();
    const sx = rect.width / image.width;
    const sy = rect.height / image.height;
    scale = Math.min(sx, sy) * 0.95;
    offsetX = (rect.width - image.width * scale) / 2;
    offsetY = (rect.height - image.height * scale) / 2;
    applyTransform();
  }

  function applyTransform() {
    const t = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    canvas.style.transform = t;
    highlightCanvas.style.transform = t;
    overlay.style.transform = t;
    if (cropRect) updateCropSelectionDisplay();
  }

  // ---- Pan & Zoom ----
  canvasWrap.addEventListener('mousedown', e => {
    if (pickingColor) return;
    if (e.target.classList.contains('marker')) return;

    // Crop mode: start drawing selection
    if (cropMode) {
      e.preventDefault();
      const rect = canvasWrap.getBoundingClientRect();
      const imgX = (e.clientX - rect.left - offsetX) / scale;
      const imgY = (e.clientY - rect.top - offsetY) / scale;
      cropStart = { x: imgX, y: imgY };
      cropDragging = true;
      return;
    }

    dragging = true;
    canvasWrap.classList.add('dragging');
    dragStart = { x: e.clientX, y: e.clientY, ox: offsetX, oy: offsetY };
  });

  window.addEventListener('mousemove', e => {
    if (cropDragging && cropStart) {
      const rect = canvasWrap.getBoundingClientRect();
      const imgX = (e.clientX - rect.left - offsetX) / scale;
      const imgY = (e.clientY - rect.top - offsetY) / scale;
      const x = Math.min(cropStart.x, imgX);
      const y = Math.min(cropStart.y, imgY);
      const w = Math.abs(imgX - cropStart.x);
      const h = Math.abs(imgY - cropStart.y);
      cropRect = { x, y, w, h };
      updateCropSelectionDisplay();
      return;
    }
    if (!dragging) return;
    offsetX = dragStart.ox + (e.clientX - dragStart.x);
    offsetY = dragStart.oy + (e.clientY - dragStart.y);
    applyTransform();
  });

  window.addEventListener('mouseup', () => {
    if (cropDragging) {
      cropDragging = false;
      if (cropRect && cropRect.w > 10 && cropRect.h > 10) {
        // Crop completed - extract the region
        finishCropSelection();
      }
      return;
    }
    dragging = false;
    canvasWrap.classList.remove('dragging');
  });

  canvasWrap.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = canvasWrap.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const prev = scale;
    scale = Math.max(0.05, Math.min(20, scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
    offsetX = mx - (mx - offsetX) * (scale / prev);
    offsetY = my - (my - offsetY) * (scale / prev);
    applyTransform();
  }, { passive: false });

  btnZoomIn.addEventListener('click', () => zoomCenter(1.3));
  btnZoomOut.addEventListener('click', () => zoomCenter(1 / 1.3));
  btnFitView.addEventListener('click', () => { fitView(); });
  btnNewImage.addEventListener('click', () => {
    viewerContainer.style.display = 'none';
    uploadArea.style.display = 'flex';
    fileInput.value = '';
    image = null;
    imageData = null;
    exitCropMode();
  });

  function zoomCenter(factor) {
    const rect = canvasWrap.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    const prev = scale;
    scale = Math.max(0.05, Math.min(20, scale * factor));
    offsetX = cx - (cx - offsetX) * (scale / prev);
    offsetY = cy - (cy - offsetY) * (scale / prev);
    applyTransform();
  }

  // ---- Crop Selection ----
  function updateCropSelectionDisplay() {
    if (!cropRect) return;
    cropSelection.style.display = 'block';
    cropSelection.style.left = (cropRect.x * scale + offsetX) + 'px';
    cropSelection.style.top = (cropRect.y * scale + offsetY) + 'px';
    cropSelection.style.width = (cropRect.w * scale) + 'px';
    cropSelection.style.height = (cropRect.h * scale) + 'px';
  }

  function hideCropSelection() {
    cropSelection.style.display = 'none';
    cropRect = null;
  }

  function enterCropMode() {
    cropMode = true;
    canvasWrap.classList.add('picking'); // crosshair cursor
    btnParseLegend.classList.add('active');
    hideCropSelection();
  }

  function exitCropMode() {
    cropMode = false;
    cropDragging = false;
    canvasWrap.classList.remove('picking');
    btnParseLegend.classList.remove('active');
    hideCropSelection();
  }

  function finishCropSelection() {
    // Extract cropped region from plan canvas
    const cx = Math.max(0, Math.round(cropRect.x));
    const cy = Math.max(0, Math.round(cropRect.y));
    const cw = Math.min(Math.round(cropRect.w), image.width - cx);
    const ch = Math.min(Math.round(cropRect.h), image.height - cy);

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cw;
    cropCanvas.height = ch;
    cropCanvas.getContext('2d').drawImage(canvas, cx, cy, cw, ch, 0, 0, cw, ch);

    legendImageSource = cropCanvas;
    exitCropMode();

    // Show the legend modal with the crop preview
    showLegendModal('crop');
    legendCropPreview.style.display = 'block';
    legendCropCanvas.width = cw;
    legendCropCanvas.height = ch;
    legendCropCanvas.getContext('2d').drawImage(cropCanvas, 0, 0);
    cropSizeText.textContent = `${cw} x ${ch} pixels`;
    legendModalParse.disabled = false;
  }

  // ---- Color Picking (manual) ----
  btnPickColor.addEventListener('click', () => {
    if (cropMode) exitCropMode();
    pickingColor = !pickingColor;
    btnPickColor.classList.toggle('active', pickingColor);
    canvasWrap.classList.toggle('picking', pickingColor);
  });

  canvasWrap.addEventListener('click', e => {
    if (!pickingColor) return;
    if (e.target.classList.contains('marker')) return;
    const rect = canvasWrap.getBoundingClientRect();
    const imgX = (e.clientX - rect.left - offsetX) / scale;
    const imgY = (e.clientY - rect.top - offsetY) / scale;
    if (imgX < 0 || imgY < 0 || imgX >= image.width || imgY >= image.height) return;

    const rgb = ColorScanner.sampleColor(ctx, imgX, imgY, 3);
    pendingColor = rgb;
    pendingPickCoords = { x: imgX, y: imgY };

    // Capture pattern template (32x32 region around click point)
    pendingTemplate = ColorScanner.captureTemplate(ctx, imgX, imgY, 32);

    modalSwatch.style.backgroundColor = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    modalColorText.textContent = `RGB(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    modalPlantName.value = '';
    colorModal.style.display = 'flex';
    modalPlantName.focus();

    // Show template preview in modal
    const templatePreview = document.getElementById('modalTemplatePreview');
    if (templatePreview && pendingTemplate) {
      templatePreview.innerHTML = '';
      const previewCanvas = pendingTemplate.canvas.cloneNode(true);
      previewCanvas.getContext('2d').drawImage(pendingTemplate.canvas, 0, 0);
      previewCanvas.style.width = '48px';
      previewCanvas.style.height = '48px';
      previewCanvas.style.imageRendering = 'pixelated';
      templatePreview.appendChild(previewCanvas);
      templatePreview.style.display = 'block';
    }

    const tol = parseInt(tolSlider.value);
    highlightCanvas.width = image.width;
    highlightCanvas.height = image.height;
    ColorScanner.drawHighlight(getImageData(), rgb, tol, highlightCtx, [255, 255, 0]);

    pickingColor = false;
    btnPickColor.classList.remove('active');
    canvasWrap.classList.remove('picking');
  });

  modalCancel.addEventListener('click', () => {
    colorModal.style.display = 'none';
    pendingColor = null;
    pendingTemplate = null;
    pendingPickCoords = null;
    clearHighlight();
  });

  modalConfirm.addEventListener('click', () => {
    const name = modalPlantName.value.trim();
    if (!name) { modalPlantName.focus(); return; }

    // Build the color entry with template data
    const entry = {
      id: nextColorId++,
      color: pendingColor,
      name: name,
      dbKey: name.toLowerCase(),
      count: 0
    };

    // Store template for pattern matching (canvas can't be serialized, so we store data URL)
    if (pendingTemplate) {
      entry.templateDataUrl = pendingTemplate.canvas.toDataURL();
      entry.templateWidth = pendingTemplate.width;
      entry.templateHeight = pendingTemplate.height;
      // Store grayData as array for pattern matching (will be recreated on load)
      entry.templateGrayData = Array.from(pendingTemplate.grayData);
    }

    colorMap.push(entry);
    colorModal.style.display = 'none';
    pendingColor = null;
    pendingTemplate = null;
    pendingPickCoords = null;
    clearHighlight();
    renderColorEntries();
    autoSave();
  });

  modalPlantName.addEventListener('keydown', e => {
    if (e.key === 'Enter') modalConfirm.click();
    if (e.key === 'Escape') modalCancel.click();
  });

  // ---- Legend Parse Modal ----
  btnParseLegend.addEventListener('click', () => {
    if (cropMode) { exitCropMode(); return; }
    showLegendModal('upload');
  });

  function showLegendModal(tab) {
    legendModal.style.display = 'flex';
    resetLegendModal();
    switchLegendTab(tab || 'upload');
    // If we already have a crop, show it
    if (tab === 'crop' && legendImageSource instanceof HTMLCanvasElement) {
      legendModalParse.disabled = false;
    }
  }

  function resetLegendModal() {
    legendProgress.style.display = 'none';
    legendResults.style.display = 'none';
    legendModalParse.style.display = 'inline-block';
    legendModalConfirm.style.display = 'none';
    legendModalParse.disabled = true;
    parsedEntries = [];
  }

  // Tab switching
  legendTabs.forEach(tab => {
    tab.addEventListener('click', () => switchLegendTab(tab.dataset.tab));
  });

  function switchLegendTab(tabName) {
    legendTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    legendTabUpload.style.display = tabName === 'upload' ? 'block' : 'none';
    legendTabCrop.style.display = tabName === 'crop' ? 'block' : 'none';
  }

  // Upload legend image
  legendUploadZone.addEventListener('click', () => legendFileInput.click());
  legendUploadZone.addEventListener('dragover', e => { e.preventDefault(); legendUploadZone.classList.add('dragover'); });
  legendUploadZone.addEventListener('dragleave', () => legendUploadZone.classList.remove('dragover'));
  legendUploadZone.addEventListener('drop', e => {
    e.preventDefault();
    legendUploadZone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) loadLegendFile(e.dataTransfer.files[0]);
  });
  legendFileInput.addEventListener('change', e => {
    if (e.target.files[0]) loadLegendFile(e.target.files[0]);
  });

  function loadLegendFile(file) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      legendImageSource = img;
      legendPreviewImg.src = url;
      legendUploadPreview.style.display = 'block';
      legendUploadZone.style.display = 'none';
      legendModalParse.disabled = false;
    };
    img.src = url;
  }

  btnClearLegendUpload.addEventListener('click', () => {
    legendImageSource = null;
    legendUploadPreview.style.display = 'none';
    legendUploadZone.style.display = 'block';
    legendFileInput.value = '';
    legendModalParse.disabled = true;
  });

  // Start crop from plan
  btnStartCrop.addEventListener('click', () => {
    legendModal.style.display = 'none';
    enterCropMode();
  });

  // Cancel legend modal
  legendModalCancel.addEventListener('click', () => {
    legendModal.style.display = 'none';
    legendImageSource = null;
    parsedEntries = [];
  });

  // Parse button
  legendModalParse.addEventListener('click', async () => {
    if (!legendImageSource) return;

    legendModalParse.disabled = true;
    legendProgress.style.display = 'block';
    legendResults.style.display = 'none';

    try {
      parsedEntries = await LegendParser.parse(legendImageSource, progress => {
        legendProgressText.textContent = progress.message || 'Processing...';
        const pct = progress.progress || 0;
        legendProgressBar.style.width = pct + '%';
      });
    } catch (err) {
      console.error('Legend parse error:', err);
      legendProgressText.textContent = 'Error: ' + err.message;
      legendModalParse.disabled = false;
      return;
    }

    legendProgress.style.display = 'none';

    if (parsedEntries.length === 0) {
      legendResults.style.display = 'block';
      legendResultsCount.textContent = '(0)';
      legendResultsList.innerHTML = '<p class="no-entries">No plant entries detected. Try adjusting the image or use manual color picking.</p>';
      legendModalParse.disabled = false;
      return;
    }

    // Show editable results
    legendResults.style.display = 'block';
    legendResultsCount.textContent = `(${parsedEntries.length})`;
    renderLegendResults();

    legendModalParse.style.display = 'none';
    legendModalConfirm.style.display = 'inline-block';
  });

  function renderLegendResults() {
    legendResultsList.innerHTML = '';
    parsedEntries.forEach((entry, i) => {
      const row = document.createElement('div');
      row.className = 'legend-result-row';
      if (entry.confidence < 60) row.classList.add('low-confidence');

      // Show template image if available, otherwise just color swatch
      let swatchEl;
      if (entry.templateDataUrl) {
        swatchEl = document.createElement('img');
        swatchEl.className = 'color-swatch-template';
        swatchEl.src = entry.templateDataUrl;
        swatchEl.title = 'Pattern template';
      } else {
        swatchEl = document.createElement('div');
        swatchEl.className = 'color-swatch';
        if (entry.color) {
          swatchEl.style.backgroundColor = `rgb(${entry.color[0]},${entry.color[1]},${entry.color[2]})`;
        }
      }

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.value = entry.name;
      nameInput.placeholder = 'Plant name';
      nameInput.setAttribute('list', 'plantSuggestions');
      nameInput.addEventListener('change', () => {
        parsedEntries[i].name = nameInput.value.trim();
      });

      const conf = document.createElement('span');
      conf.className = 'legend-result-confidence';
      conf.textContent = entry.confidence + '%';
      conf.title = 'OCR confidence';

      const removeBtn = document.createElement('button');
      removeBtn.className = 'legend-result-remove';
      removeBtn.textContent = '\u00d7';
      removeBtn.addEventListener('click', () => {
        parsedEntries.splice(i, 1);
        legendResultsCount.textContent = `(${parsedEntries.length})`;
        renderLegendResults();
      });

      row.appendChild(swatchEl);
      row.appendChild(nameInput);
      row.appendChild(conf);
      row.appendChild(removeBtn);
      legendResultsList.appendChild(row);
    });
  }

  // Confirm: add all parsed entries to colorMap
  legendModalConfirm.addEventListener('click', () => {
    const validEntries = parsedEntries.filter(e => e.name && e.color);
    validEntries.forEach(entry => {
      const colorEntry = {
        id: nextColorId++,
        color: entry.color,
        name: entry.name,
        dbKey: entry.name.toLowerCase(),
        count: 0
      };

      // Include pattern template if available from legend parsing
      if (entry.templateDataUrl) {
        colorEntry.templateDataUrl = entry.templateDataUrl;
        colorEntry.templateWidth = entry.templateWidth;
        colorEntry.templateHeight = entry.templateHeight;
        colorEntry.templateGrayData = entry.templateGrayData;
      }

      colorMap.push(colorEntry);
    });

    legendModal.style.display = 'none';
    legendImageSource = null;
    parsedEntries = [];
    renderColorEntries();
    autoSave();
  });

  // ---- Tolerance Slider ----
  tolSlider.addEventListener('input', () => {
    tolValue.textContent = tolSlider.value;
    if (pendingColor && colorModal.style.display === 'flex') {
      ColorScanner.drawHighlight(getImageData(), pendingColor, parseInt(tolSlider.value), highlightCtx, [255, 255, 0]);
    }
  });

  // ---- Color Legend Entries ----
  function renderColorEntries() {
    colorEntries.innerHTML = '';
    if (colorMap.length === 0) {
      colorEntries.innerHTML = '<p class="no-entries">No colors mapped yet.</p>';
      return;
    }
    colorMap.forEach(entry => {
      const el = document.createElement('div');
      el.className = 'color-entry';

      // Create swatch that shows template if available, otherwise just color
      const swatchHtml = entry.templateDataUrl
        ? `<img class="color-swatch-template" src="${entry.templateDataUrl}" title="Pattern template">`
        : `<div class="color-swatch" style="background:rgb(${entry.color[0]},${entry.color[1]},${entry.color[2]})"></div>`;

      el.innerHTML = `
        ${swatchHtml}
        <div class="color-entry-info">
          <span class="color-entry-name">${entry.name}</span>
          <span class="color-entry-count">${entry.count || 0} found${entry.templateDataUrl ? ' (pattern)' : ''}</span>
        </div>
        <button class="color-entry-scan" title="Scan for this color${entry.templateDataUrl ? ' and pattern' : ''}" data-id="${entry.id}">Scan</button>
        <button class="color-entry-remove" title="Remove" data-id="${entry.id}">&times;</button>
      `;
      el.addEventListener('mouseenter', () => {
        ColorScanner.drawHighlight(getImageData(), entry.color, parseInt(tolSlider.value), highlightCtx, [255, 255, 0]);
      });
      el.addEventListener('mouseleave', () => clearHighlight());
      colorEntries.appendChild(el);
    });

    colorEntries.querySelectorAll('.color-entry-scan').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        const entry = colorMap.find(c => c.id === id);
        if (entry) scanSingleColor(entry);
      });
    });
    colorEntries.querySelectorAll('.color-entry-remove').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        colorMap = colorMap.filter(c => c.id !== id);
        markers = markers.filter(m => m.colorId !== id);
        renderColorEntries();
        renderMarkers();
        autoSave();
      });
    });
  }

  function clearHighlight() {
    highlightCtx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
  }

  // ---- Scanning ----
  async function scanSingleColor(entry) {
    const tol = parseInt(tolSlider.value);
    const minBlob = 30;
    const patternThreshold = 0.35; // Minimum pattern match score

    scanProgress.style.display = 'flex';
    scanProgressText.textContent = `Scanning for ${entry.name}... 0%`;
    scanProgressBar.style.width = '0%';

    markers = markers.filter(m => m.colorId !== entry.id);

    // Reconstruct template object if we have template data
    let template = null;
    if (entry.templateGrayData && entry.templateWidth && entry.templateHeight) {
      template = {
        grayData: new Float32Array(entry.templateGrayData),
        width: entry.templateWidth,
        height: entry.templateHeight
      };
    }

    const blobs = await ColorScanner.scan(getImageData(), entry.color, tol, minBlob, pct => {
      scanProgressBar.style.width = pct + '%';
      const phase = template ? (pct < 80 ? 'color' : 'pattern') : 'color';
      scanProgressText.textContent = `Scanning for ${entry.name} (${phase})... ${pct}%`;
    }, template, patternThreshold);

    const dbEntry = lookupPlant(entry.name);
    blobs.forEach(blob => {
      markers.push({
        id: nextMarkerId++,
        x: blob.x,
        y: blob.y,
        blobSize: blob.size,
        colorId: entry.id,
        markerColor: entry.color,
        name: entry.name,
        common: dbEntry ? dbEntry.common : entry.name,
        botanical: dbEntry ? dbEntry.botanical : '',
        type: dbEntry ? dbEntry.type : '',
        size: dbEntry ? dbEntry.size : '',
        bloom: dbEntry ? dbEntry.bloom : '',
        sun: dbEntry ? dbEntry.sun : '',
        water: dbEntry ? dbEntry.water : '',
        notes: dbEntry ? dbEntry.notes : '',
        photos: dbEntry ? [...dbEntry.photos] : []
      });
    });

    entry.count = blobs.length;
    scanProgress.style.display = 'none';
    renderMarkers();
    renderColorEntries();
    autoSave();
  }

  btnScanAll.addEventListener('click', async () => {
    if (colorMap.length === 0) {
      alert('Add colors to the legend first using Parse Legend or Pick Color.');
      return;
    }
    for (const entry of colorMap) {
      await scanSingleColor(entry);
    }
  });

  // ---- Render Markers ----
  function renderMarkers() {
    overlay.innerHTML = '';
    markers.forEach(m => {
      const el = document.createElement('div');
      el.className = 'marker' + (m.id === selectedId ? ' selected' : '');
      el.style.left = m.x + 'px';
      el.style.top = m.y + 'px';
      if (m.markerColor) {
        el.style.backgroundColor = `rgb(${m.markerColor[0]},${m.markerColor[1]},${m.markerColor[2]})`;
      }
      el.dataset.id = m.id;
      const label = document.createElement('span');
      label.className = 'marker-label';
      label.textContent = m.common || m.name;
      el.appendChild(label);
      el.addEventListener('click', e => {
        e.stopPropagation();
        selectMarker(m.id);
      });
      overlay.appendChild(el);
    });
  }

  // ---- Selection & Detail Panel ----
  function selectMarker(id) {
    selectedId = id;
    const m = markers.find(m => m.id === id);
    if (!m) return;
    panelPlaceholder.style.display = 'none';
    panelContent.style.display = 'block';
    plantName.textContent = m.common || m.name;
    fieldCommon.value = m.common || '';
    fieldBotanical.value = m.botanical || '';
    fieldType.value = m.type || '';
    fieldSize.value = m.size || '';
    fieldBloom.value = m.bloom || '';
    fieldSun.value = m.sun || '';
    fieldWater.value = m.water || '';
    fieldNotes.value = m.notes || '';

    if (m.markerColor) {
      markerColorSwatch.style.display = 'block';
      markerColorSwatch.style.backgroundColor = `rgb(${m.markerColor[0]},${m.markerColor[1]},${m.markerColor[2]})`;
    } else {
      markerColorSwatch.style.display = 'none';
    }

    plantPhotos.innerHTML = '';
    (m.photos || []).forEach(url => {
      const img = document.createElement('img');
      img.src = url;
      img.alt = m.common || m.name;
      img.onerror = () => img.style.display = 'none';
      plantPhotos.appendChild(img);
    });

    renderMarkers();
  }

  [fieldCommon, fieldBotanical, fieldSize, fieldBloom, fieldNotes].forEach(el => {
    el.addEventListener('change', saveCurrentMarker);
  });
  [fieldType, fieldSun, fieldWater].forEach(el => {
    el.addEventListener('change', saveCurrentMarker);
  });

  function saveCurrentMarker() {
    const m = markers.find(m => m.id === selectedId);
    if (!m) return;
    m.common = fieldCommon.value;
    m.botanical = fieldBotanical.value;
    m.type = fieldType.value;
    m.size = fieldSize.value;
    m.bloom = fieldBloom.value;
    m.sun = fieldSun.value;
    m.water = fieldWater.value;
    m.notes = fieldNotes.value;
    renderMarkers();
    autoSave();
  }

  btnDeleteMarker.addEventListener('click', () => {
    if (!selectedId) return;
    markers = markers.filter(m => m.id !== selectedId);
    selectedId = null;
    panelContent.style.display = 'none';
    panelPlaceholder.style.display = 'block';
    renderMarkers();
    autoSave();
  });

  // ---- Export / Import ----
  btnExport.addEventListener('click', () => {
    const data = JSON.stringify({ colorMap, markers }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'garden-project.json';
    a.click();
  });

  btnImport.addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.colorMap) { colorMap = data.colorMap; nextColorId = Math.max(...colorMap.map(c => c.id), 0) + 1; }
        if (data.markers) { markers = data.markers; nextMarkerId = Math.max(...markers.map(m => m.id), 0) + 1; }
        selectedId = null;
        panelContent.style.display = 'none';
        panelPlaceholder.style.display = 'block';
        renderMarkers();
        renderColorEntries();
        autoSave();
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  });

  // ---- Auto-save ----
  function autoSave() {
    const name = canvas.dataset.filename;
    if (!name) return;
    localStorage.setItem('gardenViz_' + name, JSON.stringify({ colorMap, markers }));
  }

  // ---- Keyboard ----
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (pickingColor) {
        pickingColor = false;
        btnPickColor.classList.remove('active');
        canvasWrap.classList.remove('picking');
      }
      if (cropMode) {
        exitCropMode();
      }
      if (colorModal.style.display === 'flex') {
        modalCancel.click();
      }
      if (legendModal.style.display === 'flex') {
        legendModalCancel.click();
      }
    }
  });
})();
