function handleIdentifyClick(e) {

    const queryableConfigs = window.layerConfig
        .filter(l => l.identifyConfig)
        .filter(l => map.getLayer(l.id));

    let html = '<strong style="font-size: 14px;">Features at this Point</strong><hr style="margin: 2px 0 5px;">';
    const foundInfo = new Set();

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

            if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
                match = turf.booleanPointInPolygon(clickedPoint, feature);
            }

            else if (geomType === 'LineString' || geomType === 'MultiLineString') {
                match = turf.booleanPointOnLine(clickedPoint, feature, { tolerance: 0.00001 });
            }

            else if (geomType === 'Point' || geomType === 'MultiPoint') {
                const dist = turf.distance(clickedPoint, feature);
                match = dist < 0.01; // ~10m tolerance
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
}s