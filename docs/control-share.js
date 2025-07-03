// docs/control-share.js

function obtainZoom() {
    return map.getZoom();
}

function generateShareLink(map, zoomLevel, coords, layerIds) {
    const baseUrl = window.eseMapBaseUrl || (window.location.origin + window.location.pathname);
    let encodedLayerIds = layerIds.map(layerId => encodeURIComponent(layerId));
    
    if (!coords) {
        console.error("Coordinates are missing for generating share link.");
        return `${baseUrl}?error=missing_coords`;
    }
    
    let shareUrl = `${baseUrl}?zoom=${zoomLevel}&lat=${coords.lat}&lng=${coords.lng}&layers=${encodedLayerIds.join(',')}`;
    return shareUrl;
}

function showSharePopup(shareLink) {
    let modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.top = "50%";
    modal.style.left = "50%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.padding = "20px";
    modal.style.background = "#fff";
    modal.style.boxShadow = "0px 4px 10px rgba(0,0,0,0.2)";
    modal.style.borderRadius = "10px";
    modal.style.textAlign = "center";
    modal.style.zIndex = "1000";

    let linkDisplay = document.createElement("input");
    linkDisplay.type = "text";
    linkDisplay.value = shareLink;
    linkDisplay.readOnly = true;
    linkDisplay.style.width = "100%";
    linkDisplay.style.marginBottom = "10px";
    linkDisplay.style.padding = "5px";

    let copyButton = document.createElement("button");
    copyButton.innerText = "Copy Link";
    copyButton.style.marginRight = "10px";
    copyButton.onclick = function () {
        navigator.clipboard.writeText(shareLink);
        document.body.removeChild(modal);
    };

    let closeButton = document.createElement("button");
    closeButton.innerText = "Close";
    closeButton.onclick = function () {
        document.body.removeChild(modal);
    };
    
    if (marker) {
        marker.remove();
        marker = null;
    }

    modal.appendChild(linkDisplay);
    modal.appendChild(copyButton);
    modal.appendChild(closeButton);
    document.body.appendChild(modal);
}

document.getElementById('shareButton').addEventListener('click', function() {
    if (window.marker) {
        map.flyTo({ center: window.marker.getLngLat(), essential: true });
    }

    let currentMarkerCoordinates = dropPinAtCenter();
    let zoomLevel = obtainZoom();

    // Get visible vector layers
    let visibleLayerIds = listVisibleLayers(map, window.toggleableLayerIds.filter(id => id !== 'tools'));

    // Manually check if the USGS layer is active and add it to the URL
    const usgsButton = document.querySelector('a[data-layer-id="usgs quad"]');
    if (usgsButton && usgsButton.classList.contains('active')) {
        if (!visibleLayerIds.includes('usgs quad')) {
            visibleLayerIds.push('usgs quad');
        }
    }
    
    let shareLink = generateShareLink(map, zoomLevel, currentMarkerCoordinates, visibleLayerIds);

    console.log("Share this link:", shareLink);
    showSharePopup(shareLink);
});