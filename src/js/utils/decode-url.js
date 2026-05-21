// src/js/utils/decode-url.js

const SUPABASE_URL  = 'https://ayktuzidcoolddlphqia.supabase.co';
const SUPABASE_ANON = 'sb_publishable_B49zBvkMVuRCw2u9cbBJaQ_HrlrgdBL';
const MASTER_CODE   = 'ESEMASTER'; // never stored in DB — change to your actual master code

// ── Access code promise ────────────────────────────────────────────────────────
// pano-projects.js creates this promise before decode-url runs.
// We resolve it here once we know the code status.
async function resolveAccessCode() {
  const urlParams = new URLSearchParams(window.location.search);
  const codeFromUrl = urlParams.get('code');
  const codeFromStorage = localStorage.getItem('panoAccessCode');
  const candidate = codeFromUrl || codeFromStorage;

  if (!candidate) {
    window.panoAccessCode = null;
    window._resolvePanoAccessCode?.(null);
    return;
  }

  // Master code — never hits the DB
  if (candidate === MASTER_CODE) {
    window.panoAccessCode = { code: candidate, scope: 'master', project_id: null };
    localStorage.setItem('panoAccessCode', candidate);
    window._resolvePanoAccessCode?.(window.panoAccessCode);
    return;
  }

  // Validate against Supabase
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/access_codes?code=eq.${encodeURIComponent(candidate)}&select=*&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_ANON,
          'Authorization': `Bearer ${SUPABASE_ANON}`,
        }
      }
    );

    const rows = await res.json();
    const row  = rows?.[0];

    if (!row) {
      // Code not found — clear storage
      console.warn('[access-code] Code not found:', candidate);
      localStorage.removeItem('panoAccessCode');
      window.panoAccessCode = null;
      window._resolvePanoAccessCode?.(null);
      return;
    }

    // Check use limit
    if (row.max_uses !== null && row.use_count >= row.max_uses) {
      console.warn('[access-code] Code exhausted:', candidate);
      localStorage.removeItem('panoAccessCode');
      window.panoAccessCode = null;
      window._resolvePanoAccessCode?.(null);
      return;
    }

    // Check expiry
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      console.warn('[access-code] Code expired:', candidate);
      localStorage.removeItem('panoAccessCode');
      window.panoAccessCode = null;
      window._resolvePanoAccessCode?.(null);
      return;
    }

    // Valid — increment use_count if came from URL (new use)
    if (codeFromUrl) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/access_codes?id=eq.${row.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON,
            'Authorization': `Bearer ${SUPABASE_ANON}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ use_count: row.use_count + 1 }),
        }
      );
    }

    window.panoAccessCode = row;
    localStorage.setItem('panoAccessCode', candidate);
    window._resolvePanoAccessCode?.(row);

  } catch (err) {
    console.error('[access-code] Validation error:', err);
    window.panoAccessCode = null;
    window._resolvePanoAccessCode?.(null);
  }
}

// ── Main applyUrlParams ────────────────────────────────────────────────────────
function applyUrlParams(map) {
  const urlParams = new URLSearchParams(window.location.search);
  const hasParams = urlParams.has('zoom') || urlParams.has('lat') || urlParams.has('layers') || urlParams.has('code');

  // Always resolve access code (even if no other params)
  resolveAccessCode();

  if (!urlParams.has('zoom') && !urlParams.has('lat') && !urlParams.has('layers')) {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    return;
  }

  const zoom = parseFloat(urlParams.get('zoom'));
  if (!isNaN(zoom)) map.setZoom(zoom);

  const lat = parseFloat(urlParams.get('lat'));
  const lng = parseFloat(urlParams.get('lng'));
  if (!isNaN(lat) && !isNaN(lng)) {
    window.marker = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);
    if (window.markerCoordinates) {
      window.markerCoordinates.lat = lat;
      window.markerCoordinates.lng = lng;
    }
    map.setCenter([lng, lat]);
  }

  const layers = urlParams.get('layers')?.split(',') || [];

  function setDependentLayersVisibility(layerId, visibility) {
    const dependentLayers = window.layerConfig
      .filter(layer => layer.dependencies && layer.dependencies.length > 0)
      .reduce((acc, layer) => {
        acc[layer.id] = layer.dependencies;
        return acc;
      }, {});
    if (dependentLayers[layerId]) {
      dependentLayers[layerId].forEach(depId => {
        if (map.getLayer(depId)) map.setLayoutProperty(depId, 'visibility', visibility);
      });
    }
  }

  layers.forEach(layerId => {
    const decodedLayerId = decodeURIComponent(layerId);

    if (decodedLayerId === 'usgs quad') {
      if (typeof initializeUsgsTileManager === 'function') {
        initializeUsgsTileManager();
        const usgsButton = document.querySelector('[data-layer-id="usgs quad"]');
        if (usgsButton) usgsButton.classList.add('active');
      } else {
        console.warn('initializeUsgsTileManager function not found.');
      }
      return;
    }

    if (decodedLayerId === 'panoramas') {
      window.panoramaDataReady.then(() => {
        if (map.getLayer('panoramas')) {
          map.setLayoutProperty('panoramas', 'visibility', 'visible');
          setDependentLayersVisibility('panoramas', 'visible');
          document.querySelectorAll('#menu a').forEach(button => {
            if (button.dataset.layerId === 'panoramas') button.classList.add('active');
          });
          const panoControls = document.getElementById('pano-controls');
          if (panoControls) panoControls.style.display = 'block';
        }
      });
      return;
    }

    // pano-projects layer — wait for access code resolution before toggling
    if (decodedLayerId === 'pano-projects') {
      window.panoAccessCodeReady.then(() => {
        if (map.getLayer('pano-projects-fill')) {
          map.setLayoutProperty('pano-projects-fill', 'visibility', 'visible');
          map.setLayoutProperty('pano-projects-outline', 'visibility', 'visible');
          setDependentLayersVisibility('pano-projects', 'visible');
          document.querySelectorAll('#menu a').forEach(button => {
            if (button.dataset.layerId === 'pano-projects') button.classList.add('active');
          });
        }
      });
      return;
    }

    if (map.getLayer(decodedLayerId)) {
      map.setLayoutProperty(decodedLayerId, 'visibility', 'visible');
      setDependentLayersVisibility(decodedLayerId, 'visible');
      document.querySelectorAll('#menu a').forEach(button => {
        if (button.dataset.layerId === decodedLayerId) button.classList.add('active');
      });
    } else {
      console.warn(`[URL] Layer "${decodedLayerId}" not found in the map style.`);
    }
  });

  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, cleanUrl);
}
