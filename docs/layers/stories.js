function addStoriesLayer() {
    map.addSource('stories', {
        type: 'vector',
        url: 'mapbox://ese-toh.1ma2t07c'
    });
    map.addLayer({
        'id': 'stories',
        'type': 'fill',
        'source': 'stories',
        'source-layer': '55-2018-1wy2zb',
        'layout': {
            'visibility': 'none'
        },
        'paint': {
            'fill-opacity': 0.4,
            'fill-color': [
                'match',
                ['get', 'STORIESS'],
                '0', '#e2ffcc', '1', '#fffbb3', '1.1', '#b3ffec', '1.2', '#a5f0dd',
                '1.3', '#94e0cd', '1.4', '#94ebd5', '1.5', '#8cf2ff', '1.6', '#7fe8f5',
                '1.7', '#72e0ed', '1.8', '#63cfdb', '1.9', '#5ac5d1', '2', '#5e90f2',
                '2.3', '#4c7bd9', '2.5', '#3b64b8', '2.8', '#2b53a6', '3', '#3841e8',
                /* other */ '#ffffff'
            ],
            'fill-outline-color': '#257618'
        }
    });

    map.on('mouseenter', 'stories', function () {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'stories', function () {
        map.getCanvas().style.cursor = '';
    });
}

addStoriesLayer();