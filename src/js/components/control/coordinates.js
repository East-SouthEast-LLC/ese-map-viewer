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

function toDMS(decimal) {
    const abs = Math.abs(decimal);
    const degrees = Math.floor(abs);
    const minutesFloat = (abs - degrees) * 60;
    const minutes = Math.floor(minutesFloat);
    const seconds = (minutesFloat - minutes) * 60;

    const sign = decimal < 0 ? "-" : "";

    return `${sign}${degrees}°${minutes}'${seconds.toFixed(4)}"`;
}


    function handleMapClick(e) {
        const { lat, lng } = e.lngLat;

coordinatesBox.innerHTML = `
    <strong>Coordinates (WGS84 - DMS)</strong><br>
    Lat: ${toDMS(lat)}<br>
    Lon: ${toDMS(lng)}
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