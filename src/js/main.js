// src/js/main.js

(function() {
    // get the townId from the script tag's data attribute
    const thisScript = document.querySelector('script[src*="main.js"]');
    const townId = thisScript?.getAttribute('data-town-id');
    
    if (!townId) {
        console.error("town id is not defined in the script tag's data-town-id attribute.");
        return;
    }
    window.townId = townId;

    // central state variables
    window.marker = null;
    window.markerCoordinates = { lat: null, lng: null };
    window.placingPoint = false;
    window.lastViewedPanoId = null;

    /**
     * Dynamically load a script and return a promise that resolves when loaded
     * @param {string} src
     * @returns {Promise<void>}
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Script load error for ${src}`));
            document.body.appendChild(script);
        });
    }

    /**
     * Build the toolkit UI and append to the body
     */
    function buildToolkit() {
        const geocoderContainer = document.createElement('div');
        geocoderContainer.id = 'geocoder-container';
        geocoderContainer.innerHTML = `
            <div id="geocoder" data-tooltip="Search for a location"></div>
            <div>
                <button class="mapboxgl-ctrl-point" id="pointButton" aria-label="Point" data-tooltip="Drop a point on the map"></button>
                <button class="mapboxgl-ctrl-print" id="printButton" aria-label="Print" data-tooltip="Print map"></button>
                <button class="mapboxgl-ctrl-measure" id="distanceButton" aria-label="Measure" data-tooltip="Measure distances (on/off)"></button>
                <button class="mapboxgl-ctrl-legend" id="legendButton" aria-label="Legend" data-tooltip="Show/Hide Legend"></button>
                <button class="mapboxgl-ctrl-bookmark" id="bookmarkButton" aria-label="Bookmarks" data-tooltip="Save or load map views"></button>
            </div>
            <div>
                <button class="mapboxgl-ctrl-point-center" id="pointCButton" aria-label="Point Center" data-tooltip="Center the point or centerpoint"></button>
                <button class="mapboxgl-ctrl-parea" id="pareaButton" aria-label="Print Area" data-tooltip="Print Area"></button>
                <button class="mapboxgl-ctrl-identify" id="identifyButton" aria-label="Identify" data-tooltip="Identify all features at a point"></button>
                <button class="mapboxgl-ctrl-four" id="fourButton" aria-label="four" data-tooltip="Placeholder"></button>
                <button class="mapboxgl-ctrl-sZoom" id="scaleZoom" aria-label="Zoom to Scale" data-tooltip="Zoom to Scale"></button>
            </div>
            <div>
                <button class="mapboxgl-ctrl-point-off" id="pointOffButton" aria-label="Point Off" data-tooltip="Remove the point from the map"></button>
                <button class="mapboxgl-ctrl-custom-print" id="customPrintButton" aria-label="Custom Print" data-tooltip="Create a custom multi-page printout"></button>
                <button class="mapboxgl-ctrl-clear" id="clearButton" aria-label="Clear" data-tooltip="Clear measurements"></button>
                <button class="mapboxgl-ctrl-toggle-off" id="toggleOffButton" aria-label="Toggle All Layers Off" data-tooltip="Turn off all active layers"></button>
                <button class="mapboxgl-ctrl-ten" id="tenButton" aria-label="ten" data-tooltip="Placeholder"></button>
            </div>
            <button class="mapboxgl-ctrl-share" id="shareButton" data-tooltip="Share the map with a URL">Share Map</button>
            <div id="distance-display"></div>
            <div id="scale-box"></div>
            <div id="legend-box"></div>
            <div id="custom-print-box"></div>
            <div id="bookmark-box"></div>
            <div id="identify-box"></div>
        `;
        document.body.appendChild(geocoderContainer);
    }

    /**
     * Adjust map and menu layout dynamically
     */
    function adjustLayout() {
        const header = document.querySelector('#header');
        const mapContainer = document.getElementById('map');
        const menuContainer = document.getElementById('menu');
        const geocoderContainer = document.getElementById('geocoder-container');
        if (!header || !mapContainer || !menuContainer) return;

        const headerHeight = header.offsetHeight;
        const buffer = 70;
        const topOffset = headerHeight + 40;
        const availableHeight = window.innerHeight - headerHeight - buffer;

        mapContainer.style.height = `${availableHeight}px`;
        menuContainer.style.maxHeight = `${availableHeight}px`;
        if (geocoderContainer) {
            geocoderContainer.style.maxHeight = `${availableHeight}px`;
            geocoderContainer.style.top = `${topOffset}px`;
        }
    }

    function setupLayoutAdjustments() {
        adjustLayout();
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                adjustLayout();
                if (window.map) window.map.resize();
            }, 400);
        });
    }

    function handleMarkerPlacement(lngLat) {
        const { lat, lng } = lngLat;
        if (window.marker) window.marker.remove();
        window.marker = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(window.map);
        window.placingPoint = false;
        document.getElementById('pointButton')?.classList.remove('active');
        window.map.getCanvas().style.cursor = '';
    }

    // --- main execution ---
    document.addEventListener('DOMContentLoaded', async () => {
        buildToolkit();
        setupLayoutAdjustments();

        // set Mapbox token from config.js
        if (!window.MAPBOX_ACCESS_TOKEN) {
            console.error("MAPBOX_ACCESS_TOKEN not defined. Make sure config.js is loaded first.");
            return;
        }
        mapboxgl.accessToken = window.MAPBOX_ACCESS_TOKEN;

        // initialize map
        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/ese-toh/ckh2ss32s06i119paer9mt67h',
        });
        window.map = map;

        // add geocoder
        const geocoder = new MapboxGeocoder({ accessToken: mapboxgl.accessToken, mapboxgl });
        document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

        map.on('load', async () => {
            try {
                // base layers
                await loadScript("https://east-southeast-llc.github.io/ese-map-viewer/src/js/layers/towns.js");
                await loadScript("https://east-southeast-llc.github.io/ese-map-viewer/src/js/layers/counties.js");

                // fetch configs
                const [townConfigResponse, layerConfigResponse] = await Promise.all([
                    fetch('https://east-southeast-llc.github.io/ese-map-viewer/assets/data/town_config.json'),
                    fetch('https://east-southeast-llc.github.io/ese-map-viewer/assets/data/layer_config.json')
                ]);
                const townConfig = await townConfigResponse.json();
                const layerConfig = await layerConfigResponse.json();
                window.layerConfig = layerConfig;

                const townData = townConfig.find(t => t.townID === window.townId);
                if (!townData) {
                    console.error("Town data not found for ID:", window.townId);
                    return;
                }

                const urlParams = new URLSearchParams(window.location.search);
                if (!urlParams.has('zoom')) {
                    map.setCenter(townData.map.center);
                    map.setZoom(townData.map.zoom);
                }
                window.eseMapBaseUrl = townData.baseShareUrl;
                window.toggleableLayerIds = ['tools', ...townData.layers];

                // load layers
                for (const layer of layerConfig.filter(l => townData.layers.includes(l.id)).sort((a,b)=>a.drawOrder-b.drawOrder)) {
                    await loadScript(`https://east-southeast-llc.github.io/ese-map-viewer/src/js/layers/${layer.scriptName}`);
                }

                // load control scripts
                const controlScripts = [
                    "map-helpers.js",
                    "marker.js",
                    "print.js",
                    "custom-print.js",
                    "print-area.js",
                    "share.js",
                    "scale.js",
                    "measure.js",
                    "legend.js",
                    "bookmarks.js",
                    "identify.js",
                    "toggle-off.js",
                    "tooltip.js",
                    "disclaimer-popup.js",
                    "analytics.js",
                    "mobile-menu.js",
                    "decode-url.js",
                    "popup-manager.js",
                    "panorama-viewer.js"
                ].map(file => `https://east-southeast-llc.github.io/ese-map-viewer/src/js/components/control/${file}`);
                
                await Promise.all(controlScripts.map(loadScript));
                
            } catch (err) {
                console.error("Error initializing map:", err);
            }
        });

        map.on('click', (e) => {
            if (window.placingPoint) {
                handleMarkerPlacement(e.lngLat);
                return;
            }
        });
    });
})();
