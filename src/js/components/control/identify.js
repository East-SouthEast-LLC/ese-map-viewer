// src/js/components/control/identify.js

const identifyButton = document.getElementById('identifyButton');
const identifyBox = document.getElementById('identify-box');

if (!identifyButton || !identifyBox) {
    console.error("Required elements not found for the Identify tool.");
} else {
    let identifyMode = false;

    function handleIdentifyClick(e) {

        const queryableConfigs = window.layerConfig
            .filter(l => l.identifyConfig)
            .filter(l => map.getLayer(l.id));

        let html = '<strong style="font-size: 14px;">Features at this Point</strong><hr style="margin: 2px 0 5px;">';
        const foundInfo = new Set();

        // point of click for geometry tests
        const clickedPoint = turf.point([e.lngLat.lng, e.lngLat.lat]);

        queryableConfigs.forEach(config => {

            const layer = map.getLayer(config.id);
            if (!layer) return;

            const sourceId = layer.source;
            const sourceLayer = layer['source-layer'];

            let features = [];

            try {
                features = map.querySourceFeatures(sourceId, {
                    sourceLayer: sourceLayer
                });
            } catch (err) {
                console.warn(`Identify skipped ${config.id}`, err);
                return;
            }

            features.forEach(feature => {

                if (!feature.geometry) return;

                let match = false;
                const geomType = feature.geometry.type;

                // polygon or multipolygon
                if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
                    try {
                        match = turf.booleanPointInPolygon(clickedPoint, feature);
                    } catch (err) {
                        console.warn('booleanPointInPolygon failed', err);
                    }
                }

                // lines
                else if (geomType === 'LineString' || geomType === 'MultiLineString') {
                    try {
                        match = turf.booleanPointOnLine(clickedPoint, feature, {
                            tolerance: 0.00001
                        });
                    } catch (err) {
                        console.warn('booleanPointOnLine failed', err);
                    }
                }

                // points
                else if (geomType === 'Point' || geomType === 'MultiPoint') {
                    try {
                        const dist = turf.distance(clickedPoint, feature);
                        match = dist < 0.01; // roughly 10m tolerance
                    } catch (err) {
                        console.warn('distance failed', err);
                    }
                }

                if (!match) return;

                let info = config.identifyConfig.template;

                for (const key in feature.properties) {
                    info = info.replace(new RegExp(`{${key}}`, 'g'), feature.properties[key]);
                }

                if (info && !foundInfo.has(info)) {
                    html += info + '<br>';
                    foundInfo.add(info);
                }
            });
        });

        if (foundInfo.size === 0) {
            html += 'No data features found at this location.';
        }

        identifyBox.innerHTML = html;
        identifyBox.style.display = 'block';

        exitIdentifyMode();
    }

    function enterIdentifyMode() {
        trackEvent('identify_tool', {});
        identifyMode = true;
        map.getCanvasContainer().classList.add('identify-mode-active');
        identifyButton.classList.add('active');
        map.once('click', handleIdentifyClick);
    }

    function exitIdentifyMode() {
        identifyMode = false;
        map.getCanvasContainer().classList.remove('identify-mode-active');
        identifyButton.classList.remove('active');
        map.off('click', handleIdentifyClick);
    }

    identifyButton.addEventListener('click', () => {
        if (identifyMode) {
            exitIdentifyMode();
            identifyBox.style.display = 'none';
        } else {
            enterIdentifyMode();
        }
    });
}