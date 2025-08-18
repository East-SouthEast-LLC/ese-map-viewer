// src/js/main.js

(function() {
    // get the townid from the script tag's data attribute
    const thisScript = document.querySelector('script[src*="main.js"]');
    const townId = thisScript.getAttribute('data-town-id');
    
    if (!townId) {
        console.error("town id is not defined in the script tag's data-town-id attribute.");
        return;
    }
    window.townId = townId;

    // central state variables
    let marker = null;
    const markerCoordinates = { lat: null, lng: null };
    let placingPoint = false;
    let lastViewedPanoId = null; 

    // expose variables globally so all control scripts can use them
    window.marker = marker;
    window.markerCoordinates = markerCoordinates;
    window.placingPoint = placingPoint;
    window.lastViewedPanoId = lastViewedPanoId;
    
    /**
     * dynamically creates and appends a script tag to the body.
     * returns a promise that resolves when the script is loaded.
     * @param {string} src - the source url of the script to load.
     * @returns {promise}
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`script load error for ${src}`));
            document.body.appendChild(script);
        });
    }

    /**
     * dynamically builds the html for the toolkit and appends it to the body.
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
                <button class="mapboxgl-ctrl-clear" id="clearButton" aria-label="eight" data-tooltip="Clear measurements"></button>
                <button class="mapboxgl-ctrl-nine" id="nineButton" aria-label="nine" data-tooltip="Placeholder"></button>
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
                if (window.map) {
                    window.map.resize();
                }
            }, 400);
        });
    }
    
    function handleMarkerPlacement(lngLat) {
        const { lat, lng } = lngLat;
        setPinPosition(lat, lng); 
        if (window.marker) window.marker.remove();
        window.marker = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);
        window.placingPoint = false; 
        document.getElementById('pointButton').classList.remove('active');
        map.getCanvas().style.cursor = '';
        trackEvent('place_marker', {});
    }

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

    // --- main execution logic ---
    document.addEventListener('DOMContentLoaded', () => {
        buildToolkit();
        setupLayoutAdjustments();

        mapboxgl.accessToken = 'pk.eyJ1IjoiZXNlLXRvaCIsImEiOiJja2Vhb24xNTEwMDgxMzFrYjVlaTVjOXkxIn0.IsPo5lOndNUc3lDLuBa1ZA';
        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/ese-toh/ckh2ss32s06i119paer9mt67h',
        });
        window.map = map;

        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl
        });
        document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

        map.on('load', async function () {
            console.log("map 'load' event fired. loading scripts...");
            
            // first, always load the base towns layer
            await loadScript(`https://east-southeast-llc.github.io/ese-map-viewer-dev/src/js/layers/towns.js`);

            try {
                // then, fetch town and layer configurations
                const [townConfigResponse, layerConfigResponse] = await Promise.all([
                    fetch('https://east-southeast-llc.github.io/ese-map-viewer-dev/assets/data/town_config.json'),
                    fetch('https://east-southeast-llc.github.io/ese-map-viewer-dev/assets/data/layer_config.json')
                ]);

                const townConfig = await townConfigResponse.json();
                const layerConfig = await layerConfigResponse.json();
                window.layerConfig = layerConfig;

                const townData = townConfig.find(town => town.townID === window.townId);

                if (townData) {
                    const urlParams = new URLSearchParams(window.location.search);
                    if (!urlParams.has('zoom')) {
                        map.setCenter(townData.map.center);
                        map.setZoom(townData.map.zoom);
                    }
                    window.eseMapBaseUrl = townData.baseShareUrl;
                    window.toggleableLayerIds = townData.layers; // this list from config does not include 'towns'
                    window.toggleableLayerIds.unshift('tools');

                    const townLayers = layerConfig
                        .filter(layer => townData.layers.includes(layer.id))
                        .sort((a, b) => a.drawOrder - b.drawOrder);

                    const loadLayerScript = (scriptName) => {
                        return loadScript(`https://east-southeast-llc.github.io/ese-map-viewer-dev/src/js/layers/${scriptName}`);
                    };

                    for (const layer of townLayers) {
                        await loadLayerScript(layer.scriptName);
                    }
                    
                    console.log("all layer scripts loaded.");

                    const controlScripts = [
                        "https://east-southeast-llc.github.io/ese-map-viewer-dev/src/js/components/control/button.js",
                        "https://east-southeast-llc.github.io/ese-map-viewer-dev/src/js/components/control/print.js",
                        "https://east-southeast-llc.github.io/ese-map-viewer-dev/src/js/components/control/custom-print.js",
                        "https://east-southeast-llc.github.io/ese-map-viewer-dev/src/js/components/control/print-area.js",
                        "https://east-southeast-llc.github.io/ese-map-viewer-dev/src/js/components/control/share.js",
                        "https://east-southeast-llc.github.io/ese-map-viewer-dev/src/js/components/control/scale.js",
                        "https://east-southeast-llc.github.io/ese-map-viewer-dev/src/js/components/control/measure.js",
                        "https://east-southeast-llc.github.io/ese-map-viewer-dev/src/js/components/control/legend.js",
                        "https://east-southeast-llc.github.io/ese-map-viewer-dev/src/js/components/control/bookmarks.js",
                        "https://east-southeast-llc.github.io/ese-map-viewer-dev/src/js/components/control/identify.js",
                        "https://east-southeast-llc.github.io/ese-map-viewer-dev/src/js/components/disclaimer-popup.js",
                        "https://east-southeast-llc.github.io/ese-map-viewer-dev/src/js/utils/analytics.js",
                        "https://east-southeast-llc.github.io/ese-map-viewer-dev/src/js/components/mobile-menu.js",
                        "https://east-southeast-llc.github.io/ese-map-viewer-dev/src/js/utils/decode-url.js",
                        "https://east-southeast-llc.github.io/ese-map-viewer-dev/src/js/components/popup-manager.js"
                    ];
                    
                    await Promise.all(controlScripts.map(loadScript));
                    console.log("all control scripts loaded.");

                    await loadScript("https://east-southeast-llc.github.io/ese-map-viewer-dev/src/js/components/toggleable-menu.js?v=2");
                    setupToggleableMenu();
                    applyUrlParams(map);
                    console.log("application is fully loaded and ready.");
                    
                    // wait for the map to finish its first complete render cycle.
                    map.once('idle', () => {
                        console.log("map is idle, hiding skeleton.");
                        if (typeof hideSkeleton === 'function') {
                            hideSkeleton();
                        }
                    });

                } else {
                    console.error("town data not found for id:", window.townId);
                    // if town data fails, hide skeleton immediately
                    if (typeof hideSkeleton === 'function') {
                        hideSkeleton();
                    }
                }
            } catch (error) {
                console.error("failed to load initial configurations:", error);
                // if any other error occurs, hide skeleton immediately
                if (typeof hideSkeleton === 'function') {
                    hideSkeleton();
                }
            }
            
            map.on('click', 'panoramas', function(e) {
                if (e.features.length > 0) {
                    const feature = e.features[0];
                    const currentIndex = window.panoramaOrder.indexOf(feature.id);
                    if (currentIndex !== -1) {
                        openPanoModal(currentIndex);
                    }
                }
            });

            map.on('click', (e) => {
                if (window.placingPoint) {
                    handleMarkerPlacement(e.lngLat);
                    return;
                }
                
                const identifyButton = document.getElementById('identifyButton');
                const distanceButton = document.getElementById('distanceButton');
                if (identifyButton?.classList.contains('active') || distanceButton?.classList.contains('active')) {
                    return;
                }

                const panoFeatures = map.queryRenderedFeatures(e.point, { layers: ['panoramas'] });
                if (panoFeatures.length > 0) {
                    return; 
                }

                const townLayerIds = window.toggleableLayerIds;
                const queryableLayers = window.layerConfig
                    .filter(l => townLayerIds.includes(l.id) && l.popupConfig)
                    .map(l => l.id);

                const features = map.queryRenderedFeatures(e.point, { layers: queryableLayers });

                if (!features.length) return;
                
                const topFeature = features[0];
                const popupHTML = generatePopupHTML(topFeature);

                if (popupHTML) {
                    new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(popupHTML).addTo(map);
                }
            });
        });
    });
})();