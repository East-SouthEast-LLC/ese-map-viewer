// docs/layers/panoramas.js

// make panoramaOrder a global variable
window.panoramaOrder = [];

async function addPanoramasLayer() {
    try {
        const response = await fetch('https://east-southeast-llc.github.io/ese-map-viewer/assets/data/pano_correction_data.json');
        const panoData = await response.json();

        proj4.defs("EPSG:26986", "+proj=lcc +lat_1=42.68333333333333 +lat_2=41.71666666666667 +lat_0=41 +lon_0=-71.5 +x_0=200000 +y_0=750000 +ellps=GRS80 +datum=NAD83 +units=m +no_defs");
        proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

        const features = Object.entries(panoData).map(([filename, data]) => {
            const sourceCoords = [data.position.x, data.position.y];
            const destCoords = proj4("EPSG:26986", "EPSG:4326", sourceCoords);
            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: destCoords 
                },
                properties: {
                    filename: filename
                }
            };
        });

        // create the ordered list of panorama filenames
        window.panoramaOrder = features.map(feature => feature.properties.filename);

        const geojsonData = {
            type: 'FeatureCollection',
            features: features
        };

        map.addSource('panoramas-source', {
            type: 'geojson',
            data: geojsonData,
            promoteId: 'filename'
        });

        map.addLayer({
            id: 'panoramas',
            type: 'circle',
            source: 'panoramas-source',
            layout: {
                'visibility': 'none'
            },
            paint: {
                'circle-radius': [
                    'case',
                    ['boolean', ['feature-state', 'viewed'], false],
                    10,
                    6
                ],
                'circle-color': [
                    'case',
                    ['boolean', ['feature-state', 'viewed'], false],
                    '#FFFF00',
                    '#00ffff'
                ],
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 2,
                'circle-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'viewed'], false],
                    0.9,
                    0.7
                ],
                'circle-pitch-scale': 'map'
            }
        });

        // change the cursor to a pointer when the mouse is over the panoramas layer.
        map.on('mouseenter', 'panoramas', () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        // change it back to a pointer when it leaves.
        map.on('mouseleave', 'panoramas', () => {
            map.getCanvas().style.cursor = '';
        });

    } catch (error) {
        console.error("failed to load and create panoramas layer:", error);
    }
}

addPanoramasLayer();