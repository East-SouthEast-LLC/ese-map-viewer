// docs/layers/floodplain.js

function addFloodplainLayer() {
    // add the fema national flood hazard layer as a vector tile source.
    // this service provides the official, effective flood map data for the entire u.s.
    map.addSource('fema-nfhl-vector', {
        'type': 'vector',
        'tiles': [
            'https://hazards.fema.gov/arcgis/rest/services/public/NFHLDFIRM/VectorTileServer/tile/{z}/{y}/{x}.pbf'
        ],
        'minzoom': 0,
        'maxzoom': 22
    });

    // add the primary fill layer for flood hazard zones.
    // we are styling this exactly like the original static data layer.
    map.addLayer({
        'id': 'floodplain',
        'type': 'fill',
        'source': 'fema-nfhl-vector',
        'source-layer': 'S_Fld_Haz_Ar', // this is the specific data layer within the tileset for flood zones.
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
                'AE', '#eb8c34',
                'VE', '#eb3a34',
                'AO', '#F7FE20',
                'X', '#2578F9',
                'A', '#2e4bf0',
                /* fallback */ '#ff0000'
            ]
        }
    }, 'satellite'); // ensures this layer is placed under labels but over the satellite imagery.
    
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
    }, 'satellite');

    // add mouse enter/leave events for the pointer cursor.
    map.on('mouseenter', 'floodplain', function () {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'floodplain', function () {
        map.getCanvas().style.cursor = '';
    });

    // handle map clicks to show a popup with flood zone information.
    // this now uses queryrenderedfeatures, which is more efficient for vector data.
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