function addCountiesLayer() {
    map.addSource('counties', {
        type: 'vector',
        url: 'mapbox://ese-toh.6397vbze'
    });
    map.addLayer({
        'id': 'counties',
        'type': 'line',
        'source': 'counties',
        'source-layer': '2026_COUNTIES-94ibpy',
        'layout': {
            'visibility': 'visible'
        },
        'paint': {
            'line-color': '#08f8fc',
            'line-width': 1
        },
    });
}

addCountiesLayer();