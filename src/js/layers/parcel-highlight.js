///////////


function addParcelHighlightLayer() {
	//Brain Mass
    map.addSource('parcel highlight', {
        type: 'vector',
        url: 'mapbox://ese-toh.71nvl5kq'
    });
	//CC Mass
    map.addSource('parcel highlight cc', {
        type: 'vector',
        url: 'mapbox://ese-toh.cxvs0pej'
    });
	//Marsh Mass
    map.addSource('parcel highlight marsh', {
        type: 'vector',
        url: 'mapbox://ese-toh.3b7hwfjm'
    });
	//Cen Mass
    map.addSource('parcel highlight cen', {
        type: 'vector',
        url: 'mapbox://ese-toh.cs2vjhk0'
    });
	//Salem Mass
    map.addSource('parcel highlight salem', {
        type: 'vector',
        url: 'mapbox://ese-toh.bfeflzh4'
    });	
	//WEST Mass
    map.addSource('parcel highlight west', {
        type: 'vector',
        url: 'mapbox://ese-toh.5145412c'
    });	
	//WILB Mass
    map.addSource('parcel highlight wilb', {
        type: 'vector',
        url: 'mapbox://ese-toh.b2yjtsvz'
    });	
	//SS Mass
    map.addSource('parcel highlight ss', {
        type: 'vector',
        url: 'mapbox://ese-toh.9geeudeh'
    });
	
// add 

	//Brain Mass	
map.addLayer({
    id: 'parcel highlight',
    type: 'fill',
    source: 'parcel highlight',
    'source-layer': '2026_Statewide_Parcels_brain-58henn',
    layout: {
        visibility: 'none'
    },
    paint: {
        'fill-color': 'rgba(0,0,0,0)',   // truly transparent
        'fill-outline-color': '#a0fa39'
    }
});
	
	//CC Mass	
map.addLayer({
    id: 'parcel highlight cc',
    type: 'fill',
    source: 'parcel highlight cc',
    'source-layer': '2026_Statewide_Parcels_cc-5jy337',
    layout: {
        visibility: 'none'
    },
    paint: {
        'fill-color': 'rgba(0,0,0,0)',   // truly transparent
        'fill-outline-color': '#a0fa39'
    }
});

	//Marsh Mass
map.addLayer({
    id: 'parcel highlight marsh',
    type: 'fill',
    source: 'parcel highlight marsh',
    'source-layer': '2026_Statewide_Parcels_marsh-d5rfkr',
    layout: {
        visibility: 'none'
    },
    paint: {
        'fill-color': 'rgba(0,0,0,0)',   // truly transparent
        'fill-outline-color': '#a0fa39'
    }
});

	//Cen Mass
map.addLayer({
    id: 'parcel highlight cen',
    type: 'fill',
    source: 'parcel highlight cen',
    'source-layer': '2026_Statewide_Parcels_cen-45u8b6',
    layout: {
        visibility: 'none'
    },
    paint: {
        'fill-color': 'rgba(0,0,0,0)',   // truly transparent
        'fill-outline-color': '#a0fa39'
    }
});
	
	//Salem Mass
map.addLayer({
    id: 'parcel highlight salem',
    type: 'fill',
    source: 'parcel highlight salem',
    'source-layer': '2026_Statewide_Parcels_salem-dybfc1',
    layout: {
        visibility: 'none'
    },
    paint: {
        'fill-color': 'rgba(0,0,0,0)',   // truly transparent
        'fill-outline-color': '#a0fa39'
    }
});

	//WEST Mass
map.addLayer({
    id: 'parcel highlight west',
    type: 'fill',
    source: 'parcel highlight west',
    'source-layer': '2026_Statewide_Parcels_west-bc729e',
    layout: {
        visibility: 'none'
    },
    paint: {
        'fill-color': 'rgba(0,0,0,0)',   // truly transparent
        'fill-outline-color': '#a0fa39'
    }
});

	//WILB Mass
map.addLayer({
    id: 'parcel highlight wilb',
    type: 'fill',
    source: 'parcel highlight wilb',
    'source-layer': '2026_Statewide_Parcels_wilb-dyq6sl',
    layout: {
        visibility: 'none'
    },
    paint: {
        'fill-color': 'rgba(0,0,0,0)',   // truly transparent
        'fill-outline-color': '#a0fa39'
    }
});

	//SS Mass 
map.addLayer({
    id: 'parcel highlight ss',
    type: 'fill',
    source: 'parcel highlight ss',
    'source-layer': '2026_Statewide_Parcels_ss-4s6wu9',
    layout: {
        visibility: 'none'
    },
    paint: {
        'fill-color': 'rgba(0,0,0,0)',   // truly transparent
        'fill-outline-color': '#a0fa39'
    }
});
	
}

addParcelHighlightLayer();