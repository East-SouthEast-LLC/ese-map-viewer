function setupToggleableMenu() {
    const geocoderContainer = document.getElementById("geocoder-container");
    
    // The initial sizing is now handled by our global resizeMap function
    // which is called from main-app.js after the menu is set up.

    if (window.toggleableLayerIds && window.toggleableLayerIds.length > 0) {
        for (const id of window.toggleableLayerIds) {
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = id;
            link.dataset.layerId = id;

            link.onclick = function(e) {
                const clickedLayer = this.dataset.layerId;
                e.preventDefault();
                e.stopPropagation();

                if (clickedLayer === "tools") {
                    if (getComputedStyle(geocoderContainer).display === "none") {
                        openToolkit();
                    } else {
                        geocoderContainer.style.display = "none";
                        this.classList.remove('active');
                        
                        // Also hide the bookmark box when closing the main toolkit
                        document.getElementById('bookmark-box').style.display = 'none';
                        document.getElementById('bookmarkButton').classList.remove('active');

                        mapContainer.style.width = `calc(95vw - ${menuOnlyOffset}px)`;
                        mapContainer.style.marginLeft = `${menuOnlyOffset}px`;
                        setTimeout(() => map.resize(), 400);
                    }
                    return;
                }

    function openToolkit() {
        if (getComputedStyle(geocoderContainer).display === "none") {
            geocoderContainer.style.display = "flex";
            const toolsButton = document.querySelector('[data-layer-id="tools"]');
            if(toolsButton) toolsButton.classList.add('active');
            
            document.getElementById('bookmark-box').style.display = 'none';
            document.getElementById('bookmarkButton').classList.remove('active');
            document.getElementById('identify-box').style.display = 'none'; // This is the new line
            document.getElementById('identifyButton').classList.remove('active');

            mapContainer.style.width = `calc(95vw - ${fullToolkitOffset}px)`;
            mapContainer.style.marginLeft = `${fullToolkitOffset}px`;
            setTimeout(() => map.resize(), 400);
        }
    }

                if (!map.getLayer(clickedLayer)) {
                    return console.warn("Layer not found:", clickedLayer);
                }

                const isVisible = map.getLayoutProperty(clickedLayer, 'visibility') === 'visible';
                const newVisibility = isVisible ? 'none' : 'visible';
                map.setLayoutProperty(clickedLayer, 'visibility', newVisibility);
                this.className = newVisibility === 'visible' ? 'active' : '';

                // Handle dependent layers
                if (clickedLayer === 'private properties upland') {
                    window.toggleUplandControls(newVisibility === 'visible');
                    if (newVisibility === 'visible') openToolkit();
                } else if (clickedLayer === 'floodplain') {
                    map.setLayoutProperty('LiMWA', 'visibility', newVisibility);
                    map.setLayoutProperty('floodplain-line', 'visibility', newVisibility);
                    map.setLayoutProperty('floodplain-labels', 'visibility', newVisibility);
                } else if (clickedLayer === 'DEP wetland') {
                    map.setLayoutProperty('dep-wetland-line', 'visibility', newVisibility);
                    map.setLayoutProperty('dep-wetland-labels', 'visibility', newVisibility);
                } else if (clickedLayer === 'soils') {
                    map.setLayoutProperty('soils-labels', 'visibility', newVisibility);
                    map.setLayoutProperty('soils-outline', 'visibility', newVisibility);
                } else if (clickedLayer === 'zone II') {
                    map.setLayoutProperty('zone-ii-outline', 'visibility', newVisibility);
                    map.setLayoutProperty('zone-ii-labels', 'visibility', newVisibility);
                } else if (clickedLayer === 'endangered species') {
                    map.setLayoutProperty('endangered-species-labels', 'visibility', newVisibility);
                    map.setLayoutProperty('vernal-pools', 'visibility', newVisibility);
                    map.setLayoutProperty('vernal-pools-labels', 'visibility', newVisibility);
                } else if (clickedLayer === 'sewer plans') {
                    map.setLayoutProperty('sewer-plans-outline', 'visibility', newVisibility);
                } else if (clickedLayer === 'lidar contours') {
                    if (map.getLayer('lidar-contour-labels')) {
                        map.setLayoutProperty('lidar-contour-labels', 'visibility', newVisibility);
                    }
                }
                
                if (typeof window.updateLegend === 'function') {
                    if (!map._legendUpdateListenerAdded) {
                        map._legendUpdateListenerAdded = true;
                        map.once('idle', function() {
                            window.updateLegend();
                            map._legendUpdateListenerAdded = false; 
                        });
                    }
                }
            };
    
            document.getElementById('menu').appendChild(link);
        }
    }
    
    mapContainer.style.width = `calc(95vw - ${menuOnlyOffset}px)`;
    mapContainer.style.marginLeft = `${menuOnlyOffset}px`;
    map.resize();

    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 200, unit: 'imperial' }), 'bottom-right');
}