// src/js/layers/pano-projects.js
// Loads pano_index.geojson from R2 and renders project hull polygons.
// - Hover: custom div popup with project info, arrow nav for overlapping hulls
// - Click: fade hull, load per-project pano_data.geojson as dots, show close button
// - Close button (NE corner of hull): unload dots, restore hull opacity

(async function () {

  const R2_BASE = 'https://pano.ese-llc.com';
  const INDEX_URL = `${R2_BASE}/pano_index.geojson?nocache=${Date.now()}`;

  // ── State ──────────────────────────────────────────────────────────────────
  const openProjects = new Map(); // projectId → { dotSourceId, dotLayerId, closeBtnEl }
  let hoverFeatures  = [];        // features under cursor
  let hoverIndex     = 0;         // which one is shown in popup
  let hoverPopupEl   = null;

  // ── Fetch index ────────────────────────────────────────────────────────────
  let indexData;
  try {
    const res = await fetch(INDEX_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    indexData = await res.json();
  } catch (err) {
    console.error('[pano-projects] Failed to load pano_index.geojson:', err);
    return;
  }

  if (!indexData?.features?.length) {
    console.warn('[pano-projects] pano_index.geojson is empty — nothing to draw.');
    return;
  }

  // ── Add hull source + layers ───────────────────────────────────────────────
  map.addSource('pano-projects-source', {
    type: 'geojson',
    data: indexData,
    promoteId: 'id',
  });

  // Fill — semi-transparent grey, fades further when project is open
  map.addLayer({
    id: 'pano-projects-fill',
    type: 'fill',
    source: 'pano-projects-source',
    layout: { visibility: 'none' },
    paint: {
      'fill-color': '#888888',
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'open'], false], 0.10,
        0.25
      ],
    },
  });

  // Outline
  map.addLayer({
    id: 'pano-projects-outline',
    type: 'line',
    source: 'pano-projects-source',
    layout: { visibility: 'none' },
    paint: {
      'line-color': '#555555',
      'line-width': 1.5,
      'line-opacity': [
        'case',
        ['boolean', ['feature-state', 'open'], false], 0.4,
        0.85
      ],
    },
  });

  // ── Hover popup ────────────────────────────────────────────────────────────
  function createHoverPopup() {
    const el = document.createElement('div');
    el.id = 'pano-project-hover';
    el.style.cssText = `
      display: none;
      position: absolute;
      z-index: 900;
      background: rgba(0,0,0,0.78);
      color: #fff;
      padding: 10px 13px;
      border-radius: 8px;
      font-family: sans-serif;
      font-size: 12px;
      min-width: 200px;
      max-width: 260px;
      pointer-events: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.45);
      user-select: none;
    `;
    document.getElementById('map').appendChild(el);
    return el;
  }

  function renderHoverPopup() {
    if (!hoverFeatures.length || !hoverPopupEl) return;
    const f    = hoverFeatures[hoverIndex];
    const p    = f.properties;
    const total = hoverFeatures.length;

    const nav = total > 1 ? `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;border-top:1px solid #444;padding-top:6px;">
        <button id="pano-hover-prev" style="background:none;border:1px solid #666;color:#ccc;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px;">◀</button>
        <span style="color:#aaa;font-size:11px;">${hoverIndex + 1} / ${total}</span>
        <button id="pano-hover-next" style="background:none;border:1px solid #666;color:#ccc;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px;">▶</button>
      </div>` : '';

    hoverPopupEl.innerHTML = `
      <div style="font-weight:bold;font-size:13px;margin-bottom:4px;">${p.name || p.id}</div>
      ${p.town    ? `<div style="color:#aaa;">${p.town}</div>` : ''}
      ${p.owner   ? `<div style="color:#aaa;">${p.owner}</div>` : ''}
      ${p.date    ? `<div style="color:#aaa;margin-top:2px;">${p.date}</div>` : ''}
      <div style="margin-top:4px;color:#ccc;">${(p.image_count || 0).toLocaleString()} images</div>
      ${p.description ? `<div style="margin-top:4px;color:#bbb;font-style:italic;">${p.description}</div>` : ''}
      ${nav}
    `;

    // Arrow buttons need pointer-events
    if (total > 1) {
      hoverPopupEl.style.pointerEvents = 'auto';
      hoverPopupEl.querySelector('#pano-hover-prev').addEventListener('click', (e) => {
        e.stopPropagation();
        hoverIndex = (hoverIndex - 1 + total) % total;
        renderHoverPopup();
      });
      hoverPopupEl.querySelector('#pano-hover-next').addEventListener('click', (e) => {
        e.stopPropagation();
        hoverIndex = (hoverIndex + 1) % total;
        renderHoverPopup();
      });
    } else {
      hoverPopupEl.style.pointerEvents = 'none';
    }
  }

  function positionHoverPopup(point) {
    if (!hoverPopupEl) return;
    const mapEl   = document.getElementById('map');
    const rect    = mapEl.getBoundingClientRect();
    const offsetX = 14;
    const offsetY = -10;
    let left = point.x + offsetX;
    let top  = point.y + offsetY;
    // keep within map bounds
    const popW = 270;
    if (left + popW > rect.width) left = point.x - popW - offsetX;
    hoverPopupEl.style.left = `${left}px`;
    hoverPopupEl.style.top  = `${top}px`;
    hoverPopupEl.style.display = 'block';
  }

  hoverPopupEl = createHoverPopup();

  map.on('mousemove', 'pano-projects-fill', (e) => {
    map.getCanvas().style.cursor = 'pointer';
    const features = map.queryRenderedFeatures(e.point, { layers: ['pano-projects-fill'] });
    // Sort: most recent date first
    features.sort((a, b) => {
      const da = a.properties.date || '';
      const db = b.properties.date || '';
      return db.localeCompare(da);
    });
    hoverFeatures = features;
    hoverIndex    = 0;
    renderHoverPopup();
    positionHoverPopup(e.point);
  });

  map.on('mouseleave', 'pano-projects-fill', () => {
    map.getCanvas().style.cursor = '';
    if (hoverPopupEl) hoverPopupEl.style.display = 'none';
    hoverFeatures = [];
    hoverIndex    = 0;
  });

  // ── Close button (NE corner of hull bbox) ─────────────────────────────────
  function getBboxNE(feature) {
    const coords = feature.geometry.coordinates[0];
    let maxLng = -Infinity, maxLat = -Infinity;
    for (const [lng, lat] of coords) {
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    }
    return [maxLng, maxLat];
  }

  function createCloseButton(projectId, lngLat) {
    const point = map.project(lngLat);
    const el = document.createElement('div');
    el.className = 'pano-project-close-btn';
    el.dataset.projectId = projectId;
    el.style.cssText = `
      position: absolute;
      left: ${point.x}px;
      top: ${point.y}px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #555;
      border: 2px solid #ccc;
      color: #fff;
      font-size: 13px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 950;
      transform: translate(-50%, -50%);
      box-shadow: 0 1px 4px rgba(0,0,0,0.5);
      user-select: none;
    `;
    el.innerHTML = '⊗';
    el.title = 'Close project';

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      closeProject(projectId);
    });

    // Reposition on map move
    function reposition() {
      const p = map.project(lngLat);
      el.style.left = `${p.x}px`;
      el.style.top  = `${p.y}px`;
    }
    map.on('move', reposition);
    el._removeReposition = () => map.off('move', reposition);

    document.getElementById('map').appendChild(el);
    return el;
  }

  // ── Open project (load dots) ───────────────────────────────────────────────
  async function openProject(feature) {
    const props     = feature.properties;
    const projectId = props.id;

    if (openProjects.has(projectId)) return; // already open

    // Fade hull
    map.setFeatureState(
      { source: 'pano-projects-source', id: projectId },
      { open: true }
    );

    // Load per-project GeoJSON
    const dataUrl = `${props.data_url}?nocache=${Date.now()}`;
    let projectData;
    try {
      const res = await fetch(dataUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      projectData = await res.json();
    } catch (err) {
      console.error(`[pano-projects] Failed to load dots for ${projectId}:`, err);
      map.setFeatureState({ source: 'pano-projects-source', id: projectId }, { open: false });
      return;
    }

    const dotSourceId = `pano-dots-source-${projectId}`;
    const dotLayerId  = `pano-dots-${projectId}`;

    map.addSource(dotSourceId, { type: 'geojson', data: projectData, promoteId: 'key' });

    map.addLayer({
      id: dotLayerId,
      type: 'circle',
      source: dotSourceId,
      paint: {
        'circle-radius': ['case', ['boolean', ['feature-state', 'viewed'], false], 10, 6],
        'circle-color':  ['case', ['boolean', ['feature-state', 'viewed'], false], '#FFFF00', '#00ffff'],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-opacity': ['case', ['boolean', ['feature-state', 'viewed'], false], 0.9, 0.75],
        'circle-pitch-scale': 'map',
      },
    });

    // Close button at NE corner of hull
    const neLngLat = getBboxNE(feature);
    // Offset slightly NE in lng/lat degrees
    const closeLngLat = [neLngLat[0] + 0.0003, neLngLat[1] + 0.0002];
    const closeBtnEl  = createCloseButton(projectId, closeLngLat);

    openProjects.set(projectId, { dotSourceId, dotLayerId, closeBtnEl, closeLngLat });

    // Dot click → open panorama viewer (matches existing panoramas layer behavior)
    map.on('click', dotLayerId, (e) => {
      const f = e.features[0];
      if (!f) return;
      e.originalEvent._panoHandled = true;
      const filename = f.properties.key;
      const url      = f.properties.url;
      if (url && typeof window.openPanorama === 'function') {
        window.openPanorama(filename, url);
      }
    });

    map.on('mouseenter', dotLayerId, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', dotLayerId, () => { map.getCanvas().style.cursor = ''; });
  }

  // ── Close project ──────────────────────────────────────────────────────────
  function closeProject(projectId) {
    if (!openProjects.has(projectId)) return;
    const { dotSourceId, dotLayerId, closeBtnEl } = openProjects.get(projectId);

    if (map.getLayer(dotLayerId))  map.removeLayer(dotLayerId);
    if (map.getSource(dotSourceId)) map.removeSource(dotSourceId);

    if (closeBtnEl) {
      if (closeBtnEl._removeReposition) closeBtnEl._removeReposition();
      closeBtnEl.remove();
    }

    map.setFeatureState(
      { source: 'pano-projects-source', id: projectId },
      { open: false }
    );

    openProjects.delete(projectId);
  }

  // ── Click hull → open project ──────────────────────────────────────────────
  map.on('click', 'pano-projects-fill', (e) => {
    if (e.originalEvent._panoHandled) return;
    const features = map.queryRenderedFeatures(e.point, { layers: ['pano-projects-fill'] });
    for (const f of features) {
      openProject(f);
    }
  });

  console.log(`[pano-projects] Loaded ${indexData.features.length} project(s).`);

})();
