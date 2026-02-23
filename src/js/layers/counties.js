function addCountiesLayer() {

    // add source only if it doesn't exist
    if (!map.getSource('counties')) {
        map.addSource('counties', {
            type: 'vector',
            url: 'mapbox://ese-toh.6397vbze'
        });
    }

    // add layer only if it doesn't exist
    if (!map.getLayer('counties')) {
        map.addLayer({
            'id': 'counties',
            'type': 'line',
            'source': 'counties',
            'source-layer': '2026_COUNTIES-94ibpy',
            'layout': {
                'visibility': 'visible'
            },
            'paint': {
                'line-color': '#1152f5',
                'line-width': 1.5
            },
        });
    }
}

addCountiesLayer();