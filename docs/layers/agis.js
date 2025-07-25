function addAgisLayer() {
    map.addSource('agis', {
        type: 'vector',
        url: 'mapbox://ese-toh.chkrbtah'
    });
    map.addLayer({
        'id': 'agis',
        'type': 'fill',
        'source': 'agis',
        'source-layer': 'aGIS-6x9985',
        'layout': {
            'visibility': 'none'
        },
        'paint': {
            'fill-opacity': 0.4,
            'fill-color': [
                'match',
                ['get', 'DATE'],
                '-',
                '#FFFFFF',
                /* other */ '#3CD935'
            ],
        },
    });

    map.on('mouseenter', 'agis', function () {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'agis', function () {
        map.getCanvas().style.cursor = '';
    });
}

addAgisLayer();