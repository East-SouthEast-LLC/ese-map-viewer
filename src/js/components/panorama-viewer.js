// src/js/components/panorama-viewer.js

function navigateToPano(newIndex) {
    const existingModal = document.getElementById('pano-modal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    openPanoModal(newIndex);
}

function preloadPanoImages(currentIndex) {
    if (!window.panoramaOrder || window.panoramaOrder.length === 0) return;
    const totalPanos = window.panoramaOrder.length;
    const nextIndex = (currentIndex + 1) % totalPanos;
    const prevIndex = (currentIndex - 1 + totalPanos) % totalPanos;
    const nextPanoFile = window.panoramaOrder[nextIndex];
    const prevPanoFile = window.panoramaOrder[prevIndex];
    const nextImage = new Image();
    nextImage.src = `https://www.ese-llc.com/s/${nextPanoFile}`;
    const prevImage = new Image();
    prevImage.src = `https://www.ese-llc.com/s/${prevPanoFile}`;
}

function highlightViewedPano(panoId) {
    if (panoId && map.getSource('panoramas-source')) {
        map.setFeatureState({ source: 'panoramas-source', id: panoId }, { viewed: true });
        setTimeout(() => {
            map.setFeatureState({ source: 'panoramas-source', id: panoId }, { viewed: false });
        }, 12000);
    }
}

function openPanoModal(currentIndex) {
    if (currentIndex < 0 || currentIndex >= window.panoramaOrder.length) return;
    const filename = window.panoramaOrder[currentIndex];
    window.lastViewedPanoId = filename; 
    trackEvent('view_panorama', { pano_id: filename });
    const panoViewerUrl = `https://www.ese-llc.com/pano-viewer?pano=${filename}`;
    const modal = document.createElement('div');
    modal.id = 'pano-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7); z-index: 2000; display: flex; justify-content: center; align-items: center;';
    const iframeContainer = document.createElement('div');
    iframeContainer.style.cssText = 'position: relative; width: 90%; height: 90%; background: #000;';
    const iframe = document.createElement('iframe');
    iframe.src = panoViewerUrl;
    iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
    const arrowBtnStyle = `position: absolute; top: 50%; transform: translateY(-50%); background-color: rgba(0,0,0,0.5); color: white; border: none; font-size: 30px; cursor: pointer; padding: 10px; z-index: 10;`;
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '&lt;';
    prevBtn.style.cssText = arrowBtnStyle + 'left: 10px;';
    prevBtn.onclick = function(event) {
        event.preventDefault();
        event.stopPropagation();
        const newIndex = (currentIndex - 1 + window.panoramaOrder.length) % window.panoramaOrder.length;
        navigateToPano(newIndex);
    };
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '&gt;';
    nextBtn.style.cssText = arrowBtnStyle + 'right: 10px;';
    nextBtn.onclick = function(event) {
        event.preventDefault();
        event.stopPropagation();
        const newIndex = (currentIndex + 1) % window.panoramaOrder.length;
        navigateToPano(newIndex);
    };
    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'X';
    closeBtn.style.cssText = `position: absolute; top: 10px; right: 10px; z-index: 10; background: white; border: none; font-size: 20px; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;`;
    closeBtn.onclick = function() {
        document.body.removeChild(modal);
        highlightViewedPano(window.lastViewedPanoId);
    };
    iframeContainer.appendChild(iframe);
    iframeContainer.appendChild(prevBtn);
    iframeContainer.appendChild(nextBtn);
    iframeContainer.appendChild(closeBtn);
    modal.appendChild(iframeContainer);
    document.body.appendChild(modal);
    preloadPanoImages(currentIndex);
}

function initializePanoramaViewer() {
    map.on('click', 'panoramas', function(e) {
        if (e.features.length > 0) {
            const feature = e.features[0];
            const currentIndex = window.panoramaOrder.indexOf(feature.id);
            if (currentIndex !== -1) {
                openPanoModal(currentIndex);
            }
        }
    });
}