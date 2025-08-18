// /src/js/components/control/button.js

// 'placingPoint', 'marker', and 'markerCoordinates' are now managed in town-loader.js

function setPinPosition(lat, lng) {
    // check if the global markercoordinates object exists before setting
    if (window.markerCoordinates) {
        window.markerCoordinates.lat = lat;
        window.markerCoordinates.lng = lng;
    }
}

function dropPinAtCenter() {
    // uses the global 'marker' and 'map' variables from town-loader.js
    if (window.marker) {
        let { lng, lat } = window.marker.getLngLat();
        window.markerCoordinates.lng = lng;
        window.markerCoordinates.lat = lat;
        window.map.flyTo({ center: window.markerCoordinates, essential: true });
    } else {
        window.marker = new mapboxgl.Marker().setLngLat(window.map.getCenter()).addTo(window.map);
        window.markerCoordinates.lng = window.map.getCenter().lng;
        window.markerCoordinates.lat = window.map.getCenter().lat;
    }
    return window.markerCoordinates;
}

document.getElementById('pointButton').addEventListener('click', function () {
    window.placingPoint = true; // sets the global variable
    this.classList.add('active');
    window.map.getCanvas().style.cursor = 'crosshair';
});

document.getElementById('pointCButton').addEventListener('click', () => dropPinAtCenter());

document.getElementById('pointOffButton').addEventListener('click', () => {
    if (window.marker) {
        window.marker.remove();
        window.marker = null;
    }
    document.getElementById('pointButton').classList.remove('active');
    window.markerCoordinates.lat = null;
    window.markerCoordinates.lng = null;
});

function listVisibleLayers(map, layerIds) {
    if (!Array.isArray(layerIds)) return [];
    return layerIds.filter(id => map.getLayer(id) && map.getLayoutProperty(id, 'visibility') === 'visible');
}