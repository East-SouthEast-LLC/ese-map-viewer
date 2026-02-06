function addParcelHighlightLayer() {
	//SE Mass
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
	//NE Mass
    map.addSource('parcel highlight', {
        type: 'vector',
        url: 'mapbox://ese-toh.6fb8one0'
    });
    map.addLayer({
        'id': 'parcel highlight',
        'type': 'line',
        'source': 'parcel highlight',
        'source-layer': 'PARCEL_LINES_NE-30r7f4',
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
	//CEN Mass
    map.addSource('parcel highlight', {
        type: 'vector',
        url: 'mapbox://ese-toh.4dcv8ivs'
    });
    map.addLayer({
        'id': 'parcel highlight',
        'type': 'line',
        'source': 'parcel highlight',
        'source-layer': 'PARCEL_LINES_CEN-9g69uw',
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
	//WEST Mass
    map.addSource('parcel highlight', {
        type: 'vector',
        url: 'mapbox://ese-toh.bi1n6f4d'
    });
    map.addLayer({
        'id': 'parcel highlight',
        'type': 'line',
        'source': 'parcel highlight',
        'source-layer': 'PARCEL_LINES_WEST-0f2awl',
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
