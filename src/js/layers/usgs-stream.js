// src/js/layers/usgs-stream.js

function initializeUsgsStream() {
    if (map.getSource('usgs-stream-source')) return;

    map.addSource('usgs-stream-source', {
        type: 'raster',
        tiles: ['https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: 'USGS The National Map'
    });

    map.addLayer({
        id: 'usgs-stream-layer',
        type: 'raster',
        source: 'usgs-stream-source',
        paint: {
            'raster-opacity': 0.85,
            'raster-fade-duration': 0
        }
    }, 'satellite');
}

function deinitializeUsgsStream() {
    if (map.getLayer('usgs-stream-layer')) map.removeLayer('usgs-stream-layer');
    if (map.getSource('usgs-stream-source')) map.removeSource('usgs-stream-source');
}

window.initializeUsgsStream = initializeUsgsStream;
window.deinitializeUsgsStream = deinitializeUsgsStream;
