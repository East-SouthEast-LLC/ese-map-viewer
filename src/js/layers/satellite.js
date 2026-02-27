function addSatelliteLayer() {
    map.addSource('satellite', {
        type: 'raster',
        url: 'mapbox://mapbox.satellite'
    });
    
    map.addLayer({
        'id': 'satellite',
        'type': 'raster',
        'source': 'satellite',
        'layout': {
            'visibility': 'none'
        },
        'source-layer': 'satellite'
    });
	    // NEW: ensure marker layer sits above satellite
    if (map.getLayer('print-marker-layer') && map.getLayer('satellite')) {
        map.moveLayer('print-marker-layer', 'satellite');
    }
}

addSatelliteLayer();