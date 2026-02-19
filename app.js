(() => {
  // Cache version — bump this when processing logic changes to invalidate stale results
  const CACHE_VERSION = 3;

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

  // Annotation mode state
  let annotations = [];
  let nextAnnotationId = 1;
  let annotateMode = false;
  let selectedAnnotationId = null;
  let pendingAnnotationCoords = null;
  const btnAnnotate = document.getElementById('btnAnnotate');
  const btnSaveImage = document.getElementById('btnSaveImage');
  const btnLoadSaved = document.getElementById('btnLoadSaved');

  // Annotation modal
  const annotationModal = document.getElementById('annotationModal');
  const annotationNameInput = document.getElementById('annotationNameInput');
  const annotationSuggestions = document.getElementById('annotationSuggestions');
  const annotationModalCancel = document.getElementById('annotationModalCancel');
  const annotationModalSave = document.getElementById('annotationModalSave');

  // Saved images modal
  const savedImagesModal = document.getElementById('savedImagesModal');
  const savedImagesList = document.getElementById('savedImagesList');
  const savedImagesModalClose = document.getElementById('savedImagesModalClose');

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

  async function loadFile(file) {
    let img;

    // Check if file is a PDF
    if (PdfParser.isPdf(file)) {
      try {
        // Show loading state
        uploadPrompt.innerHTML = '<p>Loading PDF...</p>';
        img = await PdfParser.pdfToImage(file, 2);
      } catch (err) {
        console.error('Failed to load PDF:', err);
        uploadPrompt.innerHTML = `
          <p>Failed to load PDF</p>
          <p class="hint">${err.message}</p>
        `;
        setTimeout(() => {
          uploadPrompt.innerHTML = `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p>Drop a landscape plan here, or click to upload</p>
            <p class="hint">Supports PNG, JPG, PDF</p>
          `;
        }, 3000);
        return;
      }
    } else {
      // Load as regular image
      const url = URL.createObjectURL(file);
      img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = url;
      });
    }

    image = img;
    markers = [];
    colorMap = [];
    annotations = [];
    selectedId = null;
    selectedAnnotationId = null;
    nextMarkerId = 1;
    nextColorId = 1;
    nextAnnotationId = 1;
    imageData = null;
    cropRect = null;
    exitAnnotateMode();
    uploadArea.style.display = 'none';
    viewerContainer.style.display = 'flex';
    drawImage();
    fitView();
    renderMarkers();
    renderColorEntries();
    clearHighlight();
    hideCropSelection();
    const cacheKey = 'gardenViz_v' + CACHE_VERSION + '_' + file.name;
    const saved = localStorage.getItem(cacheKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.colorMap) { colorMap = data.colorMap; nextColorId = Math.max(...colorMap.map(c => c.id), 0) + 1; }
        if (data.markers) { markers = data.markers; nextMarkerId = Math.max(...markers.map(m => m.id), 0) + 1; }
        if (data.annotations) { annotations = data.annotations; nextAnnotationId = Math.max(...annotations.map(a => a.id), 0) + 1; }
        renderMarkers();
        renderColorEntries();
      } catch (_) {}
    }
    canvas.dataset.filename = file.name;
  }

  // ---- Canvas Drawing ----
  function drawImage() {
    canvas.width = image.width;
    canvas.height = image.height;
    // Use high quality image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
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
    if (e.target.classList.contains('annotation')) return;

    // Annotation mode: place a new annotation
    if (annotateMode) {
      e.preventDefault();
      const rect = canvasWrap.getBoundingClientRect();
      const imgX = (e.clientX - rect.left - offsetX) / scale;
      const imgY = (e.clientY - rect.top - offsetY) / scale;
      promptForAnnotation(imgX, imgY);
      return;
    }

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
    exitAnnotateMode();
  });

  // ---- Annotation Mode ----
  if (btnAnnotate) {
    btnAnnotate.addEventListener('click', () => {
      if (annotateMode) {
        exitAnnotateMode();
      } else {
        enterAnnotateMode();
      }
    });
  }

  function enterAnnotateMode() {
    annotateMode = true;
    exitCropMode();
    canvasWrap.classList.add('annotating');
    btnAnnotate.classList.add('active');
    // Hide auto-scanned markers, show only annotations
    renderMarkers();
  }

  function exitAnnotateMode() {
    annotateMode = false;
    canvasWrap.classList.remove('annotating');
    if (btnAnnotate) btnAnnotate.classList.remove('active');
    selectedAnnotationId = null;
    renderMarkers();
  }

  function promptForAnnotation(imgX, imgY) {
    // Store coordinates for when modal is confirmed
    pendingAnnotationCoords = { x: imgX, y: imgY };

    // Populate dropdown with colorMap entries
    annotationSuggestions.innerHTML = '';
    colorMap.forEach(entry => {
      const option = document.createElement('option');
      option.value = entry.name;
      annotationSuggestions.appendChild(option);
    });

    // Clear and focus input
    annotationNameInput.value = '';
    annotationModal.style.display = 'flex';
    setTimeout(() => annotationNameInput.focus(), 50);
  }

  function createAnnotation(name) {
    if (!name || !name.trim() || !pendingAnnotationCoords) return;

    const cleanedName = name.trim();

    // Check if this name matches a colorMap entry
    const colorEntry = colorMap.find(c => c.name.toLowerCase() === cleanedName.toLowerCase());
    const dbEntry = lookupPlant(cleanedName);

    const annotation = {
      id: nextAnnotationId++,
      x: pendingAnnotationCoords.x,
      y: pendingAnnotationCoords.y,
      name: cleanedName,
      common: dbEntry ? dbEntry.common : cleanedName,
      botanical: dbEntry ? dbEntry.botanical : '',
      type: dbEntry ? dbEntry.type : '',
      size: dbEntry ? dbEntry.size : '',
      bloom: dbEntry ? dbEntry.bloom : '',
      sun: dbEntry ? dbEntry.sun : '',
      water: dbEntry ? dbEntry.water : '',
      notes: dbEntry ? dbEntry.notes : '',
      colorId: colorEntry ? colorEntry.id : null,
      photos: [],
      photosFetched: false
    };

    annotations.push(annotation);
    console.log('Created annotation:', annotation, 'Total annotations:', annotations.length);
    pendingAnnotationCoords = null;
    autoSave();
    renderMarkers();
    selectAnnotation(annotation.id);
  }

  // Annotation modal handlers
  if (annotationModalCancel) {
    annotationModalCancel.addEventListener('click', () => {
      annotationModal.style.display = 'none';
      pendingAnnotationCoords = null;
    });
  }

  if (annotationModalSave) {
    annotationModalSave.addEventListener('click', () => {
      annotationModal.style.display = 'none';
      createAnnotation(annotationNameInput.value);
    });
  }

  if (annotationNameInput) {
    annotationNameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        annotationModal.style.display = 'none';
        createAnnotation(annotationNameInput.value);
      } else if (e.key === 'Escape') {
        annotationModal.style.display = 'none';
        pendingAnnotationCoords = null;
      }
    });
  }

  async function selectAnnotation(id) {
    selectedAnnotationId = id;
    selectedId = null; // Deselect any marker
    const a = annotations.find(ann => ann.id === id);
    if (!a) return;

    panelPlaceholder.style.display = 'none';
    panelContent.style.display = 'block';
    plantName.textContent = a.common || a.name;
    fieldCommon.value = a.common || '';
    fieldBotanical.value = a.botanical || '';
    fieldType.value = a.type || '';
    fieldSize.value = a.size || '';
    fieldBloom.value = a.bloom || '';
    fieldSun.value = a.sun || '';
    fieldWater.value = a.water || '';
    fieldNotes.value = a.notes || '';

    // No color swatch for annotations
    markerColorSwatch.style.display = 'none';

    // Show loading state for photos
    plantPhotos.innerHTML = '<p class="loading-photos">Loading plant images...</p>';
    renderMarkers();

    // Fetch images if not already fetched
    if (!a.photosFetched) {
      const searchName = a.botanical || a.common || a.name;
      try {
        const images = await ImageFetcher.fetchImages(searchName);
        a.photos = [...(images.closeup || []), ...(images.full || [])];
        a.photosFetched = true;
        autoSave();
      } catch (err) {
        console.warn('Failed to fetch images:', err);
        a.photos = [];
        a.photosFetched = true;
      }
    }

    // Display photos
    displayAnnotationPhotos(a);

    // Show delete button for annotations
    btnDeleteMarker.style.display = 'block';
  }

  function displayAnnotationPhotos(a) {
    plantPhotos.innerHTML = '';
    if (!a.photos || a.photos.length === 0) {
      plantPhotos.innerHTML = '<p class="no-photos">No photos found for this plant.</p>';
      return;
    }
    a.photos.forEach((url, index) => {
      const container = document.createElement('div');
      container.className = 'photo-container';
      const img = document.createElement('img');
      img.src = url;
      img.alt = `${a.common || a.name} - Photo ${index + 1}`;
      img.loading = 'lazy';
      img.onerror = () => container.style.display = 'none';
      img.addEventListener('click', () => window.open(url, '_blank'));
      container.appendChild(img);
      plantPhotos.appendChild(container);
    });
  }

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

  async function loadLegendFile(file) {
    // Check if file is a PDF
    if (PdfParser.isPdf(file)) {
      try {
        legendUploadZone.innerHTML = '<p>Loading PDF...</p>';
        const canvas = await PdfParser.pdfPageToCanvas(file, 1, 2);
        legendImageSource = canvas;
        legendPreviewImg.src = canvas.toDataURL('image/png');
        legendUploadPreview.style.display = 'block';
        legendUploadZone.style.display = 'none';
        legendUploadZone.innerHTML = `
          <p>Drop a legend image here, or click to select</p>
          <p class="hint">A cropped image of just the legend/key area</p>
        `;
        legendModalParse.disabled = false;
      } catch (err) {
        console.error('Failed to load PDF:', err);
        legendUploadZone.innerHTML = `
          <p>Failed to load PDF: ${err.message}</p>
          <p class="hint">Try uploading an image instead</p>
        `;
        setTimeout(() => {
          legendUploadZone.innerHTML = `
            <p>Drop a legend image here, or click to select</p>
            <p class="hint">A cropped image of just the legend/key area</p>
          `;
        }, 3000);
      }
      return;
    }

    // Load as regular image
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
    // Clear old markers when loading a new legend
    markers = [];
    colorMap = [];
    nextColorId = 1;

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

    // Only render auto-scanned markers when NOT in annotate mode
    if (!annotateMode) {
      markers.forEach(m => {
        const el = document.createElement('div');
        el.className = 'marker' + (m.id === selectedId ? ' selected' : '');
        el.style.left = m.x + 'px';
        el.style.top = m.y + 'px';

        // Find the color entry to get the color
        const colorEntry = colorMap.find(c => c.id === m.colorId);

        // Get the color to display (from marker or color entry)
        const displayColor = m.markerColor || (colorEntry && colorEntry.color);

        // Set background color for the marker dot
        if (displayColor && Array.isArray(displayColor) && displayColor.length >= 3) {
          el.style.backgroundColor = `rgb(${displayColor[0]},${displayColor[1]},${displayColor[2]})`;
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

    // Always render annotations
    console.log('Rendering annotations:', annotations.length, 'overlay:', overlay);
    annotations.forEach(a => {
      const el = document.createElement('div');
      el.className = 'annotation' + (a.id === selectedAnnotationId ? ' selected' : '');
      el.style.left = a.x + 'px';
      el.style.top = a.y + 'px';
      el.dataset.id = a.id;
      console.log('Annotation element:', el, 'at', a.x, a.y);

      const label = document.createElement('span');
      label.className = 'annotation-label';
      label.textContent = a.common || a.name;
      el.appendChild(label);

      el.addEventListener('click', e => {
        e.stopPropagation();
        selectAnnotation(a.id);
      });
      overlay.appendChild(el);
    });

    updateMarkerScale();
  }

  // ---- Selection & Detail Panel ----
  async function selectMarker(id) {
    selectedId = id;
    selectedAnnotationId = null; // Deselect any annotation
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
    // Handle saving annotation edits
    if (selectedAnnotationId) {
      const a = annotations.find(ann => ann.id === selectedAnnotationId);
      if (!a) return;
      a.common = fieldCommon.value;
      a.botanical = fieldBotanical.value;
      a.type = fieldType.value;
      a.size = fieldSize.value;
      a.bloom = fieldBloom.value;
      a.sun = fieldSun.value;
      a.water = fieldWater.value;
      a.notes = fieldNotes.value;
      a.photosFetched = false;
      a.photos = [];
      renderMarkers();
      autoSave();
      return;
    }

    // Handle saving marker edits
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
    // Handle deleting annotations
    if (selectedAnnotationId) {
      annotations = annotations.filter(a => a.id !== selectedAnnotationId);
      selectedAnnotationId = null;
      panelContent.style.display = 'none';
      panelPlaceholder.style.display = 'block';
      renderMarkers();
      autoSave();
      return;
    }
    // Handle deleting markers
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
    localStorage.setItem('gardenViz_v' + CACHE_VERSION + '_' + name, JSON.stringify({ colorMap, markers, annotations }));
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

    // Split entries into found and not found
    const foundEntries = [];
    const notFoundEntries = [];

    colorMap.forEach(entry => {
      const dbEntry = lookupPlant(entry.name);
      if (entry.count && entry.count > 0) {
        foundEntries.push({ entry, dbEntry });
      } else {
        notFoundEntries.push({ entry, dbEntry });
      }
    });

    // Render "Found on Map" section
    if (foundEntries.length > 0) {
      const section = document.createElement('div');
      section.className = 'plant-list-section';

      const header = document.createElement('h3');
      header.className = 'plant-list-header';
      header.innerHTML = `Found on Map <span class="plant-list-count">(${foundEntries.length})</span>`;
      section.appendChild(header);

      const list = document.createElement('div');
      list.className = 'plant-list-items';

      foundEntries.forEach(({ entry, dbEntry }) => {
        list.appendChild(createPlantListItem(entry, dbEntry, true));
      });

      section.appendChild(list);
      plantListContent.appendChild(section);
    }

    // Render "Not Yet Found" section
    if (notFoundEntries.length > 0) {
      const section = document.createElement('div');
      section.className = 'plant-list-section';

      const header = document.createElement('h3');
      header.className = 'plant-list-header not-found-header';
      header.innerHTML = `Not Yet Found <span class="plant-list-count">(${notFoundEntries.length})</span>`;
      section.appendChild(header);

      const list = document.createElement('div');
      list.className = 'plant-list-items';

      notFoundEntries.forEach(({ entry, dbEntry }) => {
        list.appendChild(createPlantListItem(entry, dbEntry, false));
      });

      section.appendChild(list);
      plantListContent.appendChild(section);
    }
  }

  function createPlantListItem(entry, dbEntry, isFound) {
    const item = document.createElement('div');
    item.className = 'plant-list-item' + (isFound ? '' : ' not-found');
    item.dataset.colorId = entry.id;

    // Create swatch showing the color from the legend
    const color = entry.color;
    const swatch = color && Array.isArray(color) && color.length >= 3
      ? `<div class="plant-list-swatch" style="background:rgb(${color[0]},${color[1]},${color[2]})"></div>`
      : `<div class="plant-list-swatch" style="background:#ccc"></div>`;

    // Use the original legend name, with database info if available
    const displayName = entry.name || 'Unknown';
    const botanical = dbEntry ? dbEntry.botanical : '';
    const count = entry.count || 0;

    item.innerHTML = `
      ${swatch}
      <div class="plant-list-info">
        <span class="plant-list-name">${displayName}</span>
        ${botanical ? `<span class="plant-list-botanical">${botanical}</span>` : ''}
      </div>
      <span class="plant-list-instances">${isFound ? count + ' found' : 'not scanned'}</span>
    `;

    item.addEventListener('click', () => selectPlantFromList(entry));
    return item;
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

  // ---- Debug Mode ----
  let debugMode = false;
  let debugFeedback = []; // Array of feedback entries
  let debugCurrentMarkerId = null;
  let debugMissingMode = false;

  const btnDebugMode = document.getElementById('btnDebugMode');
  const btnExportDebug = document.getElementById('btnExportDebug');
  const debugModeBanner = document.getElementById('debugModeBanner');
  const debugModal = document.getElementById('debugModal');
  const debugMarkerSwatch = document.getElementById('debugMarkerSwatch');
  const debugDetectedName = document.getElementById('debugDetectedName');
  const debugDetectedColor = document.getElementById('debugDetectedColor');
  const debugMarkerPosition = document.getElementById('debugMarkerPosition');
  const debugCorrectNameSection = document.getElementById('debugCorrectNameSection');
  const debugCorrectName = document.getElementById('debugCorrectName');
  const debugNotes = document.getElementById('debugNotes');
  const debugModalCancel = document.getElementById('debugModalCancel');
  const debugModalSave = document.getElementById('debugModalSave');
  const btnAddMissing = document.getElementById('btnAddMissing');

  // Toggle debug mode
  btnDebugMode.addEventListener('click', () => {
    debugMode = !debugMode;
    btnDebugMode.classList.toggle('active', debugMode);
    btnExportDebug.style.display = debugMode ? 'inline-block' : 'none';
    debugModeBanner.style.display = debugMode ? 'flex' : 'none';

    if (debugMode) {
      document.body.style.paddingTop = '40px';
    } else {
      document.body.style.paddingTop = '0';
      debugMissingMode = false;
    }
  });

  // Override marker click when in debug mode
  function handleMarkerClickForDebug(markerId) {
    debugCurrentMarkerId = markerId;
    const m = markers.find(marker => marker.id === markerId);
    if (!m) return;

    // Populate modal with marker info
    const color = m.markerColor || [];
    debugMarkerSwatch.style.backgroundColor = `rgb(${color[0] || 128},${color[1] || 128},${color[2] || 128})`;
    debugDetectedName.textContent = m.name || m.common || 'Unknown';
    debugDetectedColor.textContent = `rgb(${color.join(', ')})`;
    debugMarkerPosition.textContent = `(${Math.round(m.x)}, ${Math.round(m.y)})`;

    // Reset modal state
    document.querySelectorAll('.debug-rating-btn').forEach(btn => btn.classList.remove('selected'));
    debugCorrectNameSection.style.display = 'none';
    debugCorrectName.value = '';
    debugNotes.value = '';

    // Check if we already have feedback for this marker
    const existing = debugFeedback.find(f => f.markerId === markerId);
    if (existing) {
      const btn = document.querySelector(`.debug-rating-btn[data-rating="${existing.rating}"]`);
      if (btn) btn.classList.add('selected');
      if (existing.rating === 'wrong' || existing.rating === 'close') {
        debugCorrectNameSection.style.display = 'block';
        debugCorrectName.value = existing.correctName || '';
      }
      debugNotes.value = existing.notes || '';
    }

    debugModal.style.display = 'flex';
  }

  // Rating button clicks
  document.querySelectorAll('.debug-rating-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.debug-rating-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      // Show correct name field for wrong/close ratings
      const rating = btn.dataset.rating;
      if (rating === 'wrong' || rating === 'close') {
        debugCorrectNameSection.style.display = 'block';
      } else {
        debugCorrectNameSection.style.display = 'none';
      }
    });
  });

  // Cancel debug modal
  debugModalCancel.addEventListener('click', () => {
    debugModal.style.display = 'none';
    debugMissingMode = false;
  });

  // Save debug feedback
  debugModalSave.addEventListener('click', () => {
    const selectedRating = document.querySelector('.debug-rating-btn.selected');
    if (!selectedRating) {
      alert('Please select a rating');
      return;
    }

    const rating = selectedRating.dataset.rating;
    const m = markers.find(marker => marker.id === debugCurrentMarkerId);

    // Remove existing feedback for this marker
    debugFeedback = debugFeedback.filter(f => f.markerId !== debugCurrentMarkerId);

    // Add new feedback
    const feedback = {
      markerId: debugCurrentMarkerId,
      timestamp: new Date().toISOString(),
      rating: rating,
      detectedName: m ? (m.name || m.common) : 'Missing plant',
      detectedColor: m ? m.markerColor : null,
      position: m ? { x: Math.round(m.x), y: Math.round(m.y) } : null,
      correctName: debugCorrectName.value.trim() || null,
      notes: debugNotes.value.trim() || null,
      isMissing: debugMissingMode
    };
    debugFeedback.push(feedback);

    // Update marker visual to show feedback
    updateMarkerDebugClass(debugCurrentMarkerId, rating);

    debugModal.style.display = 'none';
    debugMissingMode = false;

    console.log('[Debug] Feedback saved:', feedback);
    console.log('[Debug] Total feedback entries:', debugFeedback.length);
  });

  // Update marker CSS class to show feedback status
  function updateMarkerDebugClass(markerId, rating) {
    const markerEl = overlay.querySelector(`.marker[data-id="${markerId}"]`);
    if (markerEl) {
      markerEl.classList.remove('debug-correct', 'debug-close', 'debug-wrong', 'debug-duplicate');
      if (rating) {
        markerEl.classList.add(`debug-${rating}`);
      }
    }
  }

  // Export debug feedback
  btnExportDebug.addEventListener('click', () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      imageFilename: canvas.dataset.filename || 'unknown',
      colorTolerance: parseInt(tolSlider.value),
      legendEntries: colorMap.map(c => ({
        id: c.id,
        name: c.name,
        color: c.color,
        count: c.count || 0
      })),
      totalMarkers: markers.length,
      feedbackCount: debugFeedback.length,
      feedback: debugFeedback,
      summary: {
        correct: debugFeedback.filter(f => f.rating === 'correct').length,
        close: debugFeedback.filter(f => f.rating === 'close').length,
        wrong: debugFeedback.filter(f => f.rating === 'wrong').length,
        duplicate: debugFeedback.filter(f => f.rating === 'duplicate').length,
        missing: debugFeedback.filter(f => f.isMissing).length
      }
    };

    const json = JSON.stringify(exportData, null, 2);

    // Copy to clipboard
    navigator.clipboard.writeText(json).then(() => {
      alert('Debug data copied to clipboard! You can paste it to share.');
    }).catch(() => {
      // Fallback: show in a prompt
      console.log('[Debug] Export data:', json);
      prompt('Copy this debug data:', json);
    });
  });

  // Add missing plant mode
  btnAddMissing.addEventListener('click', () => {
    debugMissingMode = true;
    alert('Click on the image where a plant is missing, then provide details in the popup.');

    // One-time click handler on canvas
    const handleMissingClick = (e) => {
      if (!debugMissingMode) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - offsetX) / scale;
      const y = (e.clientY - rect.top - offsetY) / scale;

      // Create a temporary marker ID
      debugCurrentMarkerId = 'missing_' + Date.now();

      // Populate modal for missing plant
      debugMarkerSwatch.style.backgroundColor = '#ccc';
      debugDetectedName.textContent = '(Not detected)';
      debugDetectedColor.textContent = 'N/A';
      debugMarkerPosition.textContent = `(${Math.round(x)}, ${Math.round(y)})`;

      // Reset and configure modal
      document.querySelectorAll('.debug-rating-btn').forEach(btn => btn.classList.remove('selected'));
      const wrongBtn = document.querySelector('.debug-rating-btn[data-rating="wrong"]');
      if (wrongBtn) wrongBtn.classList.add('selected');
      debugCorrectNameSection.style.display = 'block';
      debugCorrectName.value = '';
      debugNotes.value = '';

      // Store position in feedback for missing plants
      const feedback = debugFeedback.find(f => f.markerId === debugCurrentMarkerId);
      if (!feedback) {
        debugFeedback.push({
          markerId: debugCurrentMarkerId,
          position: { x: Math.round(x), y: Math.round(y) },
          isMissing: true
        });
      }

      debugModal.style.display = 'flex';
      canvasWrap.removeEventListener('click', handleMissingClick);
    };

    canvasWrap.addEventListener('click', handleMissingClick, { once: true });
  });

  // Modify marker click to check debug mode
  const originalRenderMarkers = renderMarkers;
  renderMarkers = function() {
    overlay.innerHTML = '';
    markers.forEach(m => {
      const el = document.createElement('div');
      el.className = 'marker' + (m.id === selectedId ? ' selected' : '');
      el.style.left = m.x + 'px';
      el.style.top = m.y + 'px';

      const colorEntry = colorMap.find(c => c.id === m.colorId);
      const displayColor = m.markerColor || (colorEntry && colorEntry.color);

      if (displayColor && Array.isArray(displayColor) && displayColor.length >= 3) {
        el.style.backgroundColor = `rgb(${displayColor[0]},${displayColor[1]},${displayColor[2]})`;
      }

      el.dataset.id = m.id;
      const label = document.createElement('span');
      label.className = 'marker-label';
      label.textContent = m.common || m.name;
      el.appendChild(label);

      // Check for existing feedback and add visual indicator
      const feedback = debugFeedback.find(f => f.markerId === m.id);
      if (feedback) {
        el.classList.add(`debug-${feedback.rating}`);
      }

      el.addEventListener('click', e => {
        e.stopPropagation();
        if (debugMode) {
          handleMarkerClickForDebug(m.id);
        } else {
          selectMarker(m.id);
        }
      });
      overlay.appendChild(el);
    });
    updateMarkerScale();
  };

  // ---- IndexedDB Image Storage ----
  const DB_NAME = 'GardenVizDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'savedImages';

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async function saveImageToDB(name, imageDataUrl, thumbnail) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record = {
        name: name,
        imageDataUrl: imageDataUrl,
        thumbnail: thumbnail,
        colorMap: colorMap,
        markers: markers,
        annotations: annotations,
        savedAt: Date.now()
      };
      const request = store.add(record);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getAllSavedImages() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getSavedImage(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function deleteSavedImage(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  function createThumbnail(img, maxSize = 120) {
    const thumbCanvas = document.createElement('canvas');
    const ratio = Math.min(maxSize / img.width, maxSize / img.height);
    thumbCanvas.width = img.width * ratio;
    thumbCanvas.height = img.height * ratio;
    const thumbCtx = thumbCanvas.getContext('2d');
    thumbCtx.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
    return thumbCanvas.toDataURL('image/jpeg', 0.7);
  }

  // Save image button
  if (btnSaveImage) {
    btnSaveImage.addEventListener('click', async () => {
      if (!image) return;

      const name = canvas.dataset.filename || 'Untitled';
      const imageDataUrl = canvas.toDataURL('image/png');
      const thumbnail = createThumbnail(image);

      try {
        await saveImageToDB(name, imageDataUrl, thumbnail);
        alert('Image saved successfully!');
      } catch (err) {
        console.error('Failed to save image:', err);
        alert('Failed to save image. Storage may be full.');
      }
    });
  }

  // Load saved images button
  if (btnLoadSaved) {
    btnLoadSaved.addEventListener('click', () => {
      showSavedImagesModal();
    });
  }

  async function showSavedImagesModal() {
    savedImagesList.innerHTML = '<p class="no-entries">Loading...</p>';
    savedImagesModal.style.display = 'flex';

    try {
      const images = await getAllSavedImages();
      if (images.length === 0) {
        savedImagesList.innerHTML = '<p class="no-entries">No saved images yet.</p>';
        return;
      }

      savedImagesList.innerHTML = '';
      images.sort((a, b) => b.savedAt - a.savedAt); // Most recent first

      images.forEach(img => {
        const item = document.createElement('div');
        item.className = 'saved-image-item';

        const date = new Date(img.savedAt);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const annotationCount = (img.annotations || []).length;
        const markerCount = (img.markers || []).length;

        item.innerHTML = `
          <img class="saved-image-thumb" src="${img.thumbnail}" alt="${img.name}">
          <div class="saved-image-info">
            <div class="saved-image-name">${img.name}</div>
            <div class="saved-image-meta">${dateStr} &bull; ${annotationCount} annotations, ${markerCount} markers</div>
          </div>
          <button class="saved-image-delete" title="Delete">&times;</button>
        `;

        // Click to load
        item.addEventListener('click', async (e) => {
          if (e.target.classList.contains('saved-image-delete')) return;
          await loadSavedImage(img.id);
          savedImagesModal.style.display = 'none';
        });

        // Delete button
        item.querySelector('.saved-image-delete').addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm('Delete this saved image?')) {
            await deleteSavedImage(img.id);
            showSavedImagesModal(); // Refresh list
          }
        });

        savedImagesList.appendChild(item);
      });
    } catch (err) {
      console.error('Failed to load saved images:', err);
      savedImagesList.innerHTML = '<p class="no-entries">Failed to load saved images.</p>';
    }
  }

  async function loadSavedImage(id) {
    try {
      const saved = await getSavedImage(id);
      if (!saved) return;

      // Create image from data URL
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = saved.imageDataUrl;
      });

      // Set up state
      image = img;
      markers = saved.markers || [];
      colorMap = saved.colorMap || [];
      annotations = saved.annotations || [];
      selectedId = null;
      selectedAnnotationId = null;
      nextMarkerId = markers.length > 0 ? Math.max(...markers.map(m => m.id)) + 1 : 1;
      nextColorId = colorMap.length > 0 ? Math.max(...colorMap.map(c => c.id)) + 1 : 1;
      nextAnnotationId = annotations.length > 0 ? Math.max(...annotations.map(a => a.id)) + 1 : 1;
      imageData = null;
      cropRect = null;
      exitAnnotateMode();

      uploadArea.style.display = 'none';
      viewerContainer.style.display = 'flex';
      drawImage();
      fitView();
      renderMarkers();
      renderColorEntries();
      clearHighlight();
      hideCropSelection();
      canvas.dataset.filename = saved.name;

    } catch (err) {
      console.error('Failed to load saved image:', err);
      alert('Failed to load saved image.');
    }
  }

  // Close saved images modal
  if (savedImagesModalClose) {
    savedImagesModalClose.addEventListener('click', () => {
      savedImagesModal.style.display = 'none';
    });
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
      if (debugModal.style.display === 'flex') {
        debugModalCancel.click();
      }
      if (annotationModal && annotationModal.style.display === 'flex') {
        annotationModal.style.display = 'none';
        pendingAnnotationCoords = null;
      }
      if (savedImagesModal && savedImagesModal.style.display === 'flex') {
        savedImagesModal.style.display = 'none';
      }
    }
  });
})();
