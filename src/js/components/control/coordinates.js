document.addEventListener('DOMContentLoaded', () => {

    const coordinatesButton = document.getElementById('coordinatesButton');
    const coordinatesBox = document.getElementById('coordinates-box');

    if (!coordinatesButton || !coordinatesBox || !window.map) {
        console.warn("coordinates elements or map not found");
        return;
    }

    coordinatesButton.addEventListener('click', () => {

        const isActive = coordinatesButton.classList.contains('active');

        if (isActive) {
            // turning off
            coordinatesButton.classList.remove('active');
            coordinatesBox.style.display = 'none';

            // reset cursor
            window.map.getCanvas().style.cursor = '';
            return;
        }

        // turning on
        coordinatesButton.classList.add('active');

        // crosshair cursor
        window.map.getCanvas().style.cursor = 'crosshair';

        const center = window.map.getCenter();
        coordinatesBox.innerHTML = `
            <strong>Coordinates (WGS84)</strong><br>
            Lat: ${center.lat.toFixed(6)}<br>
            Lon: ${center.lng.toFixed(6)}
        `;
        coordinatesBox.style.display = 'block';
    });
});