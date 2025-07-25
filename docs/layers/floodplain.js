// docs/layers/floodplain.js

function addFloodplainLayer() {
    console.log('[debug] Initializing floodplain layer...');

    // add the fema national flood hazard layer as a vector tile source.
    map.addSource('fema-nfhl-vector', {
        'type': 'vector',
        'tiles': [
            'https://hazards.fema.gov/arcgis/rest/services/public/NFHLDFIRM/VectorTileServer/tile/{z}/{y}/{x}.pbf'
        ],
        'minzoom': 0,
        'maxzoom': 22
    });
    console.log('[debug] FEMA vector source added.');

    // add the primary fill layer for flood hazard zones.
    map.addLayer({
        'id': 'floodplain',
        'type': 'fill',
        'source': 'fema-nfhl-vector',
        'source-layer': 'S_Fld_Haz_Ar', 
        'layout': { 'visibility': 'none' },
        'paint': {
            'fill-opacity': [
                'match',
                ['get', 'ZONE_SUBTY'],
                '0.2 PCT ANNUAL CHANCE FLOOD HAZARD', 0.4,
                'AREA OF MINIMAL FLOOD HAZARD', 0.001,
                /* other */ 0.4
            ],
            'fill-color': [
                'match',
                ['get', 'FLD_ZONE'],
                'AE', '#eb8c34', 'VE', '#eb3a34', 'AO', '#F7FE20',
                'X', '#2578F9', 'A', '#2e4bf0',
                /* fallback */ '#ff0000'
            ]
        }
    }); // removed 'parcel-highlight' to avoid race condition.
    console.log('[debug] floodplain fill layer added.');
    
    // add a boundary line layer for the flood zones.
    map.addLayer({
        'id': 'floodplain-line',
        'type': 'line',
        'source': 'fema-nfhl-vector',
        'source-layer': 'S_Fld_Haz_Ar',
        'layout': { 'visibility': 'none' },
        'paint': {
            'line-color': '#000000',
            'line-width': 0.5,
            'line-opacity': 0.5
        }
    }); // removed 'parcel-highlight'
    console.log('[debug] floodplain-line layer added.');

    // add a layer for the limwa (limit of moderate wave action) line.
    map.addLayer({
        'id': 'LiMWA',
        'type': 'line',
        'source': 'fema-nfhl-vector',
        'source-layer': 'S_LiMWA',
        'layout': { 'visibility': 'none' },
        'paint': {
            'line-color': '#E70B0B',
            'line-width': 2.0
        }
    }); // removed 'parcel-highlight'
    console.log('[debug] LiMWA layer added.');

    // add a labels layer for the flood zones.
    map.addLayer({
        'id': 'floodplain-labels',
        'type': 'symbol',
        'source': 'fema-nfhl-vector',
        'source-layer': 'S_Fld_Haz_Ar',
        'layout': {
            'visibility': 'none',
            'text-field': [
                'case',
                ['!=', ['get', 'STATIC_BFE'], -9999],
                ['concat', ['get', 'FLD_ZONE'], ' (EL ', ['get', 'STATIC_BFE'], ')'],
                ['get', 'FLD_ZONE']
            ],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'symbol-placement': 'point'
        },
        'paint': {
            'text-color': '#000000',
            'text-halo-color': '#FFFFFF',
            'text-halo-width': 1.5
        }
    });
    console.log('[debug] floodplain-labels layer added.');

    // handle mouse enter/leave events for the pointer cursor.
    map.on('mouseenter', 'floodplain', function () {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'floodplain', function () {
        map.getCanvas().style.cursor = '';
    });

    // handle map clicks to show a popup with flood zone information.
    map.on('click', 'floodplain', function (e) {
        if (e.features.length > 0) {
            const props = e.features[0].properties;
            const popupContent = `
                <strong>Flood Zone:</strong> ${props.FLD_ZONE} (${props.ZONE_SUBTY || 'N/A'})<br>
                <strong>Base Flood Elevation:</strong> ${props.STATIC_BFE !== -9999 ? props.STATIC_BFE + ' ft' : 'Not Available'}
            `;
            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(popupContent)
                .addTo(map);
        }
    });
}

// add the new vector-based layer to the map.
addFloodplainLayer();