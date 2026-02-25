(function () {

    const coordinatesButton = document.getElementById('coordinatesButton');
    const coordinatesBox = document.getElementById('coordinates-box');

    if (!coordinatesButton || !coordinatesBox || !window.map) {
        console.warn("coordinates tool: elements or map not found");
        if (coordinatesBox) coordinatesBox.style.display = 'none';
        return;
    }

    let active = false;
    let collectedPoints = [];

    // hide on startup
    coordinatesBox.style.display = 'none';

    function toDMS(dec, type) {
        const absolute = Math.abs(dec);

        const degrees = Math.floor(absolute);
        const minutesFull = (absolute - degrees) * 60;
        const minutes = Math.floor(minutesFull);
        const seconds = ((minutesFull - minutes) * 60).toFixed(4);

        const m = String(minutes).padStart(2, '0');
        const s = String(seconds).padStart(7, '0');

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

    const latDMS = toDMS(lat, 'lat');
    const lngDMS = toDMS(lng, 'lon');

    const description = prompt("Enter point description:");

    if (!description) return;

    const point = {
        description,
        latDecimal: lat,
        lonDecimal: lng,
        latDMS,
        lonDMS: lngDMS
    };

    collectedPoints.push(point);

    coordinatesBox.innerHTML = `
        <div class="coord-title">Last Point</div>
        <div class="coord-row">
            <span class="coord-label">Desc:</span>
            <span class="coord-value">${description}</span>
        </div>
        <div class="coord-row">
            <span class="coord-label">Lat:</span>
            <span class="coord-value">${latDMS}</span>
        </div>
        <div class="coord-row">
            <span class="coord-label">Lon:</span>
            <span class="coord-value">${lngDMS}</span>
        </div>
        <button id="copyCoords">Copy</button>
        <button id="exportCSV">Export CSV</button>
    `;

    coordinatesBox.style.display = 'block';

    document.getElementById('copyCoords').onclick = () => {
        navigator.clipboard.writeText(
            `${description}, ${latDMS}, ${lngDMS}`
        );
    };

    document.getElementById('exportCSV').onclick = exportToCSV;
}

function exportToCSV() {
    if (!collectedPoints.length) {
        alert("No points to export.");
        return;
    }

    let csv = "Description,Latitude (Decimal),Longitude (Decimal),Latitude (DMS),Longitude (DMS)\n";

    collectedPoints.forEach(p => {
        csv += `"${p.description}",${p.latDecimal},${p.lonDecimal},"${p.latDMS}","${p.lonDMS}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "coordinates_export.csv";
    link.click();

    URL.revokeObjectURL(url);
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