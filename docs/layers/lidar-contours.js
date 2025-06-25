map.on('load', function () {
    // Add the vector source for the LIDAR contours.
    // It's good practice for the source name to match the layer ID for clarity.
    map.addSource('lidar contours', {
        type: 'vector',
        url: 'mapbox://ese-toh.djcjlqsr'
    });

    // Add the main layer for the contour lines.
    // The 'id' now matches what the menu button is looking for.
    map.addLayer({
        id: 'lidar contours',
        type: 'line',
        source: 'lidar contours', // Point to the correctly named source
        'source-layer': 'CONT-ELBOW-9gwgnx',
        layout: {
            visibility: 'none',
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': [
                'match',
                ['get', 'Elevation'],
                '-2',
                '#08ADEF',
                /* other */ '#07C327'
            ],
            'line-width': 0.5
        }
    });

    // Add the corresponding labels layer for the contours.
    map.addLayer({
        id: 'contour-labels', // This sub-layer ID is handled by the toggle logic
        type: 'symbol',
        source: 'lidar contours', // Point to the correctly named source
        'source-layer': 'CONT-ELBOW-9gwgnx',
        layout: {
            'symbol-placement': 'line',
            'symbol-spacing': 100,
            'text-field': ['concat', ['to-string', ['get', 'Elevation']]],
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-size': 10,
            visibility: 'none' // This is toggled correctly by the main button
        },
        paint: {
            'text-color': '#07C327',
            'text-halo-color': '#ffffff',
            'text-halo-width': 1,
        }
    });
});