// src/js/components/panorama-viewer.js

let pannellumViewer = null;

function quaternionToEuler(q) {
    const { w, x, y, z } = q;
    const sinr_cosp = 2 * (w * x + y * z);
    const cosr_cosp = 1 - 2 * (x * x + y * y);
    const roll = Math.atan2(sinr_cosp, cosr_cosp) * (180 / Math.PI);
    const sinp = 2 * (w * y - z * x);
    const pitch = Math.abs(sinp) >= 1
        ? (Math.sign(sinp) * Math.PI / 2) * (180 / Math.PI)
        : Math.asin(sinp) * (180 / Math.PI);
    return { roll, pitch };
}

function navigateToPano(newIndex) {
  const existingModal = document.getElementById("pano-modal");
  if (existingModal) {
    if (pannellumViewer) {
      pannellumViewer.destroy();
      pannellumViewer = null;
    }
    document.body.removeChild(existingModal);
  }
  openPanoModal(newIndex);
}

function highlightViewedPano(panoId) {
  if (panoId && map.getSource("panoramas-source")) {
    map.setFeatureState(
      { source: "panoramas-source", id: panoId },
      { viewed: true }
    );
    setTimeout(() => {
      map.setFeatureState(
        { source: "panoramas-source", id: panoId },
        { viewed: false }
      );
    }, 12000);
  }
}

async function openPanoModal(currentIndex) {
  if (currentIndex < 0 || currentIndex >= window.panoramaOrder.length) return;

  await window.panoramaDataReady;

  const filename = window.panoramaOrder[currentIndex];
  window.lastViewedPanoId = filename;
  trackEvent("view_panorama", { pano_id: filename });

  const squarespaceUrl = `https://www.ese-llc.com/s/${filename}`;
  const r2Url = window.panoramaData?.[filename]?.url || squarespaceUrl;
  const imageUrl = (window.panoSource === 'squarespace') ? squarespaceUrl : r2Url;
  console.log("Loading panorama:", filename, "from:", imageUrl);

  const modal = document.createElement("div");
  modal.id = "pano-modal";
  modal.style.cssText =
    "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7); z-index: 2000; display: flex; justify-content: center; align-items: center;";

  const iframeContainer = document.createElement("div");
  iframeContainer.style.cssText =
    "position: relative; width: 90%; height: 90%; background: #000;";

  const pannellumContainer = document.createElement("div");
  pannellumContainer.id = "pannellum-container";
  pannellumContainer.style.cssText = "width: 100%; height: 100%;";

  const arrowBtnStyle = `position: absolute; top: 50%; transform: translateY(-50%); background-color: rgba(0,0,0,0.5); color: white; border: none; font-size: 30px; cursor: pointer; padding: 10px; z-index: 10;`;

  const prevBtn = document.createElement("button");
  prevBtn.innerHTML = "&lt;";
  prevBtn.style.cssText = arrowBtnStyle + "left: 10px;";
  prevBtn.onclick = function (event) {
    event.preventDefault();
    event.stopPropagation();
    const newIndex = (currentIndex - 1 + window.panoramaOrder.length) % window.panoramaOrder.length;
    navigateToPano(newIndex);
  };

  const nextBtn = document.createElement("button");
  nextBtn.innerHTML = "&gt;";
  nextBtn.style.cssText = arrowBtnStyle + "right: 10px;";
  nextBtn.onclick = function (event) {
    event.preventDefault();
    event.stopPropagation();
    const newIndex = (currentIndex + 1) % window.panoramaOrder.length;
    navigateToPano(newIndex);
  };

  const closeBtn = document.createElement("button");
  closeBtn.innerText = "X";
  closeBtn.style.cssText = `position: absolute; top: 10px; right: 10px; z-index: 10; background: white; border: none; font-size: 20px; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;`;
  closeBtn.onclick = function () {
    if (pannellumViewer) {
      pannellumViewer.destroy();
      pannellumViewer = null;
    }
    document.body.removeChild(modal);
    highlightViewedPano(window.lastViewedPanoId);
  };

  iframeContainer.appendChild(pannellumContainer);
  iframeContainer.appendChild(prevBtn);
  iframeContainer.appendChild(nextBtn);
  iframeContainer.appendChild(closeBtn);
  modal.appendChild(iframeContainer);
  document.body.appendChild(modal);

  const panoEntry = window.panoramaData?.[filename];
  const config = {
    type: "equirectangular",
    panorama: imageUrl,
    autoLoad: true,
    showControls: true,
    title: filename,
  };

  if (panoEntry?.orientation) {
    const euler = quaternionToEuler(panoEntry.orientation);
    config.horizonPitch = -euler.pitch;
    config.horizonRoll = euler.roll;
    console.log(`Applying correction for ${filename}:`, euler);
  } else {
    console.warn(`No orientation data for ${filename}`);
  }

  pannellumViewer = pannellum.viewer('pannellum-container', config);
}

// ── Project panorama viewer ───────────────────────────────────────────────────
// Self-contained viewer for project dots loaded from pano_data.geojson.
// Takes an array of GeoJSON features and the current index.
// Prev/next navigate within the project only.

function openProjectPanoModal(features, currentIndex) {
  if (!features?.length || currentIndex < 0 || currentIndex >= features.length) return;

  // Remove any existing modal
  const existingModal = document.getElementById("pano-modal");
  if (existingModal) {
    if (pannellumViewer) {
      pannellumViewer.destroy();
      pannellumViewer = null;
    }
    document.body.removeChild(existingModal);
  }

  const props    = features[currentIndex].properties;
  const filename = props.key;
  const imageUrl = props.url;

  if (!imageUrl) {
    console.warn('[pano-projects] No URL for feature:', filename);
    return;
  }

  console.log('Loading project panorama:', filename, 'from:', imageUrl);

  // ── Build modal ────────────────────────────────────────────────────────────
  const modal = document.createElement('div');
  modal.id = 'pano-modal';
  modal.style.cssText =
    'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7); z-index: 2000; display: flex; justify-content: center; align-items: center;';

  const container = document.createElement('div');
  container.style.cssText =
    'position: relative; width: 90%; height: 90%; background: #000;';

  const pannellumContainer = document.createElement('div');
  pannellumContainer.id = 'pannellum-container';
  pannellumContainer.style.cssText = 'width: 100%; height: 100%;';

  const arrowBtnStyle = `position: absolute; top: 50%; transform: translateY(-50%); background-color: rgba(0,0,0,0.5); color: white; border: none; font-size: 30px; cursor: pointer; padding: 10px; z-index: 10;`;

  const prevBtn = document.createElement('button');
  prevBtn.innerHTML = '&lt;';
  prevBtn.style.cssText = arrowBtnStyle + 'left: 10px;';
  prevBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newIndex = (currentIndex - 1 + features.length) % features.length;
    openProjectPanoModal(features, newIndex);
  };

  const nextBtn = document.createElement('button');
  nextBtn.innerHTML = '&gt;';
  nextBtn.style.cssText = arrowBtnStyle + 'right: 10px;';
  nextBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newIndex = (currentIndex + 1) % features.length;
    openProjectPanoModal(features, newIndex);
  };

  // Image counter
  const counter = document.createElement('div');
  counter.style.cssText = `
    position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%);
    background: rgba(0,0,0,0.5); color: #ccc; font-size: 12px;
    font-family: sans-serif; padding: 3px 10px; border-radius: 10px; z-index: 10;
  `;
  counter.textContent = `${currentIndex + 1} / ${features.length}`;

  const closeBtn = document.createElement('button');
  closeBtn.innerText = 'X';
  closeBtn.style.cssText = `position: absolute; top: 10px; right: 10px; z-index: 10; background: white; border: none; font-size: 20px; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;`;
  closeBtn.onclick = () => {
    if (pannellumViewer) {
      pannellumViewer.destroy();
      pannellumViewer = null;
    }
    document.body.removeChild(modal);
  };

  container.appendChild(pannellumContainer);
  container.appendChild(prevBtn);
  container.appendChild(nextBtn);
  container.appendChild(counter);
  container.appendChild(closeBtn);
  modal.appendChild(container);
  document.body.appendChild(modal);

  // ── Pannellum config ───────────────────────────────────────────────────────
  const config = {
    type: 'equirectangular',
    panorama: imageUrl,
    autoLoad: true,
    showControls: true,
    title: filename,
  };

  // Orientation from properties (stored as JSON string in GeoJSON properties)
  try {
    const orientation = typeof props.orientation === 'string'
      ? JSON.parse(props.orientation)
      : props.orientation;

    if (orientation) {
      const euler = quaternionToEuler(orientation);
      config.horizonPitch = -euler.pitch;
      config.horizonRoll  = euler.roll;
      console.log(`Applying correction for ${filename}:`, euler);
    }
  } catch (_) {
    console.warn(`Could not parse orientation for ${filename}`);
  }

  pannellumViewer = pannellum.viewer('pannellum-container', config);
}

// ── Legacy layer init ─────────────────────────────────────────────────────────
function initializePanoramaViewer() {
  map.on("click", "panoramas", function (e) {
    if (e.features.length > 0) {
      const feature = e.features[0];
      const currentIndex = window.panoramaOrder.indexOf(feature.id);
      if (currentIndex !== -1) {
        openPanoModal(currentIndex);
      }
    }
  });
}
