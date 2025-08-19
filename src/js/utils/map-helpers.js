// src/js/utils/map-helpers.js

/**
 * returns an array of layer ids that are currently visible on the map.
 * @param {object} map - the mapbox gl map instance.
 * @param {string[]} layerIds - an array of layer ids to check for visibility.
 * @returns {string[]} an array of visible layer ids.
 */
function listVisibleLayers(map, layerIds) {
    if (!Array.isArray(layerIds)) return [];
    return layerIds.filter(id => map.getLayer(id) && map.getLayoutProperty(id, 'visibility') === 'visible');
}