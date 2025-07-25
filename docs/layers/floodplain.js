// docs/layers/floodplain.js

function addFloodplainLayer() {
    // add the fema national flood hazard layer as a raster tile source.
    // this service provides the official, effective flood maps for the entire u.s.
    map.addSource('fema-nfhl', {
        'type': 'raster',
        'tiles': [
            'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/export?dpi=96&transparent=true&format=png8&layers=show:1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28&bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&f=image'
        ],
        'tileSize': 256
    });

    // add the raster layer to the map to display the floodplains.
    map.addLayer({
        'id': 'floodplain',
        'type': 'raster',
        'source': 'fema-nfhl',
        'paint': {
            'raster-opacity': 0.5
        },
        'layout': {
            'visibility': 'none'
        }
    }, 'satellite'); // ensures the floodplain layer is placed correctly relative to satellite imagery.

    // keep the mouse pointer functionality for interactivity.
    map.on('mouseenter', 'floodplain', function () {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'floodplain', function () {
        map.getCanvas().style.cursor = '';
    });

    // handle map clicks to identify flood zone information.
    map.on('click', 'floodplain', function (e) {
        // construct the url to query the fema service at the clicked location.
        const queryUrl = `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/identify?geometry=${e.lngLat.lng},${e.lngLat.lat}&geometryType=esriGeometryPoint&sr=4326&layers=all&tolerance=3&mapExtent=${map.getBounds().toArray().flat().join(',')}&imageDisplay=600,550,96&returnGeometry=false&f=json`;

        fetch(queryUrl)
            .then(response => response.json())
            .then(data => {
                if (data.results && data.results.length > 0) {
                    // find the flood hazard zone result from the query.
                    const floodZoneInfo = data.results.find(res => res.layerName === 'Flood Hazard Zones');
                    if (floodZoneInfo) {
                        const props = floodZoneInfo.attributes;
                        const popupContent = `
                            <strong>Flood Zone:</strong> ${props['Zone']} (${props['Zone Subtype'] || 'N/A'})<br>
                            <strong>Base Flood Elevation:</strong> ${props['BFE'] !== ' ' ? props['BFE'] + ' ft' : 'Not Available'}
                        `;
                        new mapboxgl.Popup()
                            .setLngLat(e.lngLat)
                            .setHTML(popupContent)
                            .addTo(map);
                    }
                }
            })
            .catch(err => console.error("error fetching fema data: ", err));
    });
}

// add the layer to the map.
addFloodplainLayer();