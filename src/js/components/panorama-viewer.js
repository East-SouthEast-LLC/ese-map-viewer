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

function openPanoModal(currentIndex) {
  if (currentIndex < 0 || currentIndex >= window.panoramaOrder.length) return;
  const filename = window.panoramaOrder[currentIndex];
  window.lastViewedPanoId = filename;
  trackEvent("view_panorama", { pano_id: filename });

  // Get the full image URL — R2 for new images, Squarespace fallback for old
  const imageUrl = window.panoramaData?.[filename]?.url || `https://www.ese-llc.com/s/${filename}`;
  console.log("Loading panorama:", filename, "from:", imageUrl);

  // Build the modal
  const modal = document.createElement("div");
  modal.id = "pano-modal";
  modal.style.cssText =
    "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7); z-index: 2000; display: flex; justify-content: center; align-items: center;";

  const iframeContainer = document.createElement("div");
  iframeContainer.style.cssText =
    "position: relative; width: 90%; height: 90%; background: #000;";

  // Pannellum renders into this div instead of an iframe
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

  // Build Pannellum config with quaternion correction if available
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

  // Initialize Pannellum directly in the modal div
  pannellumViewer = pannellum.viewer('pannellum-container', config);
}

function initializePanoramaViewer() {
  // Warm up the CORS preflight to R2 before any panorama is clicked.
  // This ensures the browser has a cached preflight response ready,
  // preventing the first image load from losing the preflight race.
  fetch('https://pub-d8f97cda49514ea882c5f06ffdb4a86b.r2.dev/', { method: 'HEAD', mode: 'cors' })
    .catch(() => {}); // silent — we don't care about the result

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
