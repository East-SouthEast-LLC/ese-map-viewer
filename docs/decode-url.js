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
    
    layers.forEach(layerId => {
        const decodedLayerId = decodeURIComponent(layerId);

        // Special case for USGS layer
        if (decodedLayerId === 'usgs') {
            if (typeof initializeUsgsTileManager === 'function') {
                initializeUsgsTileManager();
            }
        } else if (map.getLayer(decodedLayerId)) {
            // Standard layer handling
            map.setLayoutProperty(decodedLayerId, 'visibility', 'visible');

            // Handle dependent layers
            if (decodedLayerId === 'floodplain') {
                map.setLayoutProperty('LiMWA', 'visibility', 'visible');
                map.setLayoutProperty('floodplain-line', 'visibility', 'visible');
                map.setLayoutProperty('floodplain-labels', 'visibility', 'visible');
            } else if (decodedLayerId === 'DEP wetland') {
                map.setLayoutProperty('dep-wetland-line', 'visibility', 'visible');
                map.setLayoutProperty('dep-wetland-labels', 'visibility', 'visible');
            } else if (decodedLayerId === 'soils') {
                map.setLayoutProperty('soils-labels', 'visibility', 'visible');
                map.setLayoutProperty('soils-outline', 'visibility', 'visible');
            } else if (decodedLayerId === 'zone II') {
                map.setLayoutProperty('zone-ii-outline', 'visibility', 'visible');
                map.setLayoutProperty('zone-ii-labels', 'visibility', 'visible');
            } else if (decodedLayerId === 'endangered species') {
                map.setLayoutProperty('endangered-species-labels', 'visibility', 'visible');
                map.setLayoutProperty('vernal-pools', 'visibility', 'visible');
                map.setLayoutProperty('vernal-pools-labels', 'visibility', 'visible');
            }
        } else {
            console.warn(`[URL] Layer "${decodedLayerId}" not found in the map style.`);
        }

        // Update button to be active for all layer types
        document.querySelectorAll('#menu a').forEach(button => {
            if (button.dataset.layerId === decodedLayerId) {
                button.classList.add('active');
            }
        });
    });

    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
}