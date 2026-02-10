// src/js/components/control/custom-print.js

/**
 * dynamically adjusts the font size of an element's text to ensure it fits
 * within the element's clientHeight without overflowing.
 * @param {HTMLElement} element - the dom element to adjust.
 */
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

const customPrintButton = document.getElementById("customPrintButton");
const customPrintBox = document.getElementById("custom-print-box");
let customPrintVisibility = false;
customPrintBox.style.display = 'none';

if (!customPrintButton || !customPrintBox) {
    console.error("Required custom print elements not found in the DOM.");
} else {
    // defines the layer combinations for each preset printout type.
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
            { page: 6, layers: ['usgs quad'] }
        ]
    };
    
    /**
     * sets the visibility property for a map layer and its defined dependencies.
     * @param {string} layerId - the id of the layer to modify.
     * @param {string} visibility - 'visible' or 'none'.
     */
    function setLayerVisibility(layerId, visibility) {
        if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', visibility);
        }
    
        // dynamically get dependencies from the global layer config
        const layerConfig = window.layerConfig.find(l => l.id === layerId);
        if (layerConfig && layerConfig.dependencies) {
            layerConfig.dependencies.forEach(depId => {
                if (map.getLayer(depId)) {
                    map.setLayoutProperty(depId, 'visibility', visibility);
                }
            });
        }
    }

    /**
     * loads saved company information from localstorage into the print form.
     */
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

    /**
     * handles changes to the "save company info" checkbox.
     */
    function handleCheckboxChange() {
        const isChecked = document.getElementById('save-info-checkbox').checked;
        localStorage.setItem('ese-should-save-info', isChecked);

        if (!isChecked) {
            localStorage.removeItem('ese-company-info');
        }
    }

    /**
     * gets the html string for the custom print form.
     * @returns {string} the html for the form.
     */
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

    /**
     * processes the custom print form data and initiates the multi-page printout generation.
     */
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

        trackEvent('custom_print_submit', {
            preset: selectedPresetName,
            scale: printData.scale
        });

        customPrintBox.style.display = 'none';
        customPrintVisibility = false; 

        generateMultiPagePrintout(printData, pageConfigs);
    }

    /**
     * formats a string of numbers into a standard phone number format.
     * @param {string} phoneNumberString - the raw phone number.
     * @returns {string|null} the formatted phone number or null if invalid.
     */
    function formatPhoneNumber(phoneNumberString) {
        var cleaned = ('' + phoneNumberString).replace(/\D/g, '');
        var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return '(' + match[1] + ') ' + match[2] + '-' + match[3];
        }
        return null; 
    }

    /**
     * generates the html for a single page of the printout.
     * @param {object} printData - the user-entered form data.
     * @param {string} mapImageSrc - the base64 data url for the map canvas image.
     * @param {number} pageNumber - the current page number.
     * @param {string[]} expectedLayers - array of layer ids expected on this page.
     * @param {string} currentDate - the formatted current date.
     * @returns {string} the complete html for one page.
     */
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
                        <img src="https://east-southeast-llc.github.io/ese-map-viewer/assets/img/ese-print-logo.png" alt="Company Logo" />
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

    /**
     * orchestrates the creation of a multi-page printout. it saves the map's current state,
     * iterates through page configurations, sets layer visibility, captures the map canvas,
     * and then restores the map to its original state.
     * @param {object} printData - the user-entered form data.
     * @param {object[]} pageConfigs - an array of page configuration objects.
     */
    async function generateMultiPagePrintout(printData, pageConfigs) {
        const currentDate = new Date().toLocaleDateString();
        const usgsLayerIsActive = document.querySelector('[data-layer-id="usgs quad"].active');
        
        // if usgs layer is on, temporarily disable it to prevent interference.
        if (usgsLayerIsActive && typeof deinitializeUsgsTileManager === 'function') {
            deinitializeUsgsTileManager();
        }

        let fullHtml = '';
        const allToggleableLayers = window.toggleableLayerIds.filter(id => id !== 'tools' && id !== 'usgs quad');
        const initiallyVisibleLayers = listVisibleLayers(map, allToggleableLayers);
        
        // set the map to the user-defined scale for printing.
        if (typeof setMapToScale === 'function') {
            setMapToScale(Number(printData.scale));
        } else {
            console.error("setMapToScale function not found.");
            return;
        }
        if(marker) {
            map.setCenter(marker.getLngLat());
        }
        
        // turn off all layers to start with a clean slate for each page.
        allToggleableLayers.forEach(layerId => setLayerVisibility(layerId, 'none'));

        // loop through each page configuration in the preset.
        for (const config of pageConfigs) {
            const isUsgsPage = config.layers.includes('usgs quad');
    
            // handle usgs quad pages by awaiting the tile manager.
            if (isUsgsPage) {
                if (typeof initializeUsgsTileManager === 'function') {
                    // this now returns a promise that resolves only when tiles are fully rendered.
                    await initializeUsgsTileManager();
                }
            } else {
                // for standard vector/raster layers, turn them on and wait for map to be idle.
                config.layers.forEach(layerId => setLayerVisibility(layerId, 'visible'));
                await new Promise(resolve => map.once('idle', resolve));
            }
            
            // capture the canvas and generate the html for the page.
            const mapCanvas = map.getCanvas();
            const mapImageSrc = mapCanvas.toDataURL();


    
            // clean up layers before the next page generation.
            if (isUsgsPage) {
                if (typeof deinitializeUsgsTileManager === 'function') {
                    deinitializeUsgsTileManager();
                }
            } else {
                config.layers.forEach(layerId => setLayerVisibility(layerId, 'none'));
            }
        }

        // restore all initially visible layers to return the map to its original state.
        initiallyVisibleLayers.forEach(layerId => setLayerVisibility(layerId, 'visible'));

        // re-initialize the usgs layer if it was active before printing.
        if (usgsLayerIsActive && typeof initializeUsgsTileManager === 'function') {
            initializeUsgsTileManager();
        }

        // open a new window and write the generated html for printing.
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
                    <link rel="stylesheet" href="https://east-southeast-llc.github.io/ese-map-viewer/src/css/globals.css?v=3" type="text/css" />
                    
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
    
    /**
     * attaches all necessary event listeners to the custom print form elements.
     */
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

    /**
     * populates the custom print box with the form html and attaches listeners.
     */
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
    
    // main button to toggle the visibility of the custom print form.
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
	
}