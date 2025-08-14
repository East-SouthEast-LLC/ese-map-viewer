// src/js/components/control/identify.js

const identifyButton = document.getElementById('identifyButton');
const identifyBox = document.getElementById('identify-box');

if (!identifyButton || !identifyBox) {
    console.error("Required elements not found for the Identify tool.");
} else {
    let identifyMode = false;

    function handleIdentifyClick(e) {
        // this function no longer creates a marker. it only identifies features.
        
        const townLayerIds = window.toggleableLayerIds;

        const queryableLayers = window.layerConfig
            .filter(l => townLayerIds.includes(l.id) && l.identifyConfig)
            .map(l => l.id);

        const originalVisibilities = {};
        queryableLayers.forEach(layerId => {
            originalVisibilities[layerId] = map.getLayoutProperty(layerId, 'visibility') || 'none';
            map.setLayoutProperty(layerId, 'visibility', 'visible');
        });

        map.once('idle', () => {
            const features = map.queryRenderedFeatures(e.point, { layers: queryableLayers });
            let html = '<strong style="font-size: 14px;">Features at this Point</strong><hr style="margin: 2px 0 5px;">';
            const foundInfo = new Set();

            if (features.length > 0) {
                features.forEach(feature => {
                    const config = window.layerConfig.find(l => l.id === feature.layer.id);
                    if (config && config.identifyConfig) {
                        let info = config.identifyConfig.template;
                        
                        for (const key in feature.properties) {
                            const regex = new RegExp(`{${key}}`, 'g');
                            info = info.replace(regex, feature.properties[key]);
                        }

                        if (info && !foundInfo.has(info)) {
                            html += info + '<br>';
                            foundInfo.add(info);
                        }
                    }
                });
            }

            if (foundInfo.size === 0) {
                html += 'No data features found at this location.';
            }
            
            identifyBox.innerHTML = html;
            identifyBox.style.display = 'block';

            queryableLayers.forEach(layerId => {
                map.setLayoutProperty(layerId, 'visibility', originalVisibilities[layerId]);
            });

            exitIdentifyMode();
        });
    }
    
    function enterIdentifyMode() {
        trackEvent('identify_tool', {});
        identifyMode = true;
        // add a class to the map container to force the cursor style
        map.getCanvasContainer().classList.add('identify-mode-active');
        identifyButton.classList.add('active');
        map.once('click', handleIdentifyClick);
    }

    function exitIdentifyMode() {
        identifyMode = false;
        // remove the class to return to the default cursor behavior
        map.getCanvasContainer().classList.remove('identify-mode-active');
        identifyButton.classList.remove('active');
        map.off('click', handleIdentifyClick);
    }

    identifyButton.addEventListener('click', () => {
        if (identifyMode) {
            exitIdentifyMode();
            identifyBox.style.display = 'none';
        } else {
            enterIdentifyMode();
        }
    });
}