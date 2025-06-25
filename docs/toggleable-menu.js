// docs/toggleable-menu.js

/**
 * Initializes the toggleable layer menu and the map layout.
 * This function is now designed to be called explicitly from town.html
 * after the map and town configuration have been loaded.
 * @param {string[]} layerIds - An array of layer IDs to be included in the menu, from town-config.json.
 */
window.initializeMenu = function(layerIds) {
    // Define the pixel widths for the side menus from the CSS
    const menuOnlyWidth = 220;
    const fullToolkitWidth = 480;

    // Get the required DOM elements
    const mapContainer = document.getElementById('map');
    const menu = document.getElementById('menu');

    // Clear any existing menu items to prevent duplication
    menu.innerHTML = '';

    // Create and add the 'tools' button, which is common to all maps
    const toolsLink = document.createElement('a');
    toolsLink.href = '#';
    toolsLink.className = '';
    toolsLink.textContent = 'tools';
    toolsLink.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        const geocoderContainer = document.getElementById("geocoder-container");
        
        const isHidden = getComputedStyle(geocoderContainer).display === "none";
        geocoderContainer.style.display = isHidden ? "flex" : "none";
        this.className = isHidden ? 'active' : '';

        if (isHidden) {
            mapContainer.style.width = `calc(95vw - ${fullToolkitWidth}px)`;
            mapContainer.style.marginLeft = `${fullToolkitWidth}px`;
        } else {
            mapContainer.style.width = `calc(95vw - ${menuOnlyWidth}px)`;
            mapContainer.style.marginLeft = `${menuOnlyWidth}px`;
        }

        setTimeout(() => map.resize(), 400);
    };
    menu.appendChild(toolsLink);

    // Dynamically create a toggle button for each layer specified in the config
    layerIds.forEach(id => {
        const link = document.createElement('a');
        link.href = '#';
        link.className = '';
        link.textContent = id;

        link.onclick = function(e) {
            const clickedLayer = this.textContent;
            e.preventDefault();
            e.stopPropagation();

            if (!map.getLayer(clickedLayer)) {
                console.warn("Layer not found:", clickedLayer);
                return;
            }

            const isVisible = map.getLayoutProperty(clickedLayer, 'visibility') === 'visible';
            const newVisibility = isVisible ? 'none' : 'visible';
            
            map.setLayoutProperty(clickedLayer, 'visibility', newVisibility);

            // Handle visibility for dependent or related sub-layers
            const subLayerToggles = {
                'floodplain': ['LiMWA', 'floodplain-line', 'floodplain-labels'],
                'DEP wetland': ['dep-wetland-line', 'dep-wetland-labels'],
                'soils': ['soils-labels', 'soils-outline'],
                'zone II': ['zone-ii-outline', 'zone-ii-labels'],
                'endangered species': ['endangered-species-labels', 'vernal-pools', 'vernal-pools-labels'],
                'sewer plans': ['sewer-plans-outline'],
                'lidar contours': ['contour-labels'] // Corrected from your previous code
            };

            if (subLayerToggles[clickedLayer]) {
                subLayerToggles[clickedLayer].forEach(subLayer => {
                    if (map.getLayer(subLayer)) {
                        map.setLayoutProperty(subLayer, 'visibility', newVisibility);
                    }
                });
            }

            this.className = newVisibility === 'visible' ? 'active' : '';
            
            if (typeof window.updateLegend === 'function') {
                if (!map._legendUpdateListenerAdded) {
                    map.once('idle', () => {
                        window.updateLegend();
                        map._legendUpdateListenerAdded = false; 
                    });
                    map._legendUpdateListenerAdded = true;
                }
            }
        };
        menu.appendChild(link);
    });
    
    // Set the initial size and position of the map
    mapContainer.style.width = `calc(95vw - ${menuOnlyWidth}px)`;
    mapContainer.style.marginLeft = `${menuOnlyWidth}px`;
    map.resize();

    map.addControl(new mapboxgl.ScaleControl({
        maxWidth: 200,
        unit: 'imperial'
    }), 'bottom-right');
};
