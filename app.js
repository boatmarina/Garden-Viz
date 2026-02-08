(() => {
  // ---- State ----
  let image = null;
  let imageData = null;
  let scale = 1;
  let offsetX = 0, offsetY = 0;
  let markers = [];
  let colorMap = [];
  let selectedId = null;
  let dragging = false;
  let dragStart = { x: 0, y: 0, ox: 0, oy: 0 };
  let nextMarkerId = 1;
  let nextColorId = 1;

  // Crop selection state
  let cropMode = false;
  let cropDragging = false;
  let cropRect = null;
  let cropStart = null;

  // Legend modal state
  let legendImageSource = null;
  let parsedEntries = [];

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
  const btnScanAll = document.getElementById('btnScanAll');
  const btnNewImage = document.getElementById('btnNewImage');
  const btnToggleView = document.getElementById('btnToggleView');
  const plantListView = document.getElementById('plantListView');
  const plantListContent = document.getElementById('plantListContent');

  // View state (for plant list view)
  let currentView = 'map'; // 'map' or 'list'
  const hasPlantListView = btnToggleView && plantListView && plantListContent;

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
    updateMarkerScale();
  }

  // Update marker sizes to be inversely proportional to zoom
  function updateMarkerScale() {
    const markerScale = Math.min(1, 1 / scale);
    overlay.style.setProperty('--marker-scale', markerScale);
  }

  // ---- Pan & Zoom ----
  canvasWrap.addEventListener('mousedown', e => {
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
    canvasWrap.classList.add('picking');
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

    showLegendModal('crop');
    legendCropPreview.style.display = 'block';
    legendCropCanvas.width = cw;
    legendCropCanvas.height = ch;
    legendCropCanvas.getContext('2d').drawImage(cropCanvas, 0, 0);
    cropSizeText.textContent = `${cw} x ${ch} pixels`;
    legendModalParse.disabled = false;
  }

  // ---- Legend Parse Modal ----
  btnParseLegend.addEventListener('click', () => {
    if (cropMode) { exitCropMode(); return; }
    showLegendModal('upload');
  });

  function showLegendModal(tab) {
    legendModal.style.display = 'flex';
    resetLegendModal();
    switchLegendTab(tab || 'upload');
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

  legendTabs.forEach(tab => {
    tab.addEventListener('click', () => switchLegendTab(tab.dataset.tab));
  });

  function switchLegendTab(tabName) {
    legendTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    legendTabUpload.style.display = tabName === 'upload' ? 'block' : 'none';
    legendTabCrop.style.display = tabName === 'crop' ? 'block' : 'none';
  }

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

  btnStartCrop.addEventListener('click', () => {
    legendModal.style.display = 'none';
    enterCropMode();
  });

  legendModalCancel.addEventListener('click', () => {
    legendModal.style.display = 'none';
    legendImageSource = null;
    parsedEntries = [];
  });

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
      legendResultsList.innerHTML = '<p class="no-entries">No plant entries detected. Try a clearer legend image.</p>';
      legendModalParse.disabled = false;
      return;
    }

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

      const swatchHtml = entry.templateDataUrl
        ? `<img class="color-swatch-template" src="${entry.templateDataUrl}" title="Pattern template">`
        : `<div class="color-swatch" style="background:rgb(${entry.color[0]},${entry.color[1]},${entry.color[2]})"></div>`;

      el.innerHTML = `
        ${swatchHtml}
        <div class="color-entry-info">
          <span class="color-entry-name">${entry.name}</span>
          <span class="color-entry-count">${entry.count || 0} found</span>
        </div>
        <button class="color-entry-scan" title="Scan for this plant" data-id="${entry.id}">Scan</button>
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

    scanProgress.style.display = 'flex';
    scanProgressText.textContent = `Scanning for ${entry.name}... 0%`;
    scanProgressBar.style.width = '0%';

    markers = markers.filter(m => m.colorId !== entry.id);

    // Use color-only matching for reliability
    // Pattern matching can be re-enabled in the future
    const blobs = await ColorScanner.scan(getImageData(), entry.color, tol, minBlob, pct => {
      scanProgressBar.style.width = pct + '%';
      scanProgressText.textContent = `Scanning for ${entry.name}... ${pct}%`;
    });

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
        photos: [], // Will be fetched when selected
        photosFetched: false
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
      alert('Add colors to the legend first using Parse Legend.');
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

      // Find the color entry to get the template and color
      const colorEntry = colorMap.find(c => c.id === m.colorId);

      // Get the color to display (from marker or color entry)
      const displayColor = m.markerColor || (colorEntry && colorEntry.color);

      // Always set a background color first (fallback)
      if (displayColor) {
        el.style.backgroundColor = `rgb(${displayColor[0]},${displayColor[1]},${displayColor[2]})`;
      }

      // Overlay with template pattern if available
      if (colorEntry && colorEntry.templateDataUrl) {
        el.style.backgroundImage = `url(${colorEntry.templateDataUrl})`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
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
    updateMarkerScale();
  }

  // ---- Selection & Detail Panel ----
  async function selectMarker(id) {
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

    // Show loading state for photos
    plantPhotos.innerHTML = '<p class="loading-photos">Loading plant images...</p>';
    renderMarkers();

    // Fetch images if not already fetched
    if (!m.photosFetched) {
      const searchName = m.botanical || m.common || m.name;
      try {
        const images = await ImageFetcher.fetchImages(searchName);

        // Combine closeup and full images
        m.photos = [];
        if (images.closeup.length > 0) {
          m.photos.push(...images.closeup);
        }
        if (images.full.length > 0) {
          m.photos.push(...images.full);
        }
        m.photosFetched = true;
        autoSave();
      } catch (err) {
        console.warn('Failed to fetch images:', err);
        m.photos = [];
        m.photosFetched = true;
      }
    }

    // Display photos
    displayPhotos(m);
  }

  function displayPhotos(m) {
    plantPhotos.innerHTML = '';

    if (!m.photos || m.photos.length === 0) {
      plantPhotos.innerHTML = '<p class="no-photos">No photos found for this plant.</p>';
      return;
    }

    m.photos.forEach((url, index) => {
      const container = document.createElement('div');
      container.className = 'photo-container';

      const img = document.createElement('img');
      img.src = url;
      img.alt = `${m.common || m.name} - Photo ${index + 1}`;
      img.loading = 'lazy';
      img.onerror = () => container.style.display = 'none';

      // Click to open full size
      img.addEventListener('click', () => {
        window.open(url, '_blank');
      });

      container.appendChild(img);
      plantPhotos.appendChild(container);
    });
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

    // If botanical name changed, reset photos to allow re-fetch
    m.photosFetched = false;
    m.photos = [];

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

  // ---- Auto-save ----
  function autoSave() {
    const name = canvas.dataset.filename;
    if (!name) return;
    localStorage.setItem('gardenViz_' + name, JSON.stringify({ colorMap, markers }));
  }

  // ---- Plant List View ----
  const plantTypes = {
    'deciduous-tree': 'Deciduous Trees',
    'evergreen-tree': 'Evergreen Trees',
    'deciduous-shrub': 'Deciduous Shrubs',
    'evergreen-shrub': 'Evergreen Shrubs',
    'perennial': 'Perennials',
    'perennial-bulb': 'Perennial Bulbs',
    'annual': 'Annuals',
    'ornamental-grass': 'Ornamental Grasses',
    'ground-cover': 'Ground Covers',
    'vine': 'Vines',
    'succulent': 'Succulents',
    'fern': 'Ferns',
    '': 'Uncategorized'
  };

  if (hasPlantListView) {
    btnToggleView.addEventListener('click', () => {
      if (currentView === 'map') {
        currentView = 'list';
        btnToggleView.textContent = 'Map View';
        canvasWrap.style.display = 'none';
        plantListView.style.display = 'block';
        renderPlantList();
      } else {
        currentView = 'map';
        btnToggleView.textContent = 'Plant List';
        canvasWrap.style.display = 'block';
        plantListView.style.display = 'none';
      }
    });
  }

  function renderPlantList() {
    if (!plantListContent) return;
    plantListContent.innerHTML = '';

    if (colorMap.length === 0) {
      plantListContent.innerHTML = '<p class="no-entries">No plants in legend yet. Use Parse Legend to add plants.</p>';
      return;
    }

    // Group plants by type
    const groups = {};
    colorMap.forEach(entry => {
      const dbEntry = lookupPlant(entry.name);
      const type = dbEntry ? dbEntry.type : '';
      if (!groups[type]) groups[type] = [];
      groups[type].push({ entry, dbEntry });
    });

    // Render each group
    const typeOrder = Object.keys(plantTypes);
    typeOrder.forEach(type => {
      if (!groups[type] || groups[type].length === 0) return;

      const section = document.createElement('div');
      section.className = 'plant-list-section';

      const header = document.createElement('h3');
      header.className = 'plant-list-header';
      header.textContent = plantTypes[type] || 'Other';
      header.innerHTML += ` <span class="plant-list-count">(${groups[type].length})</span>`;
      section.appendChild(header);

      const list = document.createElement('div');
      list.className = 'plant-list-items';

      groups[type].forEach(({ entry, dbEntry }) => {
        const item = document.createElement('div');
        item.className = 'plant-list-item';
        item.dataset.colorId = entry.id;

        // Create swatch showing pattern or color
        const swatch = entry.templateDataUrl
          ? `<img class="plant-list-swatch" src="${entry.templateDataUrl}" alt="">`
          : `<div class="plant-list-swatch" style="background:rgb(${entry.color[0]},${entry.color[1]},${entry.color[2]})"></div>`;

        const common = dbEntry ? dbEntry.common : entry.name;
        const botanical = dbEntry ? dbEntry.botanical : '';
        const count = entry.count || 0;

        item.innerHTML = `
          ${swatch}
          <div class="plant-list-info">
            <span class="plant-list-name">${common}</span>
            ${botanical ? `<span class="plant-list-botanical">${botanical}</span>` : ''}
          </div>
          <span class="plant-list-instances">${count} on map</span>
        `;

        item.addEventListener('click', () => selectPlantFromList(entry));
        list.appendChild(item);
      });

      section.appendChild(list);
      plantListContent.appendChild(section);
    });
  }

  async function selectPlantFromList(entry) {
    // Show detail panel with plant info
    const dbEntry = lookupPlant(entry.name);
    panelPlaceholder.style.display = 'none';
    panelContent.style.display = 'block';

    const common = dbEntry ? dbEntry.common : entry.name;
    plantName.textContent = common;
    fieldCommon.value = common;
    fieldBotanical.value = dbEntry ? dbEntry.botanical : '';
    fieldType.value = dbEntry ? dbEntry.type : '';
    fieldSize.value = dbEntry ? dbEntry.size : '';
    fieldBloom.value = dbEntry ? dbEntry.bloom : '';
    fieldSun.value = dbEntry ? dbEntry.sun : '';
    fieldWater.value = dbEntry ? dbEntry.water : '';
    fieldNotes.value = dbEntry ? dbEntry.notes : '';

    // Show color/pattern swatch
    if (entry.templateDataUrl) {
      markerColorSwatch.style.display = 'block';
      markerColorSwatch.style.backgroundImage = `url(${entry.templateDataUrl})`;
      markerColorSwatch.style.backgroundSize = 'cover';
      markerColorSwatch.style.backgroundColor = 'transparent';
    } else if (entry.color) {
      markerColorSwatch.style.display = 'block';
      markerColorSwatch.style.backgroundImage = 'none';
      markerColorSwatch.style.backgroundColor = `rgb(${entry.color[0]},${entry.color[1]},${entry.color[2]})`;
    } else {
      markerColorSwatch.style.display = 'none';
    }

    // Show loading for photos
    plantPhotos.innerHTML = '<p class="loading-photos">Loading plant images...</p>';

    // Fetch images
    const searchName = (dbEntry ? dbEntry.botanical : '') || common || entry.name;
    try {
      const images = await ImageFetcher.fetchImages(searchName);
      const photos = [...(images.closeup || []), ...(images.full || [])];

      plantPhotos.innerHTML = '';
      if (photos.length === 0) {
        plantPhotos.innerHTML = '<p class="no-photos">No photos found for this plant.</p>';
      } else {
        photos.forEach((url, index) => {
          const container = document.createElement('div');
          container.className = 'photo-container';
          const img = document.createElement('img');
          img.src = url;
          img.alt = `${common} - Photo ${index + 1}`;
          img.loading = 'lazy';
          img.onerror = () => container.style.display = 'none';
          img.addEventListener('click', () => window.open(url, '_blank'));
          container.appendChild(img);
          plantPhotos.appendChild(container);
        });
      }
    } catch (err) {
      console.warn('Failed to fetch images:', err);
      plantPhotos.innerHTML = '<p class="no-photos">No photos found for this plant.</p>';
    }

    // Hide delete button in list view (no marker to delete)
    if (hasPlantListView) {
      btnDeleteMarker.style.display = currentView === 'list' ? 'none' : 'block';
    }
  }

  // ---- Keyboard ----
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (cropMode) {
        exitCropMode();
      }
      if (legendModal.style.display === 'flex') {
        legendModalCancel.click();
      }
    }
  });
})();
