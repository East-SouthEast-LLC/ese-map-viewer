// CUSTOM PRINT CONTROL BUTTON SCRIPT

document.addEventListener("DOMContentLoaded", function () {
    const customPrintButton = document.getElementById("customPrintButton");
    const customPrintBox = document.getElementById("custom-print-box");
    let customPrintVisibility = false;
    customPrintBox.style.display = 'none';

    const presetBuilderBox = document.getElementById("preset-builder-box");
    if (presetBuilderBox) {
        presetBuilderBox.style.display = 'none';
    }

    if (!customPrintButton || !customPrintBox || !presetBuilderBox) {
        console.error("Required custom print or preset builder elements not found in the DOM.");
        return;
    }

    // --- CONFIGURATIONS ---

    // The list of layers available for users to select in the builder.
    const availableLayers = ['satellite', 'parcels', 'parcel highlight', 'contours', 'agis', 'historic', 'floodplain', 'acec', 'DEP wetland', 'endangered species', 'zone II', 'soils', 'conservancy districts', 'zoning', 'conservation', 'sewer', 'sewer plans', 'stories', 'intersection'];

    const printPresets = {
        'Conservation': [
            { page: 1, layers: ['parcel highlight', 'contours', 'floodplain'] },
            { page: 2, layers: ['parcel highlight', 'satellite', 'acec'] },
            { page: 3, layers: ['parcel highlight', 'contours', 'DEP wetland'] },
            { page: 4, layers: ['parcel highlight', 'satellite', 'endangered species'] }
        ],
        'Sewer Planning': [
            { page: 1, layers: ['parcel highlight', 'soils'] },
            { page: 2, layers: ['parcel highlight', 'sewer plans'] }
        ]
    };
    
    // --- HELPER FUNCTIONS ---

    // (setLayerVisibility, loadCompanyInfo, handleCheckboxChange... all remain the same)
    function setLayerVisibility(layerId, visibility) {
        if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', visibility);
        }
        if (layerId === 'floodplain') {
            map.setLayoutProperty('LiMWA', 'visibility', visibility);
            map.setLayoutProperty('floodplain-line', 'visibility', visibility);
            map.setLayoutProperty('floodplain-labels', 'visibility', visibility);
        } else if (layerId === 'DEP wetland') {
            map.setLayoutProperty('dep-wetland-line', 'visibility', visibility);
            map.setLayoutProperty('dep-wetland-labels', 'visibility', visibility);
        } else if (layerId === 'soils') {
            map.setLayoutProperty('soils-labels', 'visibility', visibility);
            map.setLayoutProperty('soils-outline', 'visibility', visibility);
        } else if (layerId === 'zone II') {
            map.setLayoutProperty('zone-ii-outline', 'visibility', visibility);
            map.setLayoutProperty('zone-ii-labels', 'visibility', visibility);
        } else if (layerId === 'endangered species') {
            map.setLayoutProperty('endangered-species-labels', 'visibility', visibility);
            map.setLayoutProperty('vernal-pools', 'visibility', visibility);
            map.setLayoutProperty('vernal-pools-labels', 'visibility', visibility);
        } else if (layerId === 'sewer plans') {
            map.setLayoutProperty('sewer-plans-outline', 'visibility', visibility);
        } else if (layerId === 'contours') {
            map.setLayoutProperty('contour-labels', 'visibility', visibility);
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
            
            <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 10px;">
                <select id="custom-print-preset" style="flex-grow: 1; padding: 5px;"></select>
                <button id="manage-presets-btn" type="button" style="padding: 5px; font-size: 12px;">+</button>
            </div>

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

    function getPresetBuilderHTML() {
        return `
            <h4 style="text-align:center; margin-top: 0;">Preset Builder</h4>
            <label for="preset-name-input">Preset Name:</label>
            <input type="text" id="preset-name-input" placeholder="e.g., My Custom Preset" style="width:100%; padding: 5px; margin-top: 5px; box-sizing: border-box;">
            
            <div id="preset-pages-container">
                </div>

            <button id="add-page-btn" type="button" style="width:100%; margin-top: 10px; padding: 8px;">Add Page</button>
            <div style="display:flex; gap: 10px; margin-top: 15px;">
                <button id="save-preset-btn" type="button" style="flex-grow: 1; padding: 8px;">Save Preset</button>
                <button id="close-builder-btn" type="button" style="flex-grow: 1; padding: 8px;">Close</button>
            </div>
        `;
    }

    // --- PRESET BUILDER INTERACTIVITY ---

    function updatePageNumbers() {
        const pages = presetBuilderBox.querySelectorAll('.preset-page');
        pages.forEach((page, index) => {
            page.querySelector('h5').textContent = `Page ${index + 1}`;
        });
    }

    function createPageElement(pageNumber) {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'preset-page';

        const header = document.createElement('div');
        header.className = 'preset-page-header';
        
        const title = document.createElement('h5');
        title.textContent = `Page ${pageNumber}`;
        
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.type = 'button';
        removeBtn.className = 'remove-page-btn';

        header.appendChild(title);
        header.appendChild(removeBtn);
        
        const select = document.createElement('select');
        select.multiple = true;
        select.style.width = '100%';
        select.style.height = '120px';

        availableLayers.forEach(layerId => {
            const option = document.createElement('option');
            option.value = layerId;
            option.textContent = layerId;
            select.appendChild(option);
        });

        pageDiv.appendChild(header);
        pageDiv.appendChild(select);
        
        return pageDiv;
    }

    function attachPresetBuilderListeners() {
        const pagesContainer = document.getElementById('preset-pages-container');
        
        document.getElementById('close-builder-btn').addEventListener('click', () => {
            presetBuilderBox.style.display = 'none';
        });

        document.getElementById('add-page-btn').addEventListener('click', () => {
            const pageCount = pagesContainer.querySelectorAll('.preset-page').length;
            const newPage = createPageElement(pageCount + 1);
            pagesContainer.appendChild(newPage);
        });

        pagesContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-page-btn')) {
                e.target.closest('.preset-page').remove();
                updatePageNumbers();
            }
        });
    }
    
    // --- (Existing print functions: processCustomPrint, getPageHTML, generateMultiPagePrintout) ---
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

        customPrintBox.style.display = 'none';
        customPrintVisibility = false;

        generateMultiPagePrintout(printData, pageConfigs);
    }

    function getPageHTML(printData, mapImageSrc, pageNumber) {
        const currentDate = new Date().toLocaleDateString();
        return `
            <div class="frame">
                <div class="top-frame">
                    <div class="map-container">
                        <img src="${mapImageSrc}" alt="Map Image for Page ${pageNumber}" />
                    </div>
                </div>
                <div class="bottom-frame">
                    <div class="custom-info-frame" style="width: 2.5in;">
                        <span><strong>Client:</strong> ${printData.clientName}</span><br>
                        <span><strong>Property:</strong> ${printData.propertyAddress}</span>
                        <hr style="width:100%; border:.5px solid black; margin:5px 0;">
                        <span><strong>${printData.companyName}</strong></span>
                        <span>${printData.address}</span><br>
                        <span>${printData.website} | ${printData.phone}</span><br>
                    </div>
                    <div class="image-container">
                        <img src="https://static1.squarespace.com/static/536cf42ee4b0465238027de5/t/67a783e42bb54b7b434b79f1/1739031525647/ESE-GIS.jpg" alt="Company Logo" />
                    </div>
                    <div class="legend-frame">
                        <div class="legend-print-title">Legend & Layers</div>
                        ${getLegendForPrint()} 
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
        console.log(`Generating multi-page printout with preset: ${document.getElementById('custom-print-preset').value}`);
        
        let fullHtml = '';
        const allToggleableLayers = ['satellite', 'parcels', 'parcel highlight', 'contours', 'agis', 'historic', 'floodplain', 'acec', 'DEP wetland', 'endangered species', 'zone II', 'soils', 'conservancy districts', 'zoning', 'conservation', 'sewer', 'sewer plans', 'stories', 'intersection'];
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
            config.layers.forEach(layerId => setLayerVisibility(layerId, 'visible'));
            await new Promise(resolve => map.once('idle', resolve));
            const mapCanvas = map.getCanvas();
            const mapImageSrc = mapCanvas.toDataURL();
            fullHtml += getPageHTML(printData, mapImageSrc, config.page);
            config.layers.forEach(layerId => setLayerVisibility(layerId, 'none'));
        }

        initiallyVisibleLayers.forEach(layerId => setLayerVisibility(layerId, 'visible'));

        const win = window.open('', '_blank');
        if (win) {
            win.document.write(`
                <!DOCTYPE html><html><head><title>Custom Map Printout</title>
                <link rel="stylesheet" href="https://east-southeast-llc.github.io/ese-map-viewer/css/globals.css?v=2" type="text/css" />
                </head><body class="print-body">${fullHtml}</body></html>`);
            win.document.close();
            win.onload = () => {
                win.print();
                win.close();
            };
        } else {
            alert("Popup blocked! Please allow popups for this site.");
        }
    }


    // --- MAIN EVENT LISTENERS ---
    
    function attachCustomPrintFormListeners() {
        document.getElementById('custom-print-submit').addEventListener('click', processCustomPrint);
        document.getElementById('save-info-checkbox').addEventListener('change', handleCheckboxChange);
        
        const scaleDropdown = document.getElementById('custom-scale-dropdown');
        const scaleInput = document.getElementById('custom-scale-input');
        if (scaleDropdown && scaleInput) {
            scaleDropdown.addEventListener('change', () => {
                if (scaleDropdown.value) scaleInput.value = scaleDropdown.value;
            });
        }
        
        customPrintBox.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                processCustomPrint();
            }
        });

        document.getElementById('manage-presets-btn').addEventListener('click', () => {
            presetBuilderBox.innerHTML = getPresetBuilderHTML();
            presetBuilderBox.style.display = 'block';
            attachPresetBuilderListeners(); // Attach listeners for the new panel
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
            presetBuilderBox.style.display = 'none';
        }
    });    
});