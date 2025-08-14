// This script manages the dynamic loading and unloading of USGS image tiles.

// Global state to hold all tile metadata and track loaded tiles
let allUsgsTiles = [];
const loadedUsgsTiles = new Set();
window.usgsTilesInitialized = false;

function getTileBounds(tile) {
    const [pixelWidth, , , pixelHeight, originLng, originLat] = tile.jgw;
    const { width, height } = tile;

    const minLng = originLng - (pixelWidth / 2);
    const maxLat = originLat - (pixelHeight / 2);
    const maxLng = minLng + (width * pixelWidth);
    const minLat = maxLat + (height * pixelHeight);

    return { west: minLng, south: minLat, east: maxLng, north: maxLat };
}

function updateVisibleUsgsTiles() {
    if (!window.usgsTilesInitialized) return;

    const currentZoom = map.getZoom();

    if (currentZoom < 12) {
        loadedUsgsTiles.forEach(tileName => {
            removeTileFromMap(`usgs-tile-source-${tileName}`);
        });
        loadedUsgsTiles.clear();
        return;
    }

    const mapBounds = map.getBounds();

    allUsgsTiles.forEach(tile => {
        const tileBounds = tile.bounds;
        const sourceId = `usgs-tile-source-${tile.name}`;

        const isVisible =
            mapBounds.getWest() < tileBounds.east &&
            mapBounds.getEast() > tileBounds.west &&
            mapBounds.getSouth() < tileBounds.north &&
            mapBounds.getNorth() > tileBounds.south;

        if (isVisible) {
            if (!loadedUsgsTiles.has(tile.name)) {
                addTileToMap(tile, sourceId);
                loadedUsgsTiles.add(tile.name);
            }
        } else {
            if (loadedUsgsTiles.has(tile.name)) {
                removeTileFromMap(sourceId);
                loadedUsgsTiles.delete(tile.name);
            }
        }
    });
}

function addTileToMap(tile, sourceId) {
    const imageUrl = `https://www.ese-llc.com/s/${tile.name}.jpg`;
    
    if (map.getSource(sourceId)) return;

    map.addSource(sourceId, {
        type: 'image',
        url: imageUrl,
        coordinates: [
            [tile.bounds.west, tile.bounds.north],
            [tile.bounds.east, tile.bounds.north],
            [tile.bounds.east, tile.bounds.south],
            [tile.bounds.west, tile.bounds.south]
        ]
    });

    map.addLayer({
        id: sourceId,
        type: 'raster',
        source: sourceId,
        paint: { 'raster-opacity': 0.85, 'raster-fade-duration': 0 }
    }, 'satellite');
}

function removeTileFromMap(sourceId) {
    if (map.getLayer(sourceId)) {
        map.removeLayer(sourceId);
    }
    if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
    }
}

function initializeUsgsTileManager() {
    if (window.usgsTilesInitialized) {
        updateVisibleUsgsTiles();
        return;
    }

    const indexUrl = 'https://east-southeast-llc.github.io/ese-map-viewer/assets/data/usgs_tiles.json';

    fetch(indexUrl)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            allUsgsTiles = data;
            allUsgsTiles.forEach(tile => {
                tile.bounds = getTileBounds(tile);
            });

            window.usgsTilesInitialized = true;
            console.log("USGS Tile Manager Initialized.");
            
            updateVisibleUsgsTiles();

            map.on('moveend', updateVisibleUsgsTiles);
            map.on('zoomend', updateVisibleUsgsTiles);
        })
        .catch(error => {
            console.error("Failed to load USGS tile index:", error);
        });
}

function deinitializeUsgsTileManager() {
    if (!window.usgsTilesInitialized) return;

    loadedUsgsTiles.forEach(tileName => {
        removeTileFromMap(`usgs-tile-source-${tileName}`);
    });
    loadedUsgsTiles.clear();
    
    map.off('moveend', updateVisibleUsgsTiles);
    map.off('zoomend', updateVisibleUsgsTiles);

    window.usgsTilesInitialized = false;
    console.log("USGS Tile Manager Deinitialized.");
}

// Make functions globally available
window.initializeUsgsTileManager = initializeUsgsTileManager;
window.deinitializeUsgsTileManager = deinitializeUsgsTileManager;