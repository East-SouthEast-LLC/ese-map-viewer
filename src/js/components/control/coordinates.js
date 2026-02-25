document.addEventListener('DOMContentLoaded', () => {

    const coordinatesButton = document.getElementById('coordinatesButton');
    const coordinatesBox = document.getElementById('coordinates-box');

    if (!coordinatesButton || !coordinatesBox) {
        console.warn("coordinates elements not found");
        return;
    }

    coordinatesButton.addEventListener('click', () => {

        const isActive = coordinatesButton.classList.contains('active');

        if (isActive) {
            coordinatesButton.classList.remove('active');
            coordinatesBox.style.display = 'none';
            return;
        }

        coordinatesButton.classList.add('active');

        if (window.map) {
            const center = window.map.getCenter();
            coordinatesBox.innerHTML = `
                <strong>Coordinates (WGS84)</strong><br>
                Lat: ${center.lat.toFixed(6)}<br>
                Lon: ${center.lng.toFixed(6)}
            `;
            coordinatesBox.style.display = 'block';
        }
    });
});