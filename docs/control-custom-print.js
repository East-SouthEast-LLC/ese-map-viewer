// docs/control-custom-print.js

function adjustFontSizeForPrint(element) {
    if (!element) return;

    let currentFontSize = 14; // max font size
    const minFontSize = 8;    // minimum readable font size
    const step = 0.5;         // how much to decrease font size by each step

    // set the initial font size
    element.style.fontSize = `${currentFontSize}px`;

    // loop to reduce font size until the content fits
    while (element.scrollHeight > element.clientHeight && currentFontSize > minFontSize) {
        currentFontSize -= step;
        element.style.fontSize = `${currentFontSize}px`;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const customPrintButton = document.getElementById("customPrintButton");
    const customPrintBox = document.getElementById("custom-print-box");
    let customPrintVisibility = false;
    customPrintBox.style.display = 'none';

    if (!customPrintButton || !customPrintBox) {
        console.error("Required custom print elements not found in the DOM.");
        return;
    }

    const printPresets = {
        'Conservation': [
            { page: 1, layers: ['parcel highlight', 'lidar contours', 'floodplain'] },
            { page: 2, layers: ['parcel highlight', 'satellite', 'acec'] },
            { page: 3, layers: ['parcel highlight', 'lidar contours', 'DEP wetland'] },
            { page: 4, layers: ['parcel highlight', 'satellite', 'endangered species'] },
            { page: 5, layers: ['usgs quad'] }
        ],
        'Test Hole': [
            { page: 1, layers: ['parcel highlight', 'lidar contours'] },
            { page: 2, layers: ['parcel highlight', 'floodplain', 'lidar contours'] },
            { page: 3, layers: ['parcel highlight', 'DEP wetland', 'lidar contours'] },
            { page: 4, layers: ['parcel highlight', 'zone II',] },
            { page: 5, layers: ['parcel highlight', 'soils'] },
            { page: 5, layers: ['usgs quad'] }
        ]
    };
    
    function setLayerVisibility(layerId, visibility) {
        if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', visibility);
        }
    
        const dependentLayers = {
            'floodplain': ['LiMWA', 'floodplain-line', 'floodplain-labels'],
            'DEP wetland': ['dep-wetland-line', 'dep-wetland-labels'],
            'soils': ['soils-labels', 'soils-outline'],
            'zone II': ['zone-ii-outline', 'zone-ii-labels'],
            'endangered species': ['endangered-species-labels', 'vernal-pools', 'vernal-pools-labels'],
            'sewer plans': ['sewer-plans-outline'],
            'lidar contours': ['lidar-contour-labels']
        };
    
        if (dependentLayers[layerId]) {
            dependentLayers[layerId].forEach(depId => {
                if (map.getLayer(depId)) {
                    map.setLayoutProperty(depId, 'visibility', visibility);
                }
            });
        }
    }

    function loadCompanyInfo() {
        const shouldSave = localStorage.getItem('ese-should-save-info') !== 'false';
        document.getElementById('save-info-checkbox').checked = shouldSave;

        const savedInfo = localStorage.getItem('ese-company-info');
        if (savedInfo) {
            const companyInfo = JSON.parse(savedInfo);
            document.getElementById('custom-company-name').value = companyInfo.companyName || '';
            document.getElementById('custom-address').value = companyInfo.address || '';
            document.getElementById('custom-website').value = companyInfo.website || '';
            document.getElementById('custom-phone').value = companyInfo.phone || '';
        }
    }

    function handleCheckboxChange() {
        const isChecked = document.getElementById('save-info-checkbox').checked;
        localStorage.setItem('ese-should-save-info', isChecked);

        if (!isChecked) {
            localStorage.removeItem('ese-company-info');
        }
    }

    function getCustomPrintFormHTML() {
        // Form HTML remains the same
        return `
            <strong style="display:block; text-align:center; margin-bottom:8px;">Custom Print Details</strong>
            
            <input type="text" id="custom-company-name" placeholder="Company Name" style="width: 100%; margin-bottom: 5px; padding: 5px; box-sizing: border-box; border-radius: 3px; border: 1px solid #ccc;">
            <input type="text" id="custom-address" placeholder="Company Address" style="width: 100%; margin-bottom: 5px; padding: 5px; box-sizing: border-box; border-radius: 3px; border: 1px solid #ccc;">
            <input type="text" id="custom-website" placeholder="Website" style="width: 100%; margin-bottom: 5px; padding: 5px; box-sizing: border-box; border-radius: 3px; border: 1px solid #ccc;">
            <input type="text" id="custom-phone" placeholder="Phone Number" style="width: 100%; margin-bottom: 5px; padding: 5px; box-sizing: border-box; border-radius: 3px; border: 1px solid #ccc;">
            
            <div style="text-align: center; margin: 8px 0;">
                <input type="checkbox" id="save-info-checkbox" style="vertical-align: middle;">
                <label for="save-info-checkbox" style="vertical-align: middle; font-size: 12px;">Save Company Info</label>
            </div>

            <hr style="margin: 10px 0;"/>

            <input type="text" id="custom-client-name" placeholder="Client Name" style="width: 100%; margin-bottom: 5px; padding: 5px; box-sizing: border-box; border-radius: 3px; border: 1px solid #ccc;">
            <input type="text" id="custom-property-address" placeholder="Property Address" style="width: 100%; margin-bottom: 10px; padding: 5px; box-sizing: border-box; border-radius: 3px; border: 1px solid #ccc;">
            
            <label for="custom-print-preset" style="display:block; margin-bottom:5px;">Select Print Preset:</label>
            <select id="custom-print-preset" style="width: 100%; margin-bottom: 10px; padding: 5px; box-sizing: border-box;"></select>

            <label for="custom-scale-input" style="display:block; margin-bottom:5px;">Set Scale (1" = X feet):</label>
            <input type="number" id="custom-scale-input" placeholder="e.g., 100" style="width: 100%; margin-bottom: 5px; padding: 5px; box-sizing: border-box; border-radius: 3px; border: 1px solid #ccc;">

            <label for="custom-scale-dropdown" style="display:block; margin-bottom:5px;">Or select a preset:</label>
            <select id="custom-scale-dropdown" style="width: 100%; margin-bottom: 10px; padding: 5px; box-sizing: border-box;">
                <option value="">-- Select --</option>
                <option value="100">1" = 100 feet</option>
                <option value="200">1" = 200 feet</option>
                <option value="300">1" = 300 feet</option>
                <option value="400">1" = 400 feet</option>
                <option value="500">1" = 500 feet</option>
                <option value="1000">1" = 1000 feet</option>
            </select>

            <button id="custom-print-submit" style="display: block; margin: 0 auto 8px auto; width: 90%; height: 24px; padding: 0; font-size: 12px;">Submit</button>
        `;
    }

    function processCustomPrint() {
        if (document.getElementById('save-info-checkbox').checked) {
            const companyInfo = {
                companyName: document.getElementById('custom-company-name').value,
                address: document.getElementById('custom-address').value,
                website: document.getElementById('custom-website').value,
                phone: document.getElementById('custom-phone').value
            };
            localStorage.setItem('ese-company-info', JSON.stringify(companyInfo));
        }

        const printData = {
            companyName: document.getElementById('custom-company-name').value,
            clientName: document.getElementById('custom-client-name').value,
            address: document.getElementById('custom-address').value,
            website: document.getElementById('custom-website').value,
            phone: document.getElementById('custom-phone').value,
            propertyAddress: document.getElementById('custom-property-address').value,
            scale: document.getElementById('custom-scale-input').value,
        };

        if (!printData.scale || isNaN(printData.scale) || Number(printData.scale) <= 0) {
            alert('Please enter a valid scale in feet per inch.');
            return;
        }

        const selectedPresetName = document.getElementById('custom-print-preset').value;
        const pageConfigs = printPresets[selectedPresetName];

        if (!pageConfigs) {
            alert('Invalid print preset selected.');
            return;
        }

        // Track the custom print event
        trackEvent('custom_print_submit', {
            preset: selectedPresetName,
            scale: printData.scale
        });

        customPrintBox.style.display = 'none';
        customPrintVisibility = false; 

        generateMultiPagePrintout(printData, pageConfigs);
    }

    function formatPhoneNumber(phoneNumberString) {
        var cleaned = ('' + phoneNumberString).replace(/\D/g, '');
        var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return '(' + match[1] + ') ' + match[2] + '-' + match[3];
        }
        return null; // Return null if the number doesn't match the format
    }

    function getPageHTML(printData, mapImageSrc, pageNumber, expectedLayers, currentDate) {
        const formattedPhone = formatPhoneNumber(printData.phone);

        return `
            <div class="frame">
                <div class="top-frame">
                    <div class="map-container">
                        <img src="${mapImageSrc}" alt="Map Image for Page ${pageNumber}" />
                    </div>
                </div>
                <div class="bottom-frame">
                    <div class="custom-info-frame" style="width: 2in;">
                        <span><strong>Client:</strong> ${printData.clientName}</span><br>
                        <span><strong>Property:</strong> ${printData.propertyAddress}</span>
                        <hr style="width:100%; border:.5px solid black; margin:5px 0;">
                        <span><strong>${printData.companyName}</strong></span><br>
                        <span>${printData.address}</span><br>
                        <span>${printData.website}</span><br>
                        <span>${formattedPhone}</span><br>
                        <hr style="width:100%; border:.5px solid black; margin:5px 0;">
                    </div>
                    <div class="image-container">
                        <img src="https://east-southeast-llc.github.io/ese-map-viewer-dev/img/ese-print-logo.png" alt="Company Logo" />
                    </div>
                    <div class="legend-frame">
                        <div class="legend-print-title">Legend & Layers</div>
                        ${getLegendForPrint(expectedLayers)} 
                    </div>
                    <div class="inner-frame">
                        <span class="gis-map">GIS Map</span>
                        <span class="disclaimer">This map is for illustrative purposes only and is not adequate for legal boundary determination or regulatory interpretation.</span>
                        <span class="date">${currentDate}</span>
                        ${getPrintScaleBarHTML(map)}
                        <span class="sources">Map sources include:</span>
                        <span class="massgis">Bureau of Geographic Information (MassGIS), Commonwealth of Massachusetts, Executive Office of Technology and Security Services</span>
                        <span class="base-map">© <a href="https://www.mapbox.com/about/maps">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a><br>
                            <strong><a style="margin-top: 3px" href="https://apps.mapbox.com/feedback/" target="_blank">Improve this map, www.apps.mapbox.com/feedback</a></strong>
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    async function generateMultiPagePrintout(printData, pageConfigs) {
        const currentDate = new Date().toLocaleDateString();
        const usgsLayerIsActive = document.querySelector('[data-layer-id="usgs quad"].active');
        
        if (usgsLayerIsActive && typeof deinitializeUsgsTileManager === 'function') {
            deinitializeUsgsTileManager();
        }

        let fullHtml = '';
        const allToggleableLayers = window.toggleableLayerIds.filter(id => id !== 'tools' && id !== 'usgs quad');
        const initiallyVisibleLayers = listVisibleLayers(map, allToggleableLayers);
        
        if (typeof setMapToScale === 'function') {
            setMapToScale(Number(printData.scale));
        } else {
            console.error("setMapToScale function not found.");
            return;
        }
        if(marker) {
            map.setCenter(marker.getLngLat());
        }
        
        allToggleableLayers.forEach(layerId => setLayerVisibility(layerId, 'none'));

        for (const config of pageConfigs) {
            const isUsgsPage = config.layers.includes('usgs quad');

            if (isUsgsPage) {
                if (typeof initializeUsgsTileManager === 'function') {
                    initializeUsgsTileManager();
                }
            } else {
                config.layers.forEach(layerId => setLayerVisibility(layerId, 'visible'));
            }

            await new Promise(resolve => map.once('idle', resolve));
            
            const mapCanvas = map.getCanvas();
            const mapImageSrc = mapCanvas.toDataURL();
            fullHtml += getPageHTML(printData, mapImageSrc, config.page, config.layers, currentDate);

            if (isUsgsPage) {
                if (typeof deinitializeUsgsTileManager === 'function') {
                    deinitializeUsgsTileManager();
                }
            } else {
                config.layers.forEach(layerId => setLayerVisibility(layerId, 'none'));
            }
        }

        initiallyVisibleLayers.forEach(layerId => setLayerVisibility(layerId, 'visible'));

        if (usgsLayerIsActive && typeof initializeUsgsTileManager === 'function') {
            initializeUsgsTileManager();
        }

        const win = window.open('', '_blank');
        if (win) {
            let documentTitle = "Custom Map Printout";
            if (printData.clientName && printData.propertyAddress) {
                documentTitle = `${printData.clientName} | ${printData.propertyAddress} | ${currentDate}`;
            }
            
            win.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${documentTitle}</title>
                    <link rel="stylesheet" href="https://east-southeast-llc.github.io/ese-map-viewer-dev/css/globals.css?v=3" type="text/css" />
                    
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet">

                    <style>
                        /* Apply the new font to all relevant elements */
                        .custom-info-frame, .gis-map, .legend-print-title {
                            font-family: 'Montserrat', sans-serif !important;
                        }
                    </style>
                </head>
                <body class="print-body">${fullHtml}</body>
                </html>`);
            win.document.close();
            win.onload = () => {
                win.document.querySelectorAll('.custom-info-frame').forEach(adjustFontSizeForPrint);
                win.print();
                win.close();
            };
        } else {
            alert("Popup blocked! Please allow popups for this site.");
        }
    }

    // ============================================================================
    // MAIN EVENT LISTENERS
    // ============================================================================
    
    function attachCustomPrintFormListeners() {
        const submitButton = document.getElementById('custom-print-submit');
        if (submitButton) {
            submitButton.addEventListener('click', processCustomPrint);
        }

        const saveCheckbox = document.getElementById('save-info-checkbox');
        if (saveCheckbox) {
            saveCheckbox.addEventListener('change', handleCheckboxChange);
        }

        const scaleDropdown = document.getElementById('custom-scale-dropdown');
        const scaleInput = document.getElementById('custom-scale-input');
        if (scaleDropdown && scaleInput) {
            scaleDropdown.addEventListener('change', () => {
                if (scaleDropdown.value) {
                    scaleInput.value = scaleDropdown.value;
                }
            });
        }
        
        customPrintBox.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                processCustomPrint();
            }
        });
    }

    function updateCustomPrintBox() {
        customPrintBox.innerHTML = getCustomPrintFormHTML();

        const presetDropdown = document.getElementById('custom-print-preset');
        if (presetDropdown) {
            for (const presetName in printPresets) {
                const option = document.createElement('option');
                option.value = presetName;
                option.textContent = presetName;
                presetDropdown.appendChild(option);
            }
        }
        
        customPrintBox.style.display = 'block';
        attachCustomPrintFormListeners();
        loadCompanyInfo(); 
    }
    
    customPrintButton.addEventListener('click', () => {
        if (!marker) {
            alert('Please drop a pin on the map to set the center for your printout.');
            return;
        }

        customPrintVisibility = !customPrintVisibility;
        if (customPrintVisibility) {
            updateCustomPrintBox();
        } else {
            customPrintBox.style.display = 'none';
        }
    });    
});