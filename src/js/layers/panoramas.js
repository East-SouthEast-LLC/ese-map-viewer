// docs/layers/panoramas.js

window.panoramaOrder = [];

// Ready gate — resolves when panoramaData is fully loaded
let _panoramaDataResolve;
window.panoramaDataReady = new Promise(resolve => { _panoramaDataResolve = resolve; });

// Global source override: 'r2' or 'squarespace'
window.panoSource = 'r2';

// Global color mode: 'default' or 'date'
window.panoColorMode = 'default';

// --- Helpers ---

function parseDateFromFilename(filename) {
    // Match YYYY-MM-DD (e.g. COLLINS_LANE_2026-04-24_00063.jpg)
    let match = filename.match(/(\d{4}-\d{2}-\d{2})/);
    if (match) return new Date(match[1]).getTime();

    // Match YYYYMMDD (e.g. NELLIES_20250626_00036.jpg)
    match = filename.match(/(\d{8})/);
    if (match) {
        const d = match[1];
        return new Date(`${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`).getTime();
    }
    return null;
}

function dateToColor(ts, minTs, maxTs) {
    if (minTs === maxTs) return '#00ffff';
    const t = (ts - minTs) / (maxTs - minTs);
    const r = Math.round(0 + t * 255);
    const g = Math.round(102 - t * 102);
    const b = Math.round(255 - t * 255);
    return `rgb(${r},${g},${b})`;
}

function buildColorExpression(panoData, minTs, maxTs) {
    const expr = ['match', ['get', 'filename']];
    for (const [filename] of Object.entries(panoData)) {
        const ts = parseDateFromFilename(filename);
        const color = ts !== null ? dateToColor(ts, minTs, maxTs) : '#00ffff';
        expr.push(filename, color);
    }
    expr.push('#00ffff');
    return expr;
}

function buildFilterExpression(minTs, maxTs) {
    return [
        'all',
        ['>=', ['get', 'dateTs'], minTs],
        ['<=', ['get', 'dateTs'], maxTs]
    ];
}

function tsToDateStr(ts) {
    return new Date(ts).toISOString().slice(0, 10);
}

function updateDotColors(panoData, minTs, maxTs) {
    if (!map.getLayer('panoramas')) return;
    if (window.panoColorMode === 'date') {
        map.setPaintProperty('panoramas', 'circle-color', [
            'case',
            ['boolean', ['feature-state', 'viewed'], false],
            '#FFFF00',
            buildColorExpression(panoData, minTs, maxTs)
        ]);
    } else {
        map.setPaintProperty('panoramas', 'circle-color', [
            'case',
            ['boolean', ['feature-state', 'viewed'], false],
            '#FFFF00',
            '#00ffff'
        ]);
    }
}

// --- Controls UI ---

function createPanoControls(minTs, maxTs, panoData) {
    const existing = document.getElementById('pano-controls');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'pano-controls';
    // starts hidden — shown/hidden by toggleable-menu.js when layer toggles
    container.style.cssText = `
        display: none;
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 1000;
        background: rgba(0,0,0,0.75);
        color: white;
        padding: 10px 12px;
        border-radius: 8px;
        font-family: sans-serif;
        font-size: 12px;
        min-width: 220px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        user-select: none;
    `;

    // --- Source Toggle ---
    const sourceRow = document.createElement('div');
    sourceRow.style.cssText = 'display:flex; align-items:center; gap:8px; margin-bottom:8px;';

    const sourceLabel = document.createElement('span');
    sourceLabel.textContent = 'Source:';
    sourceLabel.style.width = '55px';

    const sourceBtn = document.createElement('button');
    sourceBtn.id = 'pano-source-btn';
    sourceBtn.textContent = '☁ R2';
    sourceBtn.style.cssText = `
        flex: 1; padding: 4px 8px; border-radius: 4px; border: none;
        cursor: pointer; background: #0066cc; color: white;
        font-size: 11px; font-weight: bold;
    `;
    sourceBtn.onclick = () => {
        window.panoSource = window.panoSource === 'r2' ? 'squarespace' : 'r2';
        sourceBtn.textContent = window.panoSource === 'r2' ? '☁ R2' : '□ Squarespace';
        sourceBtn.style.background = window.panoSource === 'r2' ? '#0066cc' : '#cc6600';
    };

    sourceRow.appendChild(sourceLabel);
    sourceRow.appendChild(sourceBtn);

    // --- Color Toggle ---
    const colorRow = document.createElement('div');
    colorRow.style.cssText = 'display:flex; align-items:center; gap:8px; margin-bottom:10px;';

    const colorLabel = document.createElement('span');
    colorLabel.textContent = 'Color:';
    colorLabel.style.width = '55px';

    const colorBtn = document.createElement('button');
    colorBtn.id = 'pano-color-btn';
    colorBtn.textContent = '● Default';
    colorBtn.style.cssText = `
        flex: 1; padding: 4px 8px; border-radius: 4px; border: none;
        cursor: pointer; background: #333; color: #00ffff;
        font-size: 11px; font-weight: bold;
    `;
    colorBtn.onclick = () => {
        window.panoColorMode = window.panoColorMode === 'default' ? 'date' : 'default';
        colorBtn.textContent = window.panoColorMode === 'date' ? '● By Date' : '● Default';
        colorBtn.style.color = window.panoColorMode === 'date' ? '#ff9900' : '#00ffff';
        updateDotColors(panoData, minTs, maxTs);
        legendDiv.style.display = window.panoColorMode === 'date' ? 'flex' : 'none';
    };

    colorRow.appendChild(colorLabel);
    colorRow.appendChild(colorBtn);

    // --- Date Range Sliders ---
    const sliderLabel = document.createElement('div');
    sliderLabel.style.cssText = 'margin-bottom:4px; display:flex; justify-content:space-between;';

    const sliderTitle = document.createElement('span');
    sliderTitle.textContent = 'Date Range:';

    const sliderValues = document.createElement('span');
    sliderValues.id = 'pano-slider-values';
    sliderValues.style.color = '#aaa';
    sliderValues.textContent = `${tsToDateStr(minTs)} – ${tsToDateStr(maxTs)}`;

    sliderLabel.appendChild(sliderTitle);
    sliderLabel.appendChild(sliderValues);

    const minSlider = document.createElement('input');
    minSlider.type = 'range';
    minSlider.id = 'pano-min-slider';
    minSlider.min = minTs;
    minSlider.max = maxTs;
    minSlider.value = minTs;
    minSlider.style.cssText = 'width:100%; margin-bottom:2px; accent-color:#0066cc;';

    const maxSlider = document.createElement('input');
    maxSlider.type = 'range';
    maxSlider.id = 'pano-max-slider';
    maxSlider.min = minTs;
    maxSlider.max = maxTs;
    maxSlider.value = maxTs;
    maxSlider.style.cssText = 'width:100%; accent-color:#cc3300;';

    function onSliderChange() {
        let lo = parseInt(minSlider.value);
        let hi = parseInt(maxSlider.value);
        if (lo > hi) {
            if (this === minSlider) { lo = hi; minSlider.value = lo; }
            else { hi = lo; maxSlider.value = hi; }
        }
        document.getElementById('pano-slider-values').textContent =
            `${tsToDateStr(lo)} – ${tsToDateStr(hi)}`;
        map.setFilter('panoramas', buildFilterExpression(lo, hi));
    }

    minSlider.addEventListener('input', onSliderChange);
    maxSlider.addEventListener('input', onSliderChange);

    // --- Legend ---
    const legendDiv = document.createElement('div');
    legendDiv.style.cssText = `
        display: none; margin-top: 8px; align-items: center;
        gap: 4px; font-size: 10px; color: #aaa;
    `;
    const legendGradient = document.createElement('div');
    legendGradient.style.cssText = `
        flex: 1; height: 6px; border-radius: 3px;
        background: linear-gradient(to right, #0066ff, #ff3300);
    `;
    const legendOld = document.createElement('span');
    legendOld.textContent = tsToDateStr(minTs);
    const legendNew = document.createElement('span');
    legendNew.textContent = tsToDateStr(maxTs);

    legendDiv.appendChild(legendOld);
    legendDiv.appendChild(legendGradient);
    legendDiv.appendChild(legendNew);

    // --- Assemble ---
    container.appendChild(sourceRow);
    container.appendChild(colorRow);
    container.appendChild(sliderLabel);
    container.appendChild(minSlider);
    container.appendChild(maxSlider);
    container.appendChild(legendDiv);

    document.getElementById('map').appendChild(container);
}

// --- Main ---

async function addPanoramasLayer() {
    try {
        const response = await fetch('https://pub-d8f97cda49514ea882c5f06ffdb4a86b.r2.dev/pano_data.json');
        const panoData = await response.json();
        window.panoramaData = panoData;
        _panoramaDataResolve();

        proj4.defs("EPSG:26986", "+proj=lcc +lat_1=42.68333333333333 +lat_2=41.71666666666667 +lat_0=41 +lon_0=-71.5 +x_0=200000 +y_0=750000 +ellps=GRS80 +datum=NAD83 +units=m +no_defs");
        proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

        // Compute date range from filenames
        let minTs = Infinity, maxTs = -Infinity;
        for (const filename of Object.keys(panoData)) {
            const ts = parseDateFromFilename(filename);
            if (ts !== null) {
                if (ts < minTs) minTs = ts;
                if (ts > maxTs) maxTs = ts;
            }
        }
        if (!isFinite(minTs)) { minTs = Date.now() - 86400000; maxTs = Date.now(); }

        const features = Object.entries(panoData).map(([filename, data]) => {
            const sourceCoords = [data.position.x, data.position.y];
            const destCoords = proj4("EPSG:26986", "EPSG:4326", sourceCoords);
            const ts = parseDateFromFilename(filename) ?? minTs;
            return {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: destCoords },
                properties: { filename, dateTs: ts }
            };
        });

        window.panoramaOrder = features.map(f => f.properties.filename);

        map.addSource('panoramas-source', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features },
            promoteId: 'filename'
        });

        map.addLayer({
            id: 'panoramas',
            type: 'circle',
            source: 'panoramas-source',
            layout: { 'visibility': 'none' },
            paint: {
                'circle-radius': ['case', ['boolean', ['feature-state', 'viewed'], false], 10, 6],
                'circle-color': ['case', ['boolean', ['feature-state', 'viewed'], false], '#FFFF00', '#00ffff'],
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 2,
                'circle-opacity': ['case', ['boolean', ['feature-state', 'viewed'], false], 0.9, 0.7],
                'circle-pitch-scale': 'map'
            }
        });

        // Store globally so toggleable-menu can access
        window.panoMinTs = minTs;
        window.panoMaxTs = maxTs;
        window.panoPanoData = panoData;

        createPanoControls(minTs, maxTs, panoData);

        map.on('mouseenter', 'panoramas', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'panoramas', () => { map.getCanvas().style.cursor = ''; });

        // Handle share links that restore layer visibility without a menu click —
        // once the map is idle, check if the layer is already visible and show controls.
        map.once('idle', function() {
            const visibility = map.getLayoutProperty('panoramas', 'visibility');
            const panoControls = document.getElementById('pano-controls');
            if (panoControls && visibility === 'visible') {
                panoControls.style.display = 'block';
            }
        });

    } catch (error) {
        console.error("failed to load and create panoramas layer:", error);
    }
}

addPanoramasLayer();
