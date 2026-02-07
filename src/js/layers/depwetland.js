function addDepWetlandLayer() {
    map.addSource('DEP wetland', {
        type: 'vector',
        url: 'mapbox://ese-toh.9hoztiqr'
    });

    map.addLayer({
        'id': 'DEP wetland',
        'type': 'fill',
        'source': 'DEP wetland',
        'source-layer': 'wetlandsdep_poly-0v67ee',
        'layout': {
            'visibility': 'none'
        },
        'paint': {
            'fill-opacity': [
                'match',
                ['get', 'IT_VALC'],
                'BA', 0.5, 'BB', 0.4, 'BB-BE', 0.4, 'BB-D', 0.4, 'BB-M', 0.4,
                'BB-OW', 0.4, 'BB-SM', 0.6, 'BB-SS', 0.6, 'BB-WS1', 0.6, 'BB-WS2', 0.6,
                'BE', 0.4, 'BG', 0.5, 'CB', 0.5, 'D', 0.4, 'DM', 0.5, 'M', 0.4,
                'OW', 0.4, 'RS', 0.4, 'SM', 0.4, 'SS', 0.4, 'TF', 0.5, 'WS1', 0.5,
                'WS2', 0.6, 'WS3', 0.6,
                /* other */ 0.001
            ],
            'fill-color': [
                'match',
                ['get', 'IT_VALC'],
                'BA', '#F7F124', 'BB', '#DCD609', 'BB-BE', '#D0D041', 'BB-D', '#99F108',
                'BB-M', '#24AF0B', 'BB-OW', '#1BB5CA', 'BB-SM', '#24AF0B', 'BB-SS', '#32D34F',
                'BB-WS1', '#1F9A35', 'BB-WS2', '#056828', 'BE', '#D7E00F', 'BG', '#0C9955',
                'CB', '#BB0418', 'D', '#99F108', 'DM', '#056A56', 'M', '#26A04E',
                'OW', '#2B8ACB', 'RS', '#B5C0C8', 'SM', '#389C3F', 'SS', '#24CF31',
                'TF', '#F3F4CC', 'WS1', '#1F9A35', 'WS2', '#056828', 'WS3', '#448842',
                /* other */ '#5c580f'
            ],
        },
    });

    map.addLayer({
        'id': 'dep-wetland-labels',
        'type': 'symbol',
        'source': 'DEP wetland',
        'source-layer': 'wetlandsdep_poly-0v67ee',
        'layout': {
            'text-field': ['get', 'IT_VALC'],
            'visibility': 'none',
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 10, 12, 16, 16],
            'symbol-placement': 'point',
            'symbol-spacing': 80,
            'text-rotation-alignment': 'map'
        },
        'paint': {
            'text-color': '#202020',
            'text-opacity': 0.8,
            'text-halo-color': '#ffffff',
            'text-halo-width': 1,
            'text-halo-blur': 0.4
        }
    });

    map.addSource('dep-wetland-line', {
        type: 'vector',
        url: 'mapbox://ese-toh.4l1powhy'
    });

    map.addLayer({
        'id': 'dep-wetland-line',
        'type': 'line',
        'source': 'dep-wetland-line',
        'source-layer': 'wetlandsdep_arc-4u52md',
        'layout': {
            'visibility': 'none',
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': [
                'match',
                ['get', 'ARC_CODE'],
                '0', '#08ADEF', '1', '#EBF90A', '2', '#EBECDD', '3', '#F2A5EF',
                '7', '#0B11F0', '8', '#5E87ED', '88', '#5EE1ED',
                /* other */ '#ff0000'
            ],
            'line-width': { 'base': 2.0, 'stops': [[12, 2], [22, 5]] }
        }
    });
    
    map.on('mouseenter', 'DEP wetland', function() {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'DEP wetland', function() {
        map.getCanvas().style.cursor = '';
    });
}

addDepWetlandLayer();