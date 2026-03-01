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
    let labelCounter = 65; // ASCII 'A'

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

    function showConfirmPopup(x, y, message, callback) {
        const popup = document.createElement("div");
        popup.className = "coord-confirm";
        popup.style.position = "absolute";
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        popup.style.background = "#fff";
        popup.style.border = "1px solid #ccc";
        popup.style.padding = "4px 6px";
        popup.style.zIndex = 9999;
        popup.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
        popup.style.fontSize = "12px";

        popup.innerHTML = `
            <div style="margin-bottom:4px;">${message}</div>
            <div style="text-align:right;">
                <button id="confirmNo">No</button>
                <button id="confirmYes" style="margin-left:4px;">Yes</button>
            </div>
        `;

        document.body.appendChild(popup);

        popup.querySelector("#confirmNo").onclick = () => {
            document.body.removeChild(popup);
            callback(false);
        };

        popup.querySelector("#confirmYes").onclick = () => {
            document.body.removeChild(popup);
            callback(true);
        };
    }

    function refreshMapPoints() {
        if (!window.map.getSource('user-points')) return;

        const geojson = {
            type: "FeatureCollection",
            features: collectedPoints.map((pt, index) => ({
                type: "Feature",
                properties: {
                    label: String.fromCharCode(65 + index)
                },
                geometry: {
                    type: "Point",
                    coordinates: [pt.lonDecimal, pt.latDecimal]
                }
            }))
        };

        window.map.getSource('user-points').setData(geojson);
    }

    function renderPointsList() {
        if (!collectedPoints.length) {
            coordinatesBox.innerHTML = "<em>No points yet.</em>";
            return;
        }

        let html = `<div class="coord-title">Points</div>`;

        collectedPoints.forEach((p, index) => {
            html += `
                <div class="coord-row">
                    <button class="label-btn" data-index="${index}">${p.label}</button>
                    <button class="desc-btn" data-index="${index}">Description</button>
                    <button class="del-btn" data-index="${index}">Delete</button>
                </div>
            `;
        });

        html += `
            <button id="copyCoords">Copy CSV</button>
            <button id="exportCSV">Export CSV</button>
            <button id="clearCoords">Clear</button>
        `;

        coordinatesBox.innerHTML = html;

        document.querySelectorAll(".label-btn").forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.getAttribute("data-index"));
                const p = collectedPoints[idx];
                window.map.flyTo({ center: [p.lonDecimal, p.latDecimal], essential: true });
            };
        });

        document.querySelectorAll(".desc-btn").forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.getAttribute("data-index"));
                const p = collectedPoints[idx];

                const newDesc = prompt("Edit description:", p.description);
                if (newDesc !== null) {
                    p.description = newDesc;
                    renderPointsList();
                }
            };
        });

        document.querySelectorAll(".del-btn").forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();

                const idx = parseInt(btn.getAttribute("data-index"));
                const rect = e.target.getBoundingClientRect();
                const x = rect.left + rect.width;
                const y = rect.top;

                showConfirmPopup(x, y, "Delete this point?", (ok) => {
                    if (!ok) return;

                    collectedPoints.splice(idx, 1);

                    refreshMapPoints();
                    renderPointsList();
                });
            };
        });

        document.getElementById('exportCSV').onclick = exportToCSV;

        document.getElementById('copyCoords').onclick = () => {
            const csv = collectedPoints.map(p =>
                `"${p.label}","${p.description}",${p.latDecimal},${p.lonDecimal},"${p.latDMS}","${p.lonDMS}"`
            ).join("\n");

            navigator.clipboard.writeText(csv).then(() => {
                alert("Copied to clipboard");
            });
        };

        document.getElementById('clearCoords').onclick = () => {
            if (!confirm("Clear all points?")) return;

            collectedPoints = [];
            labelCounter = 65;

            refreshMapPoints();
            renderPointsList();
        };
    }

    function handleMapClick(e) {
        const { lat, lng } = e.lngLat;

        const latDMS = toDMS(lat, 'lat');
        const lngDMS = toDMS(lng, 'lon');

        const label = String.fromCharCode(labelCounter);
        labelCounter++;

        const point = {
            label,
            description: "",
            latDecimal: lat,
            lonDecimal: lng,
            latDMS,
            lonDMS: lngDMS
        };

        collectedPoints.push(point);

        refreshMapPoints();
        renderPointsList();
        coordinatesBox.style.display = 'block';
    }

    function exportToCSV() {
        if (!collectedPoints.length) {
            alert("No points to export.");
            return;
        }

        let csv = "Label,Description,Latitude (Decimal),Longitude (Decimal),Latitude (DMS),Longitude (DMS)\n";

        collectedPoints.forEach(p => {
            csv += `"${p.label}","${p.description}",${p.latDecimal},${p.lonDecimal},"${p.latDMS}","${p.lonDMS}"\n`;
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

        function addSourceAndLayers() {
            if (!window.map.getSource('user-points')) {
                window.map.addSource('user-points', {
                    type: 'geojson',
                    data: { type: "FeatureCollection", features: [] }
                });
            }

            if (!window.map.getLayer('user-points-layer')) {
window.map.addLayer({
    id: 'user-points-layer',
    type: 'symbol',
    source: 'user-points',
    layout: {
        'text-field': '✕',
        'text-size': 16,
        'text-anchor': 'center'
    },
    paint: {
        'text-color': '#ff0000'
    }
});
            }

            refreshMapPoints();
        }

        if (window.map.isStyleLoaded()) {
            addSourceAndLayers();
        } else {
            window.map.once('load', addSourceAndLayers);
        }

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