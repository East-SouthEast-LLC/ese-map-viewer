// src/js/components/control/toggle-off.js

const toggleOffButton = document.getElementById('toggleOffButton');

if (!toggleOffButton) {
    console.error("Toggle Off button not found in the DOM.");
} else {
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

    toggleOffButton.addEventListener('click', () => {
        // iterate through all toggleable layers and turn them off
        if (window.toggleableLayerIds) {
            window.toggleableLayerIds.forEach(layerId => {
                // 'tools' is not a real layer, so we skip it
                if (layerId !== 'tools') {
                    const layerConfig = window.layerConfig.find(l => l.id === layerId);
                    if (layerConfig && layerConfig.type === 'managed') {
                         if (window.deinitializeUsgsTileManager) deinitializeUsgsTileManager();
                    } else {
                        setLayerVisibility(layerId, 'none');
                    }
                }
            });
        }

        // deactivate all buttons in the main layer menu
        document.querySelectorAll('#menu a').forEach(button => {
            button.classList.remove('active');
        });

        // also deactivate the special 'private properties upland' controls if they exist
        if (typeof window.toggleUplandControls === 'function') {
            window.toggleUplandControls(false);
        }
        
        // update the legend to reflect that no layers are visible
        if (typeof window.updateLegend === 'function') {
            window.updateLegend();
        }
        
        console.log("All layers toggled off.");
    });
}