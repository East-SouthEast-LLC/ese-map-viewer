// src/js/components/control/identify.js

const identifyButton = document.getElementById('identifyButton');
const identifyBox = document.getElementById('identify-box');

if (!identifyButton || !identifyBox) {
    console.error("Required elements not found for the Identify tool.");
} else {
    let identifyMode = false;

function handleIdentifyClick(e) {

    // 1. capture original visibility for all layers in layerConfig
    const originalVisibilities = {};
    const queryableLayers = window.layerConfig
        .filter(l => l.identifyConfig)
        .map(l => l.id)
        .filter(id => map.getLayer(id));

    queryableLayers.forEach(layerId => {
        originalVisibilities[layerId] =
            map.getLayoutProperty(layerId, 'visibility') || 'none';

        // 2. temporarily show the layer
        map.setLayoutProperty(layerId, 'visibility', 'visible');
    });

    // 3. wait for render so features are available
    map.once('idle', () => {

        const features = map.queryRenderedFeatures(e.point, {
            layers: queryableLayers
        });

        let html = '<strong style="font-size: 14px;">Features at this Point</strong><hr style="margin: 2px 0 5px;">';
        const foundInfo = new Set();
        const layersWithData = new Set();

        if (features.length > 0) {
            features.forEach(feature => {

                const layerId = feature.layer.id;
                layersWithData.add(layerId);

                const config = window.layerConfig.find(l => l.id === layerId);
                if (!config || !config.identifyConfig) return;

                let info = config.identifyConfig.template;

                for (const key in feature.properties) {
                    info = info.replace(new RegExp(`{${key}}`, 'g'), feature.properties[key]);
                }

                if (info && !foundInfo.has(info)) {
                    html += info + '<br>';
                    foundInfo.add(info);
                }
            });
        }

        if (foundInfo.size === 0) {
            html += 'No data features found at this location.';
        }

        // 4. publish layers that actually returned data
        if (layersWithData.size > 0) {
            html += '<hr><strong>Layers with Data</strong><br>';
            layersWithData.forEach(id => {
                html += `• ${id}<br>`;
            });
        }

        identifyBox.innerHTML = html;
        identifyBox.style.display = 'block';

        // 5. restore original visibility
        queryableLayers.forEach(layerId => {
            map.setLayoutProperty(layerId, 'visibility', originalVisibilities[layerId]);
        });

        exitIdentifyMode();
    });
}

    function enterIdentifyMode() {
        trackEvent('identify_tool', {});
        identifyMode = true;
        map.getCanvasContainer().classList.add('identify-mode-active');
        identifyButton.classList.add('active');
        map.once('click', handleIdentifyClick);
    }

    function exitIdentifyMode() {
        identifyMode = false;
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