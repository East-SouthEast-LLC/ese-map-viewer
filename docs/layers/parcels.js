function addParcelsLayer() {
    map.addSource('parcels', {
        type: 'vector',
        url: 'mapbox://ese-toh.5ehygl9z'
    });
    map.addLayer({
        'id': 'parcels',
        'type': 'fill',
        'source': 'parcels',
        'source-layer': 'CC-2020-11-02-c73syu',
        'layout': {
            'visibility': 'none'
        },
        'paint': {
            'fill-opacity': 0.1,
            'fill-color': '#FEFEFE',
            'fill-outline-color': '#000001'
        },
    });

    map.on('mouseenter', 'parcels', function () {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'parcels', function () {
        map.getCanvas().style.cursor = '';
    });
}

addParcelsLayer();