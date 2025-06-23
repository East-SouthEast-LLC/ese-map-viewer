// CUSTOM PRINT CONTROL BUTTON SCRIPT

document.addEventListener("DOMContentLoaded", function () {
    const customPrintButton = document.getElementById("customPrintButton");
    const customPrintBox = document.getElementById("custom-print-box");
    let customPrintVisibility = false;
    customPrintBox.style.display = 'none';

    // NEW: Get the container for the preset builder
    const presetBuilderBox = document.getElementById("preset-builder-box");
    if (presetBuilderBox) {
        presetBuilderBox.style.display = 'none';
    }

    if (!customPrintButton || !customPrintBox || !presetBuilderBox) {
        console.error("Required custom print or preset builder elements not found in the DOM.");
        return;
    }

    // --- PRESET CONFIGURATIONS ---
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

    function setLayerVisibility(layerId, visibility) {
        if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', visibility);
        }
        // Dependent layer logic...
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
        // Added a "Manage Presets" button
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

    // NEW: Generates the HTML for the preset builder panel
    function getPresetBuilderHTML() {
        return `
            <h4 style="text-align:center; margin-top: 0;">Preset Builder</h4>
            <label for="preset-name-input">Preset Name:</label>
            <input type="text" id="preset-name-input" placeholder="e.g., My Custom Preset" style="width:100%; padding: 5px; margin-top: 5px;">
            
            <div id="preset-pages-container">
                </div>

            <button id="add-page-btn" type="button" style="width:100%; margin-top: 10px; padding: 8px;">Add Page</button>
            <div style="display:flex; gap: 10px; margin-top: 15px;">
                <button id="save-preset-btn" type="button" style="flex-grow: 1; padding: 8px;">Save Preset</button>
                <button id="close-builder-btn" type="button" style="flex-grow: 1; padding: 8px;">Close</button>
            </div>
        `;
    }

    function processCustomPrint() {
        // ... (this function remains the same for now)
    }

    function getPageHTML(printData, mapImageSrc, pageNumber) {
        // ... (this function remains the same for now)
    }

    async function generateMultiPagePrintout(printData, pageConfigs) {
        // ... (this function remains the same for now)
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

        // NEW: Listener for the Manage Presets button
        document.getElementById('manage-presets-btn').addEventListener('click', () => {
            presetBuilderBox.innerHTML = getPresetBuilderHTML();
            presetBuilderBox.style.display = 'block';

            // Attach listener to the close button inside the new panel
            document.getElementById('close-builder-btn').addEventListener('click', () => {
                presetBuilderBox.style.display = 'none';
            });
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
            presetBuilderBox.style.display = 'none'; // Also hide builder if main dialog is closed
        }
    });    
});