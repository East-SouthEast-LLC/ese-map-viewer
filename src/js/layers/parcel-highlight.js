function addParcelHighlightLayer() {

    const parcels = [
        {
            id: 'parcel highlight',
            sourceLayer: '2026_Statewide_Parcels_brain-58henn',
            url: 'mapbox://ese-toh.71nvl5kq'
        },
        {
            id: 'parcel highlight cc',
            sourceLayer: '2026_Statewide_Parcels_cc-5jy337',
            url: 'mapbox://ese-toh.cxvs0pej'
        },
        {
            id: 'parcel highlight marsh',
            sourceLayer: '2026_Statewide_Parcels_marsh-d5rfkr',
            url: 'mapbox://ese-toh.3b7hwfjm'
        },
        {
            id: 'parcel highlight cen',
            sourceLayer: '2026_Statewide_Parcels_cen-45u8b6',
            url: 'mapbox://ese-toh.cs2vjhk0'
        },
		{
            id: 'parcel highlight salem',
            sourceLayer: '2026_Statewide_Parcels_salem-dybfc1',
            url: 'mapbox://ese-toh.bfeflzh4'
        },
        {
            id: 'parcel highlight west',
            sourceLayer: '2026_Statewide_Parcels_west-bc729e',
            url: 'mapbox://ese-toh.5145412c'
        },
        {
            id: 'parcel highlight wilb',
            sourceLayer: '2026_Statewide_Parcels_wilb-dyq6sl',
            url: 'mapbox://ese-toh.b2yjtsvz'
        },
        {
            id: 'parcel highlight ss',
            sourceLayer: '2026_Statewide_Parcels_ss-4s6wu9',
            url: 'mapbox://ese-toh.9geeudeh'
        }
    ];

    parcels.forEach(p => {
        map.addSource(p.id, {
            type: 'vector',
            url: p.url
        });

        map.addLayer({
            id: p.id,
            type: 'line',
            source: p.id,
            'source-layer': p.sourceLayer,
            layout: {
                visibility: 'none',
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#a0fa39',
                'line-width': 1.5
            }
        });
    });
}

addParcelHighlightLayer();

