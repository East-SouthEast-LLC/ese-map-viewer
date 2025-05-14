// point.js — controls for dropping and removing markers

let placingPoint = false;
let marker = null;
const markerCoordinates = { lat: null, lng: null };

function setPinPosition(lat, lng) {
    markerCoordinates.lat = lat;
    markerCoordinates.lng = lng;
    console.log("Pin position updated:", markerCoordinates);
}

function getMarkerCoordinates() {
    if (marker) {
        let { lng, lat } = marker.getLngLat();
        return { lng, lat };
    }
    return null;
}

function dropPinAtCenter() {
    const frameCoords = getFrameCoordinates(map);
    const centerLngLat = frameCoords.middle;

    if (!marker) {
        marker = new mapboxgl.Marker().setLngLat(centerLngLat).addTo(map);
        console.log("Marker dropped at visual center:", centerLngLat);
    } else {
        map.flyTo({ center: marker.getLngLat(), essential: true });
        console.log("Map recentered to existing marker.");
    }

    markerCoordinates.lng = centerLngLat.lng;
    markerCoordinates.lat = centerLngLat.lat;

    return markerCoordinates;
}



// Point button: activate placement mode
document.getElementById('pointButton').addEventListener('click', function () {
    placingPoint = true;
    map.getCanvas().style.cursor = 'crosshair';
    console.log("Click on the map to drop a point.");
});

// Map click: drop point if active
map.on('click', function (event) {
    if (!placingPoint) return;
    const { lat, lng } = event.lngLat;
    setPinPosition(lat, lng);

    if (marker) marker.remove();
    marker = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);

    placingPoint = false;
    map.getCanvas().style.cursor = '';
});

// Center point button
document.getElementById('pointCButton').addEventListener('click', function () {
    const center = dropPinAtCenter();
    console.log("Centered marker at:", center);
});

// Point off button
document.getElementById('pointOffButton').addEventListener('click', function () {
    if (marker) {
        marker.remove();
        marker = null;
    }
    markerCoordinates.lat = null;
    markerCoordinates.lng = null;
    console.log("Marker removed.");
});
