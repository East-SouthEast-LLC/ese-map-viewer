(function () {

    const coordinatesButton = document.getElementById('coordinatesButton');
    const coordinatesBox = document.getElementById('coordinates-box');

    if (!coordinatesButton || !coordinatesBox) {
        console.warn("coordinates tool: elements not found");
        return;
    }

    // always hide on startup
    coordinatesBox.style.display = 'none';

    // wait for map to exist
    if (!window.map) {
        console.warn("map not ready yet — coordinates tool will activate when map loads");
        return;
    }

    let active = false;

function toDMS(dec, type) {
    const absolute = Math.abs(dec);

    const degrees = Math.floor(absolute);
    const minutesFull = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesFull);
    const seconds = ((minutesFull - minutes) * 60).toFixed(4);

    const m = String(minutes).padStart(2, '0');
    const s = String(seconds).padStart(7, '0'); // ensures 00.0000

    let hemisphere = '';

    if (type === 'lat') {
        hemisphere = dec >= 0 ? 'N' : 'S';
    } else if (type === 'lon') {
        hemisphere = dec >= 0 ? 'E' : 'W';
    }

    return `${degrees}°${m}'${s}" ${hemisphere}`;
}


    function handleMapClick(e) {
        const { lat, lng } = e.lngLat;

coordinatesBox.innerHTML = `
    <div class="coord-title">Coordinates (WGS84 - DMS)</div>
    <div class="coord-row">
        <span class="coord-label">Lat:</span>
        <span class="coord-value">${toDMS(lat, 'lat')}</span>
    </div>
    <div class="coord-row">
        <span class="coord-label">Lon:</span>
        <span class="coord-value">${toDMS(lng, 'lon')}</span>
    </div>
`;
        coordinatesBox.style.display = 'block';
    }

    function enable() {
        active = true;
        coordinatesButton.classList.add('active');
        window.map.getCanvas().style.cursor = 'crosshair';
        window.map.on('click', handleMapClick);
    }

    function disable() {
        active = false;
        coordinatesButton.classList.remove('active');
        window.map.getCanvas().style.cursor = '';
        coordinatesBox.style.display = 'none';
        window.map.off('click', handleMapClick);
    }

    coordinatesButton.addEventListener('click', () => {
        active ? disable() : enable();
    });

})();