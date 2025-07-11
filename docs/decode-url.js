// docs/decode-url.js

function applyUrlParams(map) {
    const urlParams = new URLSearchParams(window.location.search);
    const hasParams = urlParams.has('zoom') || urlParams.has('lat') || urlParams.has('layers');

    if (!hasParams) {
        return; 
    }

    const zoom = parseFloat(urlParams.get('zoom'));
    if (!isNaN(zoom)) {
        map.setZoom(zoom);
    }

    const lat = parseFloat(urlParams.get('lat'));
    const lng = parseFloat(urlParams.get('lng'));
    if (!isNaN(lat) && !isNaN(lng)) {
        if (typeof dropPinAtCenter === 'function') {
            window.marker = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);
            if(window.markerCoordinates) {
                window.markerCoordinates.lat = lat;
                window.markerCoordinates.lng = lng;
            }
        }
        map.setCenter([lng, lat]);
    }

    const layers = urlParams.get('layers')?.split(',') || [];
    
    function setDependentLayersVisibility(layerId, visibility) {
        const dependentLayers = {
            'floodplain': ['LiMWA', 'floodplain-line', 'floodplain-labels'],
            'DEP wetland': ['dep-wetland-line', 'dep-wetland-labels'],
            'soils': ['soils-labels', 'soils-outline'],
            'zone II': ['zone-ii-outline', 'zone-ii-labels'],
            'endangered species': ['endangered-species-labels', 'vernal-pools', 'vernal-pools-labels'],
            'sewer plans': ['sewer-plans-outline'],
            'lidar contours': ['lidar-contour-labels']
        };

        if (dependentLayers[layerId]) {
            dependentLayers[layerId].forEach(depId => {
                if (map.getLayer(depId)) {
                    map.setLayoutProperty(depId, 'visibility', visibility);
                } else {
                }
            });
        }
    }

    layers.forEach(layerId => {
        const decodedLayerId = decodeURIComponent(layerId);
        
        // special case for usgs quad layer
        if (decodedLayerId === 'usgs quad') {
            if (typeof initializeUsgsTileManager === 'function') {
                initializeUsgsTileManager();
                // also activate the button
                const usgsButton = document.querySelector('[data-layer-id="usgs quad"]');
                if (usgsButton) {
                    usgsButton.classList.add('active');
                }
            } else {
                console.warn("initializeUsgsTileManager function not found.");
            }
            return; // continue to the next layer
        }

        if (map.getLayer(decodedLayerId)) {
            map.setLayoutProperty(decodedLayerId, 'visibility', 'visible');
            setDependentLayersVisibility(decodedLayerId, 'visible');
            document.querySelectorAll('#menu a').forEach(button => {
                if (button.dataset.layerId === decodedLayerId) {
                    button.classList.add('active');
                }
            });
        } else {
            console.warn(`[URL] Layer "${decodedLayerId}" not found in the map style.`);
        }
    });

    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
}