// src/js/layers/pano-projects.js
// Loads pano_index.geojson from R2 and renders project hull polygons.
// - Public projects always visible
// - Private projects visible only when a valid access code is present
// - Private unlocked hulls render in blue
// - Hover: custom div popup with project info, arrow nav for overlapping hulls
// - Click hull: fade hull, load per-project pano_data.geojson as dots, show close button at centroid
// - Click dot: open project panorama viewer (prev/next within project)
// - Click close button: unload dots, restore hull opacity

(async function () {

  const R2_BASE   = 'https://panoramas.ese-llc.com';
  const INDEX_URL = `${R2_BASE}/pano_index.geojson?nocache=${Date.now()}`;

  // ── Access code promise ──────────────────────────────────────────────────────
  // Create the promise now so decode-url.js can resolve it later.
  if (!window.panoAccessCodeReady) {
    let resolve;
    window.panoAccessCodeReady = new Promise(r => { resolve = r; });
    window._resolvePanoAccessCode = resolve;
  }

  // ── State ────────────────────────────────────────────────────────────────────
  const openProjects = new Map();
  let hoverFeatures  = [];
  let hoverIndex     = 0;
  let hoverPopupEl   = null;

  // ── Fetch index ──────────────────────────────────────────────────────────────
  let indexData;
  try {
    const res = await fetch(INDEX_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    indexData = await res.json();
  } catch (err) {
    console.error('[pano-projects] Failed to load pano_index.geojson:', err);
    window._resolvePanoAccessCode?.(null); // unblock in case decode-url never runs
    return;
  }

  if (!indexData?.features?.length) {
    console.warn('[pano-projects] pano_index.geojson is empty — nothing to draw.');
    window._resolvePanoAccessCode?.(null);
    return;
  }

  // ── Wait for access code resolution ─────────────────────────────────────────
  const accessCode = await window.panoAccessCodeReady;

  // ── Filter features based on access code ────────────────────────────────────
  function isUnlocked(feature) {
    const p = feature.properties;
    if (!p.private) return true; // public — always visible

    if (!accessCode) return false;

    // Master code unlocks everything
    if (accessCode.scope === 'master') return true;

    // Account-wide code unlocks all projects (owned by that account)
    if (accessCode.scope === 'account') return true;

    // Project-scoped code — match project_id
    if (accessCode.scope === 'project' && accessCode.project_id === p.id) return true;

    return false;
  }

  const visibleFeatures = indexData.features.filter(isUnlocked);

  if (!visibleFeatures.length) {
    console.log('[pano-projects] No visible projects for current access level.');
    return;
  }

  const filteredIndex = { ...indexData, features: visibleFeatures };

  // ── Expose index + open function for decode-url.js and share.js ─────────────
  window.panoProjectIndex  = indexData;   // full index (all features, pre-filter)
  window.openPanoProject   = openProject; // callable by decode-url after load
  window.openPanoProjectId = null;        // tracks currently open project

  // ── Add hull source + layers ─────────────────────────────────────────────────
  map.addSource('pano-projects-source', {
    type: 'geojson',
    data: filteredIndex,
    promoteId: 'id',
  });

  // Fill — color depends on public vs private-unlocked
  map.addLayer({
    id: 'pano-projects-fill',
    type: 'fill',
    source: 'pano-projects-source',
    layout: { visibility: 'none' },
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'unavailable'], false], '#884444', // offline → red-grey
        ['==', ['get', 'private'], true], '#4488ff',                      // private unlocked → blue
        '#888888',                                                          // public → grey
      ],
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'unavailable'], false], 0.18,
        ['boolean', ['feature-state', 'open'], false], 0.08,
        0.22,
      ],
    },
  });

  map.addLayer({
    id: 'pano-projects-outline',
    type: 'line',
    source: 'pano-projects-source',
    layout: { visibility: 'none' },
    paint: {
      'line-color': [
        'case',
        ['boolean', ['feature-state', 'unavailable'], false], '#aa4444', // offline → red-grey
        ['==', ['get', 'private'], true], '#2266dd',                       // private unlocked → blue
        '#555555',                                                           // public → grey
      ],
      'line-width': 1.5,
      'line-opacity': [
        'case',
        ['boolean', ['feature-state', 'unavailable'], false], 0.6,
        ['boolean', ['feature-state', 'open'], false], 0.35,
        0.85,
      ],
    },
  });

  // ── Hover popup ──────────────────────────────────────────────────────────────
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
    const f     = hoverFeatures[hoverIndex];
    const p     = f.properties;
    const total = hoverFeatures.length;

    // Check feature state for unavailable (requires querying rendered features)
    const renderedF = map.queryRenderedFeatures(
      { layers: ['pano-projects-fill'] }
    ).find(rf => rf.properties.id === p.id);
    const isUnavailable = renderedF?.state?.unavailable === true;

    const privateBadge = isUnavailable
      ? `<span style="background:#4a1a1a;color:#ff8888;font-size:9px;padding:1px 5px;border-radius:2px;margin-left:4px;">UNAVAILABLE</span>`
      : p.private
        ? `<span style="background:#1a3a7a;color:#88aaff;font-size:9px;padding:1px 5px;border-radius:2px;margin-left:4px;">PRIVATE</span>`
        : '';

    const nav = total > 1 ? `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;border-top:1px solid #444;padding-top:6px;">
        <button id="pano-hover-prev" style="background:none;border:1px solid #666;color:#ccc;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px;">◀</button>
        <span style="color:#aaa;font-size:11px;">${hoverIndex + 1} / ${total}</span>
        <button id="pano-hover-next" style="background:none;border:1px solid #666;color:#ccc;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px;">▶</button>
      </div>` : '';

    hoverPopupEl.innerHTML = `
      <div style="font-weight:bold;font-size:13px;margin-bottom:4px;">${p.name || p.id}${privateBadge}</div>
      ${p.town        ? `<div style="color:#aaa;">${p.town}</div>` : ''}
      ${p.owner       ? `<div style="color:#aaa;">${p.owner}</div>` : ''}
      ${p.date        ? `<div style="color:#aaa;margin-top:2px;">${p.date}</div>` : ''}
      <div style="margin-top:4px;color:#ccc;">${(p.image_count || 0).toLocaleString()} images</div>
      ${p.description ? `<div style="margin-top:4px;color:#bbb;font-style:italic;">${p.description}</div>` : ''}
      ${nav}
    `;

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
    const mapEl = document.getElementById('map');
    const rect  = mapEl.getBoundingClientRect();
    const popW  = 270;
    let left = point.x + 14;
    let top  = point.y - 10;
    if (left + popW > rect.width) left = point.x - popW - 14;
    hoverPopupEl.style.left    = `${left}px`;
    hoverPopupEl.style.top     = `${top}px`;
    hoverPopupEl.style.display = 'block';
  }

  hoverPopupEl = createHoverPopup();

  map.on('mousemove', 'pano-projects-fill', (e) => {
    map.getCanvas().style.cursor = 'pointer';
    const features = map.queryRenderedFeatures(e.point, { layers: ['pano-projects-fill'] });
    features.sort((a, b) => (b.properties.date || '').localeCompare(a.properties.date || ''));
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

  // ── Close button at centroid ─────────────────────────────────────────────────
  function getCentroid(feature) {
    const p = feature.properties;
    if (p.centroid) {
      try {
        const c = typeof p.centroid === 'string' ? JSON.parse(p.centroid) : p.centroid;
        if (Array.isArray(c) && c.length === 2) return c;
      } catch (_) {}
    }
    const coords = feature.geometry.coordinates[0];
    const lon = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
    return [lon, lat];
  }

  function createCloseButton(projectId, lngLat) {
    const point = map.project(lngLat);
    const el    = document.createElement('div');
    el.className         = 'pano-project-close-btn';
    el.dataset.projectId = projectId;
    el.style.cssText     = `
      position: absolute;
      left: ${point.x}px;
      top: ${point.y}px;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #444;
      border: 2px solid #ccc;
      color: #fff;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 950;
      transform: translate(-50%, -50%);
      box-shadow: 0 1px 5px rgba(0,0,0,0.55);
      user-select: none;
    `;
    el.innerHTML = '⊗';
    el.title     = 'Close project';

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      closeProject(projectId);
    });

    function reposition() {
      const p       = map.project(lngLat);
      el.style.left = `${p.x}px`;
      el.style.top  = `${p.y}px`;
    }
    map.on('move', reposition);
    el._removeReposition = () => map.off('move', reposition);

    document.getElementById('map').appendChild(el);
    return el;
  }

  // ── Open project ─────────────────────────────────────────────────────────────
  async function openProject(feature) {
    const props     = feature.properties;
    const projectId = props.id;

    if (openProjects.has(projectId)) return;

    map.setFeatureState(
      { source: 'pano-projects-source', id: projectId },
      { open: true }
    );

    const dataUrl = `${props.data_url}?nocache=${Date.now()}`;
    let projectData;
    try {
      const res = await fetch(dataUrl);

      // ── 402: project offline (owner account lapsed) ───────────────────────
      if (res.status === 402) {
        map.setFeatureState(
          { source: 'pano-projects-source', id: projectId },
          { open: false, unavailable: true }
        );
        showUnavailablePopup(feature);
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      projectData = await res.json();
    } catch (err) {
      console.error(`[pano-projects] Failed to load dots for ${projectId}:`, err);
      map.setFeatureState({ source: 'pano-projects-source', id: projectId }, { open: false });
      return;
    }

    const dotSourceId = `pano-dots-source-${projectId}`;
    const dotLayerId  = `pano-dots-${projectId}`;
    const features    = projectData.features || [];

    map.addSource(dotSourceId, { type: 'geojson', data: projectData, promoteId: 'key' });

    map.addLayer({
      id: dotLayerId,
      type: 'circle',
      source: dotSourceId,
      paint: {
        'circle-radius':       ['case', ['boolean', ['feature-state', 'viewed'], false], 10, 6],
        'circle-color':        ['case', ['boolean', ['feature-state', 'viewed'], false], '#FFFF00', '#00ffff'],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-opacity':      ['case', ['boolean', ['feature-state', 'viewed'], false], 0.9, 0.75],
        'circle-pitch-scale':  'map',
      },
    });

    const centroidLngLat = getCentroid(feature);
    const closeBtnEl     = createCloseButton(projectId, centroidLngLat);

    openProjects.set(projectId, { dotSourceId, dotLayerId, closeBtnEl, features });
    window.openPanoProjectId = projectId;

    map.on('click', dotLayerId, (e) => {
      const f = e.features[0];
      if (!f) return;
      e.originalEvent._panoHandled = true;

      const key   = f.properties.key;
      const index = features.findIndex(feat => feat.properties.key === key);

      if (typeof openProjectPanoModal === 'function') {
        openProjectPanoModal(features, index !== -1 ? index : 0);
      } else {
        console.warn('[pano-projects] openProjectPanoModal not available');
      }

      map.setFeatureState({ source: dotSourceId, id: key }, { viewed: true });
      setTimeout(() => {
        if (map.getSource(dotSourceId)) {
          map.setFeatureState({ source: dotSourceId, id: key }, { viewed: false });
        }
      }, 12000);
    });

    map.on('mouseenter', dotLayerId, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', dotLayerId, () => { map.getCanvas().style.cursor = ''; });
  }

  // ── Close project ────────────────────────────────────────────────────────────
  function closeProject(projectId) {
    if (!openProjects.has(projectId)) return;
    const { dotSourceId, dotLayerId, closeBtnEl } = openProjects.get(projectId);

    if (map.getLayer(dotLayerId))   map.removeLayer(dotLayerId);
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
    if (window.openPanoProjectId === projectId) window.openPanoProjectId = null;
  }

  // ── Click hull → open project ────────────────────────────────────────────────
  map.on('click', 'pano-projects-fill', (e) => {
    if (e.originalEvent._panoHandled) return;
    const features = map.queryRenderedFeatures(e.point, { layers: ['pano-projects-fill'] });
    for (const f of features) openProject(f);
  });

  // ── Unavailable popup (402 / account lapsed) ────────────────────────────────
  function showUnavailablePopup(feature) {
    const p    = feature.properties;
    const name = p.name || p.id;

    // Position popup at centroid
    const centroid = getCentroid(feature);
    const point    = map.project(centroid);

    if (!hoverPopupEl) return;

    hoverPopupEl.innerHTML = `
      <div style="font-weight:bold;font-size:13px;margin-bottom:4px;color:#ff8888;">
        ⚠ ${name}
      </div>
      <div style="color:#cc8888;font-size:11px;line-height:1.5;">
        This project is currently unavailable.<br>
        The account may be past due or cancelled.
      </div>
    `;
    hoverPopupEl.style.pointerEvents = 'none';

    const mapEl = document.getElementById('map');
    const rect  = mapEl.getBoundingClientRect();
    const popW  = 270;
    let left = point.x + 14;
    let top  = point.y - 10;
    if (left + popW > rect.width) left = point.x - popW - 14;
    hoverPopupEl.style.left    = `${left}px`;
    hoverPopupEl.style.top     = `${top}px`;
    hoverPopupEl.style.display = 'block';

    // Auto-hide after 4 seconds
    setTimeout(() => {
      if (hoverPopupEl) hoverPopupEl.style.display = 'none';
    }, 4000);
  }

  console.log(`[pano-projects] Loaded ${visibleFeatures.length} of ${indexData.features.length} project(s).`);

})();
