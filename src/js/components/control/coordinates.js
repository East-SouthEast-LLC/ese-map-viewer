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

    // Dropdown above the points list
    let html = `
        <div class="coord-title">Points Under Construction</div>

        <div class="coord-dropdown" style="margin-bottom:6px;">
            <label for="coordSystemSelect">Coordinate System:</label>
            <select id="coordSystemSelect">
                <option value="WGS84">WGS84</option>
                <option value="NAD83_USFt">NAD83 USFt</option>
                <option value="NAD83_m">NAD83 m</option>
                <option value="NAD27_USFt">NAD27 USFt</option>
                <option value="NAD27_m">NAD27 m</option>
                <option value="NARTF22_USFt">NARTF22 USFt</option>
                <option value="NARTF22_m">NARTF22 m</option>
            </select>
        </div>
    `;

    // Loop through points
    collectedPoints.forEach((p, index) => {
        const coordDisplay = convertCoordinates(p.latDecimal, p.lonDecimal, currentCoordSystem);

        html += `
            <div class="coord-row">

                <!-- label -->
                <button class="label-btn" data-index="${index}">
                    ${String.fromCharCode(65 + index)}
                </button>

                <!-- coordinates -->
                <div class="coord-values">
                    <div>${coordDisplay}</div>
                    <div>${p.latDMS}, ${p.lonDMS}</div>
                </div>

                <!-- action buttons -->
                <div class="coord-actions">
                    <button class="desc-btn">D</button>
                    <button class="del-btn">X</button>
                </div>

            </div>
        `;
    });

    // Footer buttons
    html += `
        <div class="coord-footer" style="margin-top:6px;">
            <button id="copyCoords" class="coord-main-btn">COPY</button>
            <button id="exportCSV" class="coord-main-btn">EXPORT</button>
            <button id="clearCoords" class="coord-main-btn">CLEAR</button>
        </div>
    `;

    coordinatesBox.innerHTML = html;

    // Coordinate system selection
    const select = document.getElementById('coordSystemSelect');
    select.value = currentCoordSystem;
    select.onchange = () => {
        currentCoordSystem = select.value;
        renderPointsList(); // re-render points with new system
    };

    // Delegated click events
    coordinatesBox.onclick = (e) => {
        const target = e.target;
        const row = target.closest('.coord-row');
        if (!row) return;

        const idx = parseInt(row.querySelector('.label-btn').dataset.index);
        const point = collectedPoints[idx];

        // Fly to point
        if (target.classList.contains('label-btn')) {
            window.map.flyTo({ center: [point.lonDecimal, point.latDecimal], essential: true });
        }

        // Edit description
        if (target.classList.contains('desc-btn')) {
            const newDesc = prompt("Edit description:", point.description);
            if (newDesc !== null) {
                point.description = newDesc;
                renderPointsList();
            }
        }

        // Delete point
        if (target.classList.contains('del-btn')) {
            const rect = target.getBoundingClientRect();
            const x = rect.left + rect.width;
            const y = rect.top;

            showConfirmPopup(x, y, "Delete this point?", (ok) => {
                if (!ok) return;

                collectedPoints.splice(idx, 1);
                refreshMapPoints();
                renderPointsList();
            });
        }
    };

    // Footer buttons
    document.getElementById('copyCoords').onclick = () => {
        const csv = collectedPoints.map((p, i) =>
            `"${String.fromCharCode(65 + i)}","${p.description}",${p.latDecimal},${p.lonDecimal}`
        ).join("\n");
        navigator.clipboard.writeText(csv).then(() => alert("Copied to clipboard"));
    };

    document.getElementById('exportCSV').onclick = exportToCSV;

    document.getElementById('clearCoords').onclick = () => {
        if (!confirm("Clear all points?")) return;
        collectedPoints = [];
        labelCounter = 65;
        refreshMapPoints();
        renderPointsList();
    };
}

// Stub for coordinate conversion
function convertCoordinates(lat, lon, system) {
    switch(system) {
        case 'WGS84':
            return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        case 'NAD83_USFt':
        case 'NAD83_m':
        case 'NAD27_USFt':
        case 'NAD27_m':
        case 'NARTF22_USFt':
        case 'NARTF22_m':
            // Placeholder: replace with actual projection conversion logic
            return `${lat.toFixed(3)}, ${lon.toFixed(3)} (${system})`;
        default:
            return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }
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
    // source
    if (!window.map.getSource('user-points')) {
        window.map.addSource('user-points', {
            type: 'geojson',
            data: { type: "FeatureCollection", features: [] }
        });
    }

    // remove old layers (if they exist)
    if (window.map.getLayer('user-points-layer')) {
        window.map.removeLayer('user-points-layer');
    }
    if (window.map.getLayer('user-points-label')) {
        window.map.removeLayer('user-points-label');
    }

    // circle dot layer
    window.map.addLayer({
        id: 'user-points-layer',
        type: 'circle',
        source: 'user-points',
        paint: {
            'circle-radius': 6,
            'circle-stroke-width': 2,
            'circle-color': '#ff0000',
            'circle-stroke-color': '#ffffff'
        }
    });

    // label layer (NNE)
    window.map.addLayer({
        id: 'user-points-label',
        type: 'symbol',
        source: 'user-points',
        layout: {
            'text-field': ['get', 'label'],
            'text-size': 12,
            'text-anchor': 'top-left',
            'text-offset': [1, -1]  // NNE offset
        },
        paint: {
            'text-color': '#000000'
        }
    });

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