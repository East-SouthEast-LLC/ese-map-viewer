// src/js/components/popup-manager.js

/**
 * generates the html content for a map popup based on the layer's configuration.
 * @param {object} feature - the mapbox feature object that was clicked.
 * @returns {string|null} the html string for the popup, or null if no config exists.
 */
function generatePopupHTML(feature) {
    if (!window.layerConfig) {
        console.error("Layer configuration not found.");
        return null;
    }

    // find the configuration for the clicked layer
    const config = window.layerConfig.find(l => l.id === feature.layer.id || (l.dependencies && l.dependencies.includes(feature.layer.id)));

    // if there's no popup config for this layer, do nothing
    if (!config || !config.popupConfig || !config.popupConfig.template) {
        return null;
    }

    let template = config.popupConfig.template;
    const props = feature.properties;

    // replace all placeholders like {property_name} with actual values
    for (const key in props) {
        const regex = new RegExp(`{${key}}`, 'g');
        template = template.replace(regex, props[key]);
    }

    // special handling for links to ensure they are clickable
    template = template.replace(/href="([^"]+)"/g, (match, url) => {
        if (url && url !== 'null' && url.trim() !== '') {
            return `href="${url}" target="_blank"`;
        }
        return 'href="#" style="pointer-events:none; color:grey;"';
    });

    return template;
}