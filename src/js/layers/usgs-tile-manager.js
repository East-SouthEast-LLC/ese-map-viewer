// src/js/layers/usgs-tile-manager.js

// global state to hold all tile metadata and track loaded tiles
let allUsgsTiles = [];
const loadedUsgsTiles = new Set();
window.usgsTilesInitialized = false;

/**
 * calculates the geographic bounding box of a tile from its jgw (world file) data.
 * @param {object} tile - the tile metadata object.
 * @returns {object} an object with north, south, east, and west bounds.
 */
function getTileBounds(tile) {
    const [pixelWidth, , , pixelHeight, originLng, originLat] = tile.jgw;
    const { width, height } = tile;

    const minLng = originLng - (pixelWidth / 2);
    const maxLat = originLat - (pixelHeight / 2);
    const maxLng = minLng + (width * pixelWidth);
    const minLat = maxLat + (height * pixelHeight);

    return { west: minLng, south: minLat, east: maxLng, north: maxLat };
}

/**
 * checks which usgs tiles are visible in the current map view,
 * dynamically adding or removing them as needed.
 * returns a promise that resolves only after any newly added tiles are fully rendered.
 */
async function updateVisibleUsgsTiles() {
    if (!window.usgsTilesInitialized) return;

    const currentZoom = map.getZoom();

    // performance optimization: do not show tiles at low zoom levels.
    if (currentZoom < 12) {
        loadedUsgsTiles.forEach(tileName => {
            removeTileFromMap(`usgs-tile-source-${tileName}`);
        });
        loadedUsgsTiles.clear();
        return; // return a resolved promise implicitly
    }

    const mapBounds = map.getBounds();
    let tilesToLoad = 0;

    allUsgsTiles.forEach(tile => {
        const tileBounds = tile.bounds;
        const sourceId = `usgs-tile-source-${tile.name}`;

        const isVisible =
            mapBounds.getWest() < tileBounds.east &&
            mapBounds.getEast() > tileBounds.west &&
            mapBounds.getSouth() < tileBounds.north &&
            mapBounds.getNorth() > tileBounds.south;

        if (isVisible) {
            // if the tile should be visible but isn't loaded, add it.
            if (!loadedUsgsTiles.has(tile.name)) {
                tilesToLoad++;
                addTileToMap(tile, sourceId);
                loadedUsgsTiles.add(tile.name);
            }
        } else {
            // if the tile is loaded but no longer visible, remove it.
            if (loadedUsgsTiles.has(tile.name)) {
                removeTileFromMap(sourceId);
                loadedUsgsTiles.delete(tile.name);
            }
        }
    });

    // if new tiles were added, wait for them to be fully rendered before resolving the promise.
    // this is critical for preventing race conditions during printing.
    if (tilesToLoad > 0) {
        console.log("usgs tile manager: waiting for new tiles to render...");
        await new Promise(resolve => {
            map.once('idle', () => {
                // now that it's idle, wait for the next render to ensure it's painted
                map.once('render', resolve);
                // trigger a repaint just in case, to be certain a render event will fire
                map.triggerRepaint();
            });
        });
        console.log("usgs tile manager: tiles rendered.");
    }
}

/**
 * adds a single usgs tile image source and raster layer to the map.
 * @param {object} tile - the tile metadata object.
 * @param {string} sourceId - the unique id to use for the new map source and layer.
 */
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
    }, 'satellite'); // ensures tiles appear below labels and vector data
}

/**
 * removes a tile's layer and source from the map to free up resources.
 * @param {string} sourceId - the id of the source and layer to remove.
 */
function removeTileFromMap(sourceId) {
    if (map.getLayer(sourceId)) {
        map.removeLayer(sourceId);
    }
    if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
    }
}

/**
 * initializes the tile manager. fetches the tile index file, sets up event listeners,
 * and performs the initial tile load. returns a promise that resolves when complete.
 */
async function initializeUsgsTileManager() {
    // if already initialized, just update the visible tiles.
    if (window.usgsTilesInitialized) {
        await updateVisibleUsgsTiles();
        return;
    }

    const indexUrl = 'https://east-southeast-llc.github.io/ese-map-viewer/assets/data/usgs_tiles.json';

    try {
        const response = await fetch(indexUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        allUsgsTiles = data;
        allUsgsTiles.forEach(tile => {
            tile.bounds = getTileBounds(tile);
        });

        window.usgsTilesInitialized = true;
        console.log("USGS Tile Manager Initialized.");
        
        // perform the initial tile update and wait for it to complete.
        await updateVisibleUsgsTiles();

        // set up listeners to update tiles whenever the map view changes.
        map.off('moveend', updateVisibleUsgsTiles);
        map.off('zoomend', updateVisibleUsgsTiles);
        map.on('moveend', updateVisibleUsgsTiles);
        map.on('zoomend', updateVisibleUsgsTiles);
    } catch (error) {
        console.error("Failed to load USGS tile index:", error);
    }
}

/**
 * completely deactivates the usgs tile manager, removing all loaded tiles
 * and event listeners from the map.
 */
function deinitializeUsgsTileManager() {
    if (!window.usgsTilesInitialized) return;

    loadedUsgsTiles.forEach(tileName => {
        removeTileFromMap(`usgs-tile-source-${tileName}`);
    });
    loadedUsgsTiles.clear();
    
    map.off('moveend', updateVisibleUsgsTiles);
    map.off('zoomend', updateVisibleUsgsTiles);

    window.usgsTilesInitialized = false;
}

// make functions globally available so other scripts can call them
window.initializeUsgsTileManager = initializeUsgsTileManager;
window.deinitializeUsgsTileManager = deinitializeUsgsTileManager;