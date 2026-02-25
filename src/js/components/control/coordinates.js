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

    function handleMapClick(e) {
        const { lat, lng } = e.lngLat;

        coordinatesBox.innerHTML = `
            <strong>Coordinates (WGS84)</strong><br>
            Lat: ${lat.toFixed(6)}<br>
            Lon: ${lng.toFixed(6)}
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