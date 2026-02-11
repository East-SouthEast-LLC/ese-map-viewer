///////////


function addParcelHighlightLayer() {
	//Brain Mass
    map.addSource('parcel highlight', {
        type: 'vector',
        url: 'mapbox://ese-toh.71nvl5kq'
    });
    map.addLayer({
        'id': 'parcel highlight',
        'type': 'fill',
        'source': 'parcel highlight',
        'source-layer': '2026_Statewide_Parcels_brain-58henn',
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

	//CC Mass
    map.addSource('parcel highlight cc', {
        type: 'vector',
        url: 'mapbox://ese-toh.cxvs0pej'
    });
    map.addLayer({
        'id': 'parcel highlight cc',
        'type': 'fill',
        'source': 'parcel highlight cc',
        'source-layer': '2026_Statewide_Parcels_cc-5jy337',
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
	//Marsh Mass
    map.addSource('parcel highlight marsh', {
        type: 'vector',
        url: 'mapbox://ese-toh.3b7hwfjm'
    });
    map.addLayer({
        'id': 'parcel highlight marsh',
        'type': 'fill',
        'source': 'parcel highlight marsh',
        'source-layer': '2026_Statewide_Parcels_marsh-d5rfkr',
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
	//Cen Mass
    map.addSource('parcel highlight cen', {
        type: 'vector',
        url: 'mapbox://ese-toh.cs2vjhk0'
    });
    map.addLayer({
        'id': 'parcel highlight cen',
        'type': 'fill',
        'source': 'parcel highlight cen',
        'source-layer': '2026_Statewide_Parcels_cen-45u8b6',
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
		//Salem Mass
    map.addSource('parcel highlight salem', {
        type: 'vector',
        url: 'mapbox://ese-toh.bfeflzh4'
    });
    map.addLayer({
        'id': 'parcel highlight salem',
        'type': 'fill',
        'source': 'parcel highlight salem',
        'source-layer': '2026_Statewide_Parcels_salem-dybfc1',
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
    map.addSource('parcel highlight west', {
        type: 'vector',
        url: 'mapbox://ese-toh.5145412c'
    });
    map.addLayer({
        'id': 'parcel highlight west',
        'type': 'fill',
        'source': 'parcel highlight west',
        'source-layer': '2026_Statewide_Parcels_west-bc729e',
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
		//WILB Mass
    map.addSource('parcel highlight wilb', {
        type: 'vector',
        url: 'mapbox://ese-toh.b2yjtsvz'
    });
    map.addLayer({
        'id': 'parcel highlight wilb',
        'type': 'fill',
        'source': 'parcel highlight wilb',
        'source-layer': '2026_Statewide_Parcels_wilb-dyq6sl',
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
			//SS Mass
    map.addSource('parcel highlight ss', {
        type: 'vector',
        url: 'mapbox://ese-toh.9geeudeh'
    });
    map.addLayer({
        'id': 'parcel highlight ss',
        'type': 'fill',
        'source': 'parcel highlight ss',
        'source-layer': '2026_Statewide_Parcels_ss-4s6wu9',
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