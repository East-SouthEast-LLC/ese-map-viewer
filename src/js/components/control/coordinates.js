// coordinates.js
const coordinatesButton = document.getElementById('coordinatesButton');
const coordinatesBox = document.getElementById('coordinates-box');

if (coordinatesButton && coordinatesBox) {

    coordinatesButton.addEventListener('click', () => {

        // toggle active state (optional UI feedback)
        const isActive = coordinatesButton.classList.contains('active');

        if (isActive) {
            coordinatesButton.classList.remove('active');
            coordinatesBox.style.display = 'none';
            return;
        }

        coordinatesButton.classList.add('active');

        if (window.map) {
            const center = window.map.getCenter();
            const lat = center.lat.toFixed(6);
            const lng = center.lng.toFixed(6);

            coordinatesBox.innerHTML = `
                <strong>Coordinates (WGS84)</strong><br>
                Lat: ${lat}<br>
                Lon: ${lng}
            `;
            coordinatesBox.style.display = 'block';
        }
    });
}