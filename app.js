(() => {
  // ---- State ----
  let image = null;
  let imageData = null; // Cached full-image pixel data
  let scale = 1;
  let offsetX = 0, offsetY = 0;
  let markers = [];
  let colorMap = []; // [{id, color:[r,g,b], name, dbKey}]
  let selectedId = null;
  let pickingColor = false;
  let dragging = false;
  let dragStart = { x: 0, y: 0, ox: 0, oy: 0 };
  let nextMarkerId = 1;
  let nextColorId = 1;
  let pendingColor = null; // Color waiting to be named

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
  const panelPlaceholder = document.getElementById('panelPlaceholder');
  const panelContent = document.getElementById('panelContent');

  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnFitView = document.getElementById('btnFitView');
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

  const colorModal = document.getElementById('colorModal');
  const modalSwatch = document.getElementById('modalSwatch');
  const modalColorText = document.getElementById('modalColorText');
  const modalPlantName = document.getElementById('modalPlantName');
  const modalCancel = document.getElementById('modalCancel');
  const modalConfirm = document.getElementById('modalConfirm');
  const plantSuggestions = document.getElementById('plantSuggestions');

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
      uploadArea.style.display = 'none';
      viewerContainer.style.display = 'flex';
      drawImage();
      fitView();
      renderMarkers();
      renderColorEntries();
      clearHighlight();
      // Load saved project
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
  }

  // ---- Pan & Zoom ----
  canvasWrap.addEventListener('mousedown', e => {
    if (pickingColor) return;
    if (e.target.classList.contains('marker')) return;
    dragging = true;
    canvasWrap.classList.add('dragging');
    dragStart = { x: e.clientX, y: e.clientY, ox: offsetX, oy: offsetY };
  });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    offsetX = dragStart.ox + (e.clientX - dragStart.x);
    offsetY = dragStart.oy + (e.clientY - dragStart.y);
    applyTransform();
  });
  window.addEventListener('mouseup', () => { dragging = false; canvasWrap.classList.remove('dragging'); });

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

  // ---- Color Picking ----
  btnPickColor.addEventListener('click', () => {
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

    // Show modal
    modalSwatch.style.backgroundColor = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    modalColorText.textContent = `RGB(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    modalPlantName.value = '';
    colorModal.style.display = 'flex';
    modalPlantName.focus();

    // Show highlight preview
    const tol = parseInt(tolSlider.value);
    ColorScanner.drawHighlight(getImageData(), rgb, tol, highlightCtx, [255, 255, 0]);
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
    clearHighlight();
  });

  modalConfirm.addEventListener('click', () => {
    const name = modalPlantName.value.trim();
    if (!name) { modalPlantName.focus(); return; }
    colorMap.push({
      id: nextColorId++,
      color: pendingColor,
      name: name,
      dbKey: name.toLowerCase(),
      count: 0
    });
    colorModal.style.display = 'none';
    pendingColor = null;
    clearHighlight();
    renderColorEntries();
    autoSave();
  });

  modalPlantName.addEventListener('keydown', e => {
    if (e.key === 'Enter') modalConfirm.click();
    if (e.key === 'Escape') modalCancel.click();
  });

  // ---- Tolerance Slider ----
  tolSlider.addEventListener('input', () => {
    tolValue.textContent = tolSlider.value;
    // If modal is open, update preview
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
      el.innerHTML = `
        <div class="color-swatch" style="background:rgb(${entry.color[0]},${entry.color[1]},${entry.color[2]})"></div>
        <div class="color-entry-info">
          <span class="color-entry-name">${entry.name}</span>
          <span class="color-entry-count">${entry.count || 0} found</span>
        </div>
        <button class="color-entry-scan" title="Scan for this color" data-id="${entry.id}">Scan</button>
        <button class="color-entry-remove" title="Remove" data-id="${entry.id}">&times;</button>
      `;
      // Hover to highlight
      el.addEventListener('mouseenter', () => {
        ColorScanner.drawHighlight(getImageData(), entry.color, parseInt(tolSlider.value), highlightCtx, [255, 255, 0]);
      });
      el.addEventListener('mouseleave', () => clearHighlight());

      colorEntries.appendChild(el);
    });

    // Wire up scan/remove buttons
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
        // Remove markers for this color
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

    // Remove old markers for this color entry
    markers = markers.filter(m => m.colorId !== entry.id);

    const blobs = await ColorScanner.scan(getImageData(), entry.color, tol, minBlob, pct => {
      scanProgressBar.style.width = pct + '%';
      scanProgressText.textContent = `Scanning for ${entry.name}... ${pct}%`;
    });

    // Create markers from blobs
    const dbEntry = lookupPlant(entry.name);
    blobs.forEach(blob => {
      const m = {
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
      };
      markers.push(m);
    });

    entry.count = blobs.length;
    scanProgress.style.display = 'none';
    renderMarkers();
    renderColorEntries();
    autoSave();
  }

  btnScanAll.addEventListener('click', async () => {
    if (colorMap.length === 0) {
      alert('Pick some colors from the legend first.');
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

    // Show color swatch
    if (m.markerColor) {
      markerColorSwatch.style.display = 'block';
      markerColorSwatch.style.backgroundColor = `rgb(${m.markerColor[0]},${m.markerColor[1]},${m.markerColor[2]})`;
    } else {
      markerColorSwatch.style.display = 'none';
    }

    // Photos
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

  // Auto-save fields on change
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
      if (colorModal.style.display === 'flex') {
        modalCancel.click();
      }
    }
  });
})();
