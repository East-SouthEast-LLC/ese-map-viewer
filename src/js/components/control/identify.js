// src/js/components/control/identify.js

const identifyButton = document.getElementById('identifyButton');
const identifyBox = document.getElementById('identify-box');

if (!identifyButton || !identifyBox) {
    console.error("Required elements not found for Identify tool.");
} else {

    function handleIdentifyClick(e) {
        console.log("Identify click fired at:", e.lngLat);

        identifyBox.innerHTML =
            `<strong>Identify Click Fired</strong><br>
             Lat: ${e.lngLat.lat}<br>
             Lng: ${e.lngLat.lng}`;

        identifyBox.style.display = 'block';
    }

    identifyButton.addEventListener('click', () => {
        console.log("Identify button clicked");

        map.once('click', handleIdentifyClick);
    });
}