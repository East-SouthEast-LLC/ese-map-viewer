document.addEventListener('DOMContentLoaded', () => {
    // Check if map is available
    if (typeof map === 'undefined') {
        console.error('Map object not found. Ensure control-measure.js is loaded after map initialization.');
        return;
    }

    const distanceButton = document.getElementById('distanceButton');
    const areaButton = document.getElementById('areaButton');
    const distanceDisplay = document.getElementById('distance-display');

    // Initialize the Mapbox Draw control
    const draw = new MapboxDraw({
        displayControlsDefault: false, // We will use our own buttons
        controls: {
            line_string: true,
            polygon: true,
            trash: true // Show the trash icon to delete drawings
        },
        styles: [
            // Custom styles for the drawing tools can go here if needed
        ]
    });

    // Add the draw control to the map, but hide it initially
    map.addControl(draw, 'top-left');

    // --- Event Listeners for our Custom Buttons ---

    distanceButton.addEventListener('click', () => {
        draw.changeMode('draw_line_string');
        distanceButton.classList.add('active');
        areaButton.classList.remove('active');
    });

    areaButton.addEventListener('click', () => {
        draw.changeMode('draw_polygon');
        areaButton.classList.add('active');
        distanceButton.classList.remove('active');
    });

    // --- Functions to Calculate and Display Measurements ---

    function updateMeasurements(e) {
        const data = draw.getAll();
        distanceDisplay.innerHTML = ''; // Clear previous results

        if (data.features.length > 0) {
            distanceDisplay.style.display = 'block';
            const feature = data.features[0];
            const type = feature.geometry.type;

            if (type === 'LineString') {
                const length = turf.length(feature, { units: 'feet' });
                distanceDisplay.innerHTML = `<strong>Distance:</strong><div class="distance-value">${length.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ft</div>`;
            } else if (type === 'Polygon') {
                const area = turf.area(feature); // a in square meters
                const areaSqFt = area * 10.7639; // Convert to square feet
                const areaAcres = area * 0.000247105; // Convert to acres

                distanceDisplay.innerHTML = `
                    <strong>Area:</strong>
                    <div>
                        <span>${areaSqFt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} sq ft</span>
                        <br>
                        <span>${areaAcres.toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})} acres</span>
                    </div>`;
            }
        } else {
            // Hide display and deactivate buttons if all drawings are deleted
            distanceDisplay.style.display = 'none';
            distanceButton.classList.remove('active');
            areaButton.classList.remove('active');
        }
    }

    // --- Mapbox Draw Event Listeners ---

    // When a new shape is created
    map.on('draw.create', updateMeasurements);
    // When a shape is updated (e.g., a vertex is moved)
    map.on('draw.update', updateMeasurements);
    // When a shape is deleted
    map.on('draw.delete', updateMeasurements);
    // When the drawing mode changes (e.g., user hits escape)
    map.on('draw.modechange', (e) => {
        if (e.mode === 'simple_select') {
            distanceButton.classList.remove('active');
            areaButton.classList.remove('active');
        }
    });
});