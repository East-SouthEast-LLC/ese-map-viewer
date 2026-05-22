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
  const codeFromStorage = sessionStorage.getItem('panoAccessCode');
  const candidate = codeFromUrl || codeFromStorage;

  if (!candidate) {
    window.panoAccessCode = null;
    window._resolvePanoAccessCode?.(null);
    return;
  }

  // Master code — never hits the DB
  if (candidate === MASTER_CODE) {
    window.panoAccessCode = { code: candidate, scope: 'master', project_id: null };
    sessionStorage.setItem('panoAccessCode', candidate);
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
      sessionStorage.removeItem('panoAccessCode');
      window.panoAccessCode = null;
      window._resolvePanoAccessCode?.(null);
      return;
    }

    // Check use limit
    if (row.max_uses !== null && row.use_count >= row.max_uses) {
      console.warn('[access-code] Code exhausted:', candidate);
      sessionStorage.removeItem('panoAccessCode');
      window.panoAccessCode = null;
      window._resolvePanoAccessCode?.(null);
      return;
    }

    // Check expiry
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      console.warn('[access-code] Code expired:', candidate);
      sessionStorage.removeItem('panoAccessCode');
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
    sessionStorage.setItem('panoAccessCode', candidate);
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

  // ── Project param — fly to + open project after index and access code ready ──
  const projectId = urlParams.get('project');
  if (projectId) {
    // Wait for both the access code and the project index to be available
    window.panoAccessCodeReady.then(() => {
      // pano-projects.js exposes openPanoProject and panoProjectIndex on window
      // but they may not be set yet if the layer isn't visible — poll briefly
      let attempts = 0;
      const tryOpen = setInterval(() => {
        attempts++;
        const feature = window.panoProjectIndex?.features?.find(
          f => f.properties.id === projectId
        );
        if (feature && typeof window.openPanoProject === 'function') {
          clearInterval(tryOpen);
          // Make the layer visible first if it isn't
          if (map.getLayer('pano-projects-fill')) {
            map.setLayoutProperty('pano-projects-fill', 'visibility', 'visible');
            map.setLayoutProperty('pano-projects-outline', 'visibility', 'visible');
            document.querySelectorAll('#menu a').forEach(btn => {
              if (btn.dataset.layerId === 'pano-projects') btn.classList.add('active');
            });
          }
          // Fly to centroid then open
          const coords = feature.properties.centroid
            ? (typeof feature.properties.centroid === 'string'
                ? JSON.parse(feature.properties.centroid)
                : feature.properties.centroid)
            : feature.geometry.coordinates[0].reduce(
                (acc, c) => [acc[0] + c[0], acc[1] + c[1]],
                [0, 0]
              ).map(v => v / feature.geometry.coordinates[0].length);

          map.flyTo({ center: coords, zoom: 17, essential: true });
          map.once('moveend', () => window.openPanoProject(feature));

        } else if (attempts > 40) {
          // Give up after ~4 seconds
          clearInterval(tryOpen);
          console.warn('[decode-url] Project not found or openPanoProject unavailable:', projectId);
        }
      }, 100);
    });
  }

  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, cleanUrl);
}
