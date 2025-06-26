function addFloodplainLayer() {
    // LiMWA Source + Layer
    map.addSource('LiMWA', {
        type: 'vector',
        url: 'mapbox://ese-toh.7h5nwda9'
    });
    
    map.addLayer({
        'id': 'LiMWA',
        'type': 'line',
        'source': 'LiMWA',
        'source-layer': 'LiMWA-dtmi75',
        'layout': { 'visibility': 'none' },
        'paint': {
            'line-color': '#E70B0B',
            'line-width': 3.0
        }
    });

    map.addSource('floodplain', {
        type: 'vector',
        url: 'mapbox://ese-toh.a7lml4y4'
    });

    map.addLayer({
        'id': 'floodplain',
        'type': 'fill',
        'source': 'floodplain',
        'source-layer': '25001c-2014-c2ck89',
        'layout': { 'visibility': 'none' },
        'paint': {
            'fill-opacity': [
                'match',
                ['get', 'ZONE_SUBTY'],
                '0.2 PCT ANNUAL CHANCE FLOOD HAZARD', 0.4,
                'AREA OF MINIMAL FLOOD HAZARD', 0.001,
                /* other */ 0.4
            ],
            'fill-color': [
                'match',
                ['get', 'FLD_ZONE'],
                'AE', '#eb8c34',
                'VE', '#eb3a34',
                'AO', '#F7FE20',
                'X', '#2578F9',
                'A', '#2e4bf0',
                /* fallback */ '#ff0000'
            ]
        }
    });

    map.addLayer({
        'id': 'floodplain-line',
        'type': 'line',
        'source': 'floodplain',
        'source-layer': '25001c-2014-c2ck89',
        'layout': { 'visibility': 'none' },
        'paint': {
            'line-width': 0.5, 
            'line-color': '#000000', 
            'line-opacity': 0.5 
        }
    });

    map.addLayer({
        'id': 'floodplain-labels',
        'type': 'symbol',
        'source': 'floodplain',
        'source-layer': '25001c-2014-c2ck89',
        'layout': {
            'text-field': [
                'case',
                ['==', ['get', 'FLD_ZONE'], 'AE'], ['concat', 'AE ', ['get', 'STATIC_BFE']],
                ['==', ['get', 'FLD_ZONE'], 'VE'], ['concat', 'VE ', ['get', 'STATIC_BFE']],
                ['==', ['get', 'FLD_ZONE'], 'X'], 'X',
                ['==', ['get', 'FLD_ZONE'], 'A'], 'A',
                ''
            ],
            'visibility': 'none',
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 10, 12, 16, 16],
            'symbol-placement': 'point',
            'symbol-spacing': 80,
            'text-rotation-alignment': 'map',
        },
        'paint': {
            'text-color': '#202020',
            'text-opacity': 0.6,
            'text-halo-color': '#ffffff',
            'text-halo-width': 1,
            'text-halo-blur': 0.4
        }
    });

    map.on('click', 'floodplain', function (e) {
        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(
                "Flood Zone: <strong>" + e.features[0].properties.FLD_ZONE + "</strong><br>" +
                "Zone Subtype: <strong>" + e.features[0].properties.ZONE_SUBTY + "</strong><br>" +
                "Elevation: <strong>" + e.features[0].properties.STATIC_BFE + "</strong><br><br>" +
                "<span style='color:red;'>The thick red line is the LiMWA.</span>"
            )
            .addTo(map);
    });

    map.on('mouseenter', 'floodplain', function () {
        map.getCanvas().style.cursor = 'pointer';
    });
    
    map.on('mouseleave', 'floodplain', function () {
        map.getCanvas().style.cursor = '';
    });
}

addFloodplainLayer();