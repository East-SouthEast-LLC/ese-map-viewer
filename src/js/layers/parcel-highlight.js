function addParcelHighlightLayer() {
    map.addSource('parcel highlight', {
        type: 'vector',
        url: 'mapbox://ese-toh.c0yoak91'
    });
    map.addLayer({
        'id': 'parcel highlight',
        'type': 'line',
        'source': 'parcel highlight',
        'source-layer': 'PARCEL_LINES_SE-96csbl',
        'layout': {
            'visibility': 'none',
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#a0fa39',
            'line-width': 1.5
        }
    });
}

addParcelHighlightLayer();