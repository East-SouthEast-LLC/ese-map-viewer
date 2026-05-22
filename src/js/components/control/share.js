// src/js/components/control/share.js

const WORKER_URL = 'https://pano-upload-worker.ese-llc.workers.dev';

function obtainZoom() {
    return map.getZoom();
}

async function generateShareLink(map, zoomLevel, coords, layerIds) {
    const baseUrl = window.eseMapBaseUrl || (window.location.origin + window.location.pathname);

    const usgsButton = document.querySelector('[data-layer-id="usgs quad"]');
    if (usgsButton && usgsButton.classList.contains('active')) {
        if (!layerIds.includes('usgs quad')) {
            layerIds.push('usgs quad');
        }
    }

    if (!coords) {
        console.error("Coordinates are missing for generating share link.");
        return `${baseUrl}?error=missing_coords`;
    }

    // Round for cleaner URLs — 2 decimals for zoom, 6 for lat/lng (~10cm precision)
    const zoom = parseFloat(zoomLevel.toFixed(2));
    const lat  = parseFloat(coords.lat.toFixed(6));
    const lng  = parseFloat(coords.lng.toFixed(6));

    let encodedLayerIds = layerIds.map(layerId => encodeURIComponent(layerId));
    let shareUrl = `${baseUrl}?zoom=${zoom}&lat=${lat}&lng=${lng}&layers=${encodedLayerIds.join(',')}`;

    // ── Project-aware sharing ────────────────────────────────────────────────
    const openProjectId = window.openPanoProjectId;

    if (openProjectId) {
        // Find the feature to check if it's private
        const feature = window.panoProjectIndex?.features?.find(f => f.properties.id === openProjectId);
        const isPrivate = feature?.properties?.private;

        if (isPrivate) {
            // Private project — mint a short token via the Worker
            const accessCode = window.panoAccessCode?.code;
            if (accessCode) {
                try {
                    const session = (await window.supabase?.auth?.getSession())?.data?.session;
                    const jwt = session?.access_token;

                    const res = await fetch(`${WORKER_URL}/s/mint`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {}),
                        },
                        body: JSON.stringify({
                            project_id:  openProjectId,
                            access_code: accessCode,
                        }),
                    });

                    if (res.ok) {
                        const { url: shortUrl } = await res.json();
                        // Return the short token URL — map position is lost intentionally
                        // (recipient will fly to project centroid on load)
                        return shortUrl;
                    } else {
                        console.warn('[share] Token mint failed, falling back to code-in-URL');
                    }
                } catch (err) {
                    console.warn('[share] Token mint error:', err);
                }
            }

            // Fallback: include code directly if mint fails
            if (window.panoAccessCode && window.panoAccessCode.scope !== 'master') {
                shareUrl += `&code=${encodeURIComponent(window.panoAccessCode.code)}`;
            }
        }

        // Public or fallback — append project ID so recipient flies to it on load
        shareUrl += `&project=${encodeURIComponent(openProjectId)}`;

    } else {
        // No open project — include access code if active (non-master)
        if (window.panoAccessCode && window.panoAccessCode.scope !== 'master') {
            shareUrl += `&code=${encodeURIComponent(window.panoAccessCode.code)}`;
        }
    }

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

document.getElementById('shareButton').addEventListener('click', async function() {
    trackEvent('share_map', {});

    if (window.marker) {
        map.flyTo({ center: window.marker.getLngLat(), essential: true });
    }

    let currentMarkerCoordinates = dropPinAtCenter();
    let zoomLevel = obtainZoom();
    let visibleLayerIds = listVisibleLayers(map, window.toggleableLayerIds.filter(id => id !== 'tools'));
    let shareLink = await generateShareLink(map, zoomLevel, currentMarkerCoordinates, visibleLayerIds);

    showSharePopup(shareLink);
});
