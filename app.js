(() => {
  // State
  let image = null;
  let scale = 1;
  let offsetX = 0, offsetY = 0;
  let markers = [];
  let selectedId = null;
  let placingMode = false;
  let dragging = false;
  let dragStart = { x: 0, y: 0, ox: 0, oy: 0 };
  let nextId = 1;

  // DOM refs
  const uploadArea = document.getElementById('uploadArea');
  const uploadPrompt = document.getElementById('uploadPrompt');
  const fileInput = document.getElementById('fileInput');
  const viewerContainer = document.getElementById('viewerContainer');
  const canvasWrap = document.getElementById('canvasWrap');
  const canvas = document.getElementById('planCanvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('markersOverlay');
  const detailPanel = document.getElementById('detailPanel');
  const panelPlaceholder = document.getElementById('panelPlaceholder');
  const panelContent = document.getElementById('panelContent');

  // Toolbar
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnFitView = document.getElementById('btnFitView');
  const btnAddMarker = document.getElementById('btnAddMarker');
  const btnExport = document.getElementById('btnExport');
  const btnImport = document.getElementById('btnImport');
  const importInput = document.getElementById('importInput');
  const btnNewImage = document.getElementById('btnNewImage');

  // Panel fields
  const plantName = document.getElementById('plantName');
  const fieldCommon = document.getElementById('fieldCommon');
  const fieldBotanical = document.getElementById('fieldBotanical');
  const fieldType = document.getElementById('fieldType');
  const fieldSize = document.getElementById('fieldSize');
  const fieldBloom = document.getElementById('fieldBloom');
  const fieldSun = document.getElementById('fieldSun');
  const fieldWater = document.getElementById('fieldWater');
  const fieldNotes = document.getElementById('fieldNotes');
  const photoGrid = document.getElementById('photoGrid');
  const btnAddPhoto = document.getElementById('btnAddPhoto');
  const btnSave = document.getElementById('btnSave');
  const btnDeleteMarker = document.getElementById('btnDeleteMarker');

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
      selectedId = null;
      nextId = 1;
      showViewer();
      fitView();
      renderMarkers();
      // Try to load saved data for this image name
      const saved = localStorage.getItem('gardenViz_' + file.name);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          markers = data.markers || [];
          nextId = Math.max(...markers.map(m => m.id), 0) + 1;
          renderMarkers();
        } catch (_) {}
      }
      // Store filename for saving
      canvas.dataset.filename = file.name;
    };
    img.src = url;
  }

  function showViewer() {
    uploadArea.style.display = 'none';
    viewerContainer.style.display = 'flex';
  }

  // ---- Canvas / Pan / Zoom ----
  function fitView() {
    if (!image) return;
    const wrapRect = canvasWrap.getBoundingClientRect();
    const scaleX = wrapRect.width / image.width;
    const scaleY = wrapRect.height / image.height;
    scale = Math.min(scaleX, scaleY) * 0.95;
    offsetX = (wrapRect.width - image.width * scale) / 2;
    offsetY = (wrapRect.height - image.height * scale) / 2;
    applyTransform();
  }

  function applyTransform() {
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    ctx.drawImage(image, 0, 0);
    overlay.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  }

  canvasWrap.addEventListener('mousedown', e => {
    if (placingMode) return;
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
    renderMarkers();
  });
  window.addEventListener('mouseup', () => {
    dragging = false;
    canvasWrap.classList.remove('dragging');
  });

  canvasWrap.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = canvasWrap.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const prevScale = scale;
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    scale = Math.max(0.05, Math.min(20, scale * factor));
    // Zoom towards cursor
    offsetX = mx - (mx - offsetX) * (scale / prevScale);
    offsetY = my - (my - offsetY) * (scale / prevScale);
    applyTransform();
    renderMarkers();
  }, { passive: false });

  // Toolbar
  btnZoomIn.addEventListener('click', () => zoom(1.3));
  btnZoomOut.addEventListener('click', () => zoom(1 / 1.3));
  btnFitView.addEventListener('click', () => { fitView(); renderMarkers(); });
  btnNewImage.addEventListener('click', () => {
    viewerContainer.style.display = 'none';
    uploadArea.style.display = 'flex';
    fileInput.value = '';
    image = null;
  });

  function zoom(factor) {
    const rect = canvasWrap.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const prevScale = scale;
    scale = Math.max(0.05, Math.min(20, scale * factor));
    offsetX = cx - (cx - offsetX) * (scale / prevScale);
    offsetY = cy - (cy - offsetY) * (scale / prevScale);
    applyTransform();
    renderMarkers();
  }

  // ---- Marker Placement ----
  btnAddMarker.addEventListener('click', () => {
    placingMode = !placingMode;
    btnAddMarker.classList.toggle('active', placingMode);
    canvasWrap.classList.toggle('placing', placingMode);
  });

  canvasWrap.addEventListener('click', e => {
    if (!placingMode) return;
    if (e.target.classList.contains('marker')) return;
    const rect = canvasWrap.getBoundingClientRect();
    const imgX = (e.clientX - rect.left - offsetX) / scale;
    const imgY = (e.clientY - rect.top - offsetY) / scale;
    const marker = {
      id: nextId++,
      x: imgX,
      y: imgY,
      name: 'New Plant',
      common: '',
      botanical: '',
      type: '',
      size: '',
      bloom: '',
      sun: '',
      water: '',
      notes: '',
      photos: []
    };
    markers.push(marker);
    placingMode = false;
    btnAddMarker.classList.remove('active');
    canvasWrap.classList.remove('placing');
    renderMarkers();
    selectMarker(marker.id);
    autoSave();
  });

  // ---- Render Markers ----
  function renderMarkers() {
    overlay.innerHTML = '';
    markers.forEach(m => {
      const el = document.createElement('div');
      el.className = 'marker' + (m.id === selectedId ? ' selected' : '');
      el.style.left = m.x + 'px';
      el.style.top = m.y + 'px';
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
    plantName.textContent = m.name;
    fieldCommon.value = m.common || '';
    fieldBotanical.value = m.botanical || '';
    fieldType.value = m.type || '';
    fieldSize.value = m.size || '';
    fieldBloom.value = m.bloom || '';
    fieldSun.value = m.sun || '';
    fieldWater.value = m.water || '';
    fieldNotes.value = m.notes || '';
    renderPhotos(m);
    renderMarkers();
  }

  function renderPhotos(m) {
    photoGrid.innerHTML = '';
    (m.photos || []).forEach((url, i) => {
      const item = document.createElement('div');
      item.className = 'photo-item';
      const img = document.createElement('img');
      img.src = url;
      img.alt = m.common || m.name;
      const removeBtn = document.createElement('button');
      removeBtn.className = 'photo-remove';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        m.photos.splice(i, 1);
        renderPhotos(m);
        autoSave();
      });
      item.appendChild(img);
      item.appendChild(removeBtn);
      photoGrid.appendChild(item);
    });
  }

  btnAddPhoto.addEventListener('click', () => {
    const m = markers.find(m => m.id === selectedId);
    if (!m) return;
    const url = prompt('Enter photo URL:');
    if (url) {
      if (!m.photos) m.photos = [];
      m.photos.push(url);
      renderPhotos(m);
      autoSave();
    }
  });

  btnSave.addEventListener('click', () => {
    const m = markers.find(m => m.id === selectedId);
    if (!m) return;
    m.name = plantName.textContent.trim() || 'Plant';
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
  });

  btnDeleteMarker.addEventListener('click', () => {
    if (!selectedId) return;
    if (!confirm('Delete this plant marker?')) return;
    markers = markers.filter(m => m.id !== selectedId);
    selectedId = null;
    panelContent.style.display = 'none';
    panelPlaceholder.style.display = 'block';
    renderMarkers();
    autoSave();
  });

  // ---- Export / Import ----
  btnExport.addEventListener('click', () => {
    const data = JSON.stringify({ markers }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'garden-markers.json';
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
        if (data.markers) {
          markers = data.markers;
          nextId = Math.max(...markers.map(m => m.id), 0) + 1;
          selectedId = null;
          panelContent.style.display = 'none';
          panelPlaceholder.style.display = 'block';
          renderMarkers();
          autoSave();
        }
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  });

  // ---- Auto-save to localStorage ----
  function autoSave() {
    const name = canvas.dataset.filename;
    if (!name) return;
    localStorage.setItem('gardenViz_' + name, JSON.stringify({ markers }));
  }

  // ---- Keyboard shortcuts ----
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (placingMode) {
        placingMode = false;
        btnAddMarker.classList.remove('active');
        canvasWrap.classList.remove('placing');
      }
    }
    if (e.key === 'Delete' && selectedId && document.activeElement === document.body) {
      btnDeleteMarker.click();
    }
  });
})();
