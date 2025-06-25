// toggleable-menu.js

window.initializeMenu = function(layerIds) {
    // Define the widths for the side menus based on new CSS
    const menuOnlyWidth = 220;
    const fullToolkitWidth = 480; // Updated from 490

    // Get the map's container element
    const mapContainer = document.getElementById('map');
    const menu = document.getElementById('menu');

    // Clear any existing menu items
    menu.innerHTML = '';

    // Add the 'tools' button first
    const toolsLink = document.createElement('a');
    toolsLink.href = '#';
    toolsLink.className = '';
    toolsLink.textContent = 'tools';
    toolsLink.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        var geocoderContainer = document.getElementById("geocoder-container");
        // Toggle display and set map position accordingly
        if (getComputedStyle(geocoderContainer).display === "none") {
            geocoderContainer.style.display = "flex";
            this.className = 'active';
            // Adjust map width and margin for the full toolkit
            mapContainer.style.width = `calc(95vw - ${fullToolkitWidth}px)`;
            mapContainer.style.marginLeft = `${fullToolkitWidth}px`;
        } else {
            geocoderContainer.style.display = "none";
            this.className = '';
            // Adjust map width and margin for the layer menu only
            mapContainer.style.width = `calc(95vw - ${menuOnlyWidth}px)`;
            mapContainer.style.marginLeft = `${menuOnlyWidth}px`;
        }

        // Use a timeout to resize the map after the CSS transition
        setTimeout(function() {
            map.resize();
        }, 400); // This should match the transition duration in the CSS
    };
    menu.appendChild(toolsLink);


    // set up the corresponding toggle button for each layer
    for (var i = 0; i < layerIds.length; i++) {
        var id = layerIds[i];
        
        var link = document.createElement('a');
        link.href = '#';
        link.className = '';
        link.textContent = id;

        link.onclick = function(e) {
            var clickedLayer = this.textContent;
            e.preventDefault();
            e.stopPropagation();

            if (!map.getLayer(clickedLayer)) {
                console.warn("Layer not found:", clickedLayer);
                return;
            }

            const isVisible = map.getLayoutProperty(clickedLayer, 'visibility') === 'visible';
            const newVisibility = isVisible ? 'none' : 'visible';
            
            // Toggle main layer
            map.setLayoutProperty(clickedLayer, 'visibility', newVisibility);

            // handle floodplain layers -----------------------------------
            if (clickedLayer === 'floodplain') {
                map.setLayoutProperty('LiMWA', 'visibility', newVisibility);
                map.setLayoutProperty('floodplain-line', 'visibility', newVisibility);
                map.setLayoutProperty('floodplain-labels', 'visibility', newVisibility);
            }

            // handle dep wetland layers -----------------------------------
            if (clickedLayer === 'DEP wetland') {
                map.setLayoutProperty('dep-wetland-line', 'visibility', newVisibility);
                map.setLayoutProperty('dep-wetland-labels', 'visibility', newVisibility);
            }

            // handle soils layers ----------------------------------------
            if (clickedLayer === 'soils') {
                map.setLayoutProperty('soils-labels', 'visibility', newVisibility);
                map.setLayoutProperty('soils-outline', 'visibility', newVisibility);
            }

            // handle zone II layers ----------------------------------------
            if (clickedLayer === 'zone II') {
                map.setLayoutProperty('zone-ii-outline', 'visibility', newVisibility);
                map.setLayoutProperty('zone-ii-labels', 'visibility', newVisibility);
            }

            // handle endangered species layers -----------------------
            if (clickedLayer === 'endangered species') {
                map.setLayoutProperty('endangered-species-labels', 'visibility', newVisibility);
                map.setLayoutProperty('vernal-pools', 'visibility', newVisibility);
                map.setLayoutProperty('vernal-pools-labels', 'visibility', newVisibility);
            }

            // handle sewer plans layers -----------------------------------
            if (clickedLayer === 'sewer plans') {
                map.setLayoutProperty('sewer-plans-outline', 'visibility', newVisibility);
            }
             // handle lidar contours layers -----------------------------------
            if (clickedLayer === 'lidar-contours') {
                map.setLayoutProperty('contour-labels', 'visibility', newVisibility);
            }
            // ------------------------------------------------------------

            // Always update button visual state based on new visibility
            this.className = newVisibility === 'visible' ? 'active' : '';
            // once map renders, update legend
            if (typeof window.updateLegend === 'function') {
                if (!map._legendUpdateListenerAdded) {
                    map.once('idle', function() {
                        window.updateLegend();
                        map._legendUpdateListenerAdded = false; 
                    });
                    map._legendUpdateListenerAdded = true;
                }
            }
        };

        menu.appendChild(link);
    }
    
    // Set the initial position of the map to account for the layer menu
    mapContainer.style.width = `calc(95vw - ${menuOnlyWidth}px)`;
    mapContainer.style.marginLeft = `${menuOnlyWidth}px`;
    map.resize();


    map.addControl(new mapboxgl.ScaleControl({
        maxWidth: 200,
        unit: 'imperial'
    }), 'bottom-right');
};

map.on('load', function() {
    // This will be called if the script is loaded in a non-modular way
    // and will use the default list of layers.
    if (!window.townConfig) {
        var defaultLayers = ['tools', 'satellite', 'parcels', 'parcel highlight', 'contours', 'agis', 'historic', 'floodplain', 'acec', 'DEP wetland', 'endangered species', 'zone II', 'soils', 'conservancy districts', 'zoning', 'conservation', 'sewer', 'sewer plans', 'stories', 'intersection'];
        window.initializeMenu(defaultLayers);
    }
});