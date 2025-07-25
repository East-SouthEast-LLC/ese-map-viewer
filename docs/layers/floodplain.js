// docs/layers/floodplain.js

function addFloodplainLayer() {
    console.log('[debug] floodplain.js script loaded. waiting for the map to be idle...');

    // we use a flag to ensure this logic only runs once.
    let floodplainLayersAdded = false;

    const addLayers = () => {
        // if the layers have already been added, or if the source somehow already exists, exit.
        if (floodplainLayersAdded || map.getSource('fema-nfhl-vector')) {
            map.off('idle', addLayers); // remove the listener if it's no longer needed.
            return;
        }
        
        // we can only add the floodplain layers if our reference layer exists.
        if (map.getLayer('parcel-highlight')) {
            console.log('[debug] map is idle and parcel-highlight exists. adding floodplain layers now.');

            // add the fema vector tile source.
            map.addSource('fema-nfhl-vector', {
                'type': 'vector',
                'tiles': [
                    'https://hazards.fema.gov/arcgis/rest/services/public/NFHLDFIRM/VectorTileServer/tile/{z}/{y}/{x}.pbf'
                ],
                'minzoom': 0,
                'maxzoom': 22
            });

            // add the primary fill layer before the parcel-highlight layer.
            map.addLayer({
                'id': 'floodplain',
                'type': 'fill',
                'source': 'fema-nfhl-vector',
                'source-layer': 'S_Fld_Haz_Ar', 
                'layout': { 'visibility': 'none' },
                'paint': {
                    'fill-opacity': [
                        'match',
                        ['get', 'ZONE_SUBTY'],'0.2 PCT ANNUAL CHANCE FLOOD HAZARD', 0.4, 'AREA OF MINIMAL FLOOD HAZARD', 0.001, 0.4
                    ],
                    'fill-color': [
                        'match',
                        ['get', 'FLD_ZONE'],'AE', '#eb8c34', 'VE', '#eb3a34', 'AO', '#F7FE20','X', '#2578F9', 'A', '#2e4bf0','#ff0000'
                    ]
                }
            }, 'parcel-highlight');
            
            // add the boundary line layer.
            map.addLayer({
                'id': 'floodplain-line',
                'type': 'line',
                'source': 'fema-nfhl-vector',
                'source-layer': 'S_Fld_Haz_Ar',
                'layout': { 'visibility': 'none' },
                'paint': { 'line-color': '#000000', 'line-width': 0.5, 'line-opacity': 0.5 }
            }, 'parcel-highlight');

            // add the limwa line layer.
            map.addLayer({
                'id': 'LiMWA',
                'type': 'line',
                'source': 'fema-nfhl-vector',
                'source-layer': 'S_LiMWA',
                'layout': { 'visibility': 'none' },
                'paint': { 'line-color': '#E70B0B', 'line-width': 2.0 }
            }, 'parcel-highlight');

            // add the labels layer (this can go on top of other layers).
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
                    'text-size': 12, 'symbol-placement': 'point'
                },
                'paint': { 'text-color': '#000000', 'text-halo-color': '#FFFFFF', 'text-halo-width': 1.5 }
            });

            floodplainLayersAdded = true; // set the flag to true.
            map.off('idle', addLayers);   // remove the listener so this logic doesn't run again.
        }
    };

    // this listener waits for the map to finish loading/moving/zooming before it runs.
    map.on('idle', addLayers);

    // handle mouse enter/leave events for the pointer cursor.
    map.on('mouseenter', 'floodplain', function () { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'floodplain', function () { map.getCanvas().style.cursor = ''; });

    // handle map clicks to show a popup with flood zone information.
    map.on('click', 'floodplain', function (e) {
        if (e.features.length > 0) {
            const props = e.features[0].properties;
            const popupContent = `
                <strong>Flood Zone:</strong> ${props.FLD_ZONE} (${props.ZONE_SUBTY || 'N/A'})<br>
                <strong>Base Flood Elevation:</strong> ${props.STATIC_BFE !== -9999 ? props.STATIC_BFE + ' ft' : 'Not Available'}
            `;
            new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(popupContent).addTo(map);
        }
    });
}

// call the function to set up the layer addition logic.
addFloodplainLayer();