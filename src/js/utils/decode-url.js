// src/js/utils/decode-url.js

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
        // dynamically generate the dependentLayers object from the global layerConfig
        const dependentLayers = window.layerConfig
            .filter(layer => layer.dependencies && layer.dependencies.length > 0)
            .reduce((acc, layer) => {
                acc[layer.id] = layer.dependencies;
                return acc;
            }, {});

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

        // Special case: panoramas layer may not be ready yet (async JSON fetch).
        // Wait for panoramaDataReady before setting visibility and showing controls.
        if (decodedLayerId === 'panoramas') {
            window.panoramaDataReady.then(() => {
                if (map.getLayer('panoramas')) {
                    map.setLayoutProperty('panoramas', 'visibility', 'visible');
                    setDependentLayersVisibility('panoramas', 'visible');
                    document.querySelectorAll('#menu a').forEach(button => {
                        if (button.dataset.layerId === 'panoramas') {
                            button.classList.add('active');
                        }
                    });
                    const panoControls = document.getElementById('pano-controls');
                    if (panoControls) panoControls.style.display = 'block';
                }
            });
            return; // handled above — skip generic logic below
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