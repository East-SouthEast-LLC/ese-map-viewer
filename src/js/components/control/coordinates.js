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

function toDMS(dec) {
    const absolute = Math.abs(dec);
    const degrees = Math.floor(absolute);
    const minutesFull = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesFull);
    const secondsFull = (minutesFull - minutes) * 60;
    const seconds = secondsFull.toFixed(4);

    // pad minutes and seconds to 2 digits
    const m = String(minutes).padStart(2, '0');
    const s = String(seconds).padStart(2, '0').padStart(7, '0'); 
    // 7 total gives "00.0000" style after decimal

    const hemi = dec >= 0 ? '' : '';
    return `${degrees}°${m}'${s}"${hemi}`;
}


    function handleMapClick(e) {
        const { lat, lng } = e.lngLat;

coordinatesBox.innerHTML = `
    <div class="coord-title">Coordinates (WGS84 - DMS)</div>
    <div class="coord-row">
        <span class="coord-label">Lat:</span>
        <span class="coord-value">${toDMS(lat)}</span>
    </div>
    <div class="coord-row">
        <span class="coord-label">Lon:</span>
        <span class="coord-value">${toDMS(lng)}</span>
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