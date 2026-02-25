// coordinates.js
// simple coordinates tool placeholder
// ============================================================================

const coordinatesButton = document.getElementById('coordinatesButton');
const coordinatesBox = document.getElementById('coordinates-box');

let coordinatesMode = false;

if (coordinatesButton && coordinatesBox) {

    coordinatesButton.addEventListener('click', () => {
        coordinatesMode = !coordinatesMode;
        coordinatesButton.classList.toggle('active');

        if (coordinatesMode) {
            coordinatesBox.style.display = 'block';
            map.getCanvas().style.cursor = 'crosshair';
        } else {
            coordinatesBox.style.display = 'none';
            map.getCanvas().style.cursor = '';
        }
    });

    map.on('click', (e) => {
        if (!coordinatesMode) return;

        const { lat, lng } = e.lngLat;

        coordinatesBox.innerHTML = `
            <div class="coordinates-title">Coordinates</div>
            <div class="coordinates-item-row">WGS84 Lat: <span>${lat.toFixed(8)}</span></div>
            <div class="coordinates-item-row">WGS84 Lng: <span>${lng.toFixed(8)}</span></div>
        `;
    });
}