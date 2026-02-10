// control-legend.js

// define the legendData globally
let legendData = [];

function getPrintBoundingBox() {
    if (!map) return;
    const center = map.getCenter();
    const bounds = map.getBounds();
    const northLat = bounds.getNorth();
    const centerLat = center.lat;
    const halfHeightMeters = turf.distance([center.lng, center.lat], [center.lng, northLat], { units: 'meters' });
    const halfWidthMeters = halfHeightMeters;
    const north = centerLat + (halfHeightMeters / 111320);
    const south = centerLat - (halfHeightMeters / 111320);
    const lngDiff = halfWidthMeters / (111320 * Math.cos(centerLat * (Math.PI / 180)));
    const east = center.lng + lngDiff;
    const west = center.lng - lngDiff;
    return [[west, north], [east, north], [east, south], [west, south], [west, north]];
}


function getLegendForPrint(expectedLayerIds = []) {
    const geoJsonBounds = getPrintBoundingBox();
    if (!geoJsonBounds) {
        return '<div class="legend-item">Error calculating print area.</div>';
    }
    
    const topLeftGeo = geoJsonBounds[0];
    const bottomRightGeo = geoJsonBounds[2];
    const topLeftPixel = map.project(topLeftGeo);
    const bottomRightPixel = map.project(bottomRightGeo);
    const printPixelBoundingBox = [ [topLeftPixel.x, topLeftPixel.y], [bottomRightPixel.x, bottomRightPixel.y] ];

    const allItemsToRender = []; 
    const renderedLegendSections = new Set();
    
    const allQueryableLayers = legendData.flatMap(l => l.sources ? l.sources.map(s => s.id) : [])
                                         .filter(id => map.getLayer(id) && map.getLayoutProperty(id, 'visibility') === 'visible');
                                         
    const allVisibleFeatures = allQueryableLayers.length > 0 ? map.queryRenderedFeatures(printPixelBoundingBox, { layers: allQueryableLayers }) : [];

    const featuresByLayer = allVisibleFeatures.reduce((acc, feature) => {
        const layerId = feature.layer.id;
        if (!acc[layerId]) { acc[layerId] = []; }
        acc[layerId].push(feature);
        return acc;
    }, {});


    legendData.forEach(layerInfo => {
        // --- CORRECTED LOGIC FOR ALL SPECIAL CASES ---

        // 1. handle satellite imagery
        if (layerInfo.displayName === "Satellite Imagery") {
            if (map.getLayer('satellite') && map.getLayoutProperty('satellite', 'visibility') === 'visible') {
                allItemsToRender.push(`<div class="legend-section">${layerInfo.displayName}</div>`);
                const item = layerInfo.items[0];
                const style = `background-color: ${item.color}; opacity: ${item.opacity};`;
                const swatchClass = 'color-box';
                allItemsToRender.push(
                    `<div class="legend-item">
                        <span class="${swatchClass}" style="${style}"></span>
                        <span>${item.label}</span>
                    </div>`
                );
                renderedLegendSections.add(layerInfo.displayName);
            }
            return; // done with this item, move to the next
        }

        // 2. handle usgs quads
        if (layerInfo.id === 'usgs-quad-legend') {
            // the `deinitialize` function in the print script ensures this is false during printing.
            // this logic correctly prevents it from appearing.
            if (window.usgsTilesInitialized && map.getZoom() >= 12) {
                allItemsToRender.push(`<div class="legend-section">${layerInfo.displayName}</div>`);
                const item = layerInfo.items[0];
                const style = `background-color: ${item.color}; opacity: ${item.opacity};`;
                const swatchClass = 'color-box';
                allItemsToRender.push(
                    `<div class="legend-item">
                        <span class="${swatchClass}" style="${style}"></span>
                        <span>${item.label}</span>
                    </div>`
                );
                renderedLegendSections.add(layerInfo.displayName);
            }
            return; // done with this item, move to the next
        }
        // 3. handle parcel highlight

		
		
        // 4. handle all other vector layers
        if (!layerInfo.sources) {
            return;
        }

        const sourceLayerIds = layerInfo.sources.map(s => s.id);
        const visibleFeaturesForLayer = sourceLayerIds.flatMap(id => featuresByLayer[id] || []);

        if (visibleFeaturesForLayer.length === 0) {
            return;
        }

        const itemsToShow = new Set();
        const matchedFeatureIds = new Set();

        layerInfo.items.forEach(item => {
            if (!item.code && !item.match) {
                const itemLayerId = item.id || (layerInfo.sources.length === 1 ? layerInfo.sources[0].id : null);
                if (itemLayerId && featuresByLayer[itemLayerId] && featuresByLayer[itemLayerId].length > 0) {
                    itemsToShow.add(item.label);
                }
                return;
            }

            for (const feature of visibleFeaturesForLayer) {
                if (matchedFeatureIds.has(feature.id) && item.code !== "__default__") {
                    continue;
                }
                
                const props = feature.properties;

                if (item.match) { 
                    const rule = item.match;
                    if (props[rule.property] === rule.value) { itemsToShow.add(item.label); } 
                    else if (rule.property === "DATE" && (Number(props.DATE) >= rule.min && Number(props.DATE) <= rule.max)) { itemsToShow.add(item.label); } 
                    else if (rule.property === "_LOT_SIZE" && (Number(props._LOT_SIZE) >= rule.min && Number(props._LOT_SIZE) <= rule.max)) { itemsToShow.add(item.label); }
                } else if (item.code && item.code !== "__default__") {
                    const source = layerInfo.sources.find(s => s.id === feature.layer.id);
                    if (source && String(props[source.propertyKey]) === String(item.code)) {
                        itemsToShow.add(item.label);
                        matchedFeatureIds.add(feature.id);
                    }
                } else if (item.code && item.code === "__default__") {
                    itemsToShow.add(item.label);
                }
            }
        });
        
        const hasSpecificItem = layerInfo.items.some(item => item.code !== "__default__" && itemsToShow.has(item.label));
        const defaultItem = layerInfo.items.find(item => item.code === "__default__");
        if (hasSpecificItem && defaultItem && itemsToShow.has(defaultItem.label)) {
             itemsToShow.delete(defaultItem.label);
        }

        if (itemsToShow.size > 0) {
            allItemsToRender.push(`<div class="legend-section">${layerInfo.displayName}</div>`);
            renderedLegendSections.add(layerInfo.displayName);
            const visibleItems = layerInfo.items.filter(item => itemsToShow.has(item.label));
            visibleItems.forEach(item => {
                const style = `background-color: ${item.color}; opacity: ${item.opacity};`;
                const swatchClass = item.isLine ? 'color-line' : 'color-box';
                allItemsToRender.push(
                    `<div class="legend-item">
                        <span class="${swatchClass}" style="${style}"></span>
                        <span>${item.label}</span>
                    </div>`
                );
            });
        }
    });
    
    if (expectedLayerIds && expectedLayerIds.length > 0) {
        const expectedButNotRendered = [];
        const expectedDisplayNames = new Set();
        expectedLayerIds.forEach(expectedId => {
            const layerInfo = legendData.find(info => 
                (info.sources && info.sources.some(s => s.id === expectedId)) || (info.items && info.items.some(i => i.id === expectedId))
            );
            if (layerInfo) {
                expectedDisplayNames.add(layerInfo.displayName);
            }
        });
        
        expectedDisplayNames.forEach(displayName => {
            if (!renderedLegendSections.has(displayName)) {
                expectedButNotRendered.push(
                    `<div class="legend-item-not-present">${displayName}: Not Present in Print Area</div>`
                );
            }
        });

        if (expectedButNotRendered.length > 0) {
            allItemsToRender.push(...expectedButNotRendered);
        }
    }

    if (allItemsToRender.length === 0) {
        return '<div class="legend-grid"></div>';
    }

    const maxPrintableItems = 13;
    let finalItemsHTML = '';
    if (allItemsToRender.length > maxPrintableItems) {
        const truncatedItems = allItemsToRender.slice(0, maxPrintableItems - 1);
        truncatedItems.push('<div class="legend-item">... and more</div>');
        finalItemsHTML = truncatedItems.join('');
    } else {
        finalItemsHTML = allItemsToRender.join('');
    }
    return `<div class="legend-grid">${finalItemsHTML}</div>`;
}

const legendButton = document.getElementById("legendButton");
const legendBox = document.getElementById("legend-box");
let legendVisibility = false;
legendBox.style.display = 'none';

if (!legendButton || !legendBox) {
    console.error("Required elements not found in the DOM.");
} else {

    fetch('https://east-southeast-llc.github.io/ese-map-viewer/assets/data/layer_config.json')
        .then(response => response.json())
        .then(data => {
            // filter out layers that do not have a legendConfig and map to a new array
            legendData = data
                .filter(layer => layer.legendConfig)
                .map(layer => layer.legendConfig);
        })
        .catch(error => {
            console.error('error fetching legend data:', error);
            legendBox.innerHTML = "Could not load legend data.";
        });

    function updateLegend() {
        if (legendBox.style.display === 'none') return;

        let legendHTML = '';

        legendData.forEach(layerInfo => {
            if (layerInfo.id === 'usgs-quad-legend') {
                if (window.usgsTilesInitialized && map.getZoom() >= 12) {
                    legendHTML += `<div class="legend-title">${layerInfo.displayName}</div>`;
                    const item = layerInfo.items[0];
                    const style = `background-color: ${item.color}; opacity: ${item.opacity};`;
                    const swatchClass = 'color-box';
                    legendHTML += `
                        <div class="legend-item-row">
                            <span class="${swatchClass}" style="${style}"></span>
                            <span>${item.label}</span>
                        </div>
                    `;
                }
                return; 
            }

            // (the rest of the logic for other layers remains the same)
            const availableSourceIds = (layerInfo.sources || []).map(s => s.id).filter(id => map.getLayer(id));
            
            if (availableSourceIds.length === 0) {
                if (layerInfo.displayName === "Satellite Imagery" && map.getLayer('satellite') && map.getLayoutProperty('satellite', 'visibility') === 'visible') {
                } else {
                    return;
                }
            }
            
            const allVisibleFeatures = map.queryRenderedFeatures({ layers: availableSourceIds });

            if (allVisibleFeatures.length === 0) {
                if (layerInfo.displayName === "Satellite Imagery" && map.getLayer('satellite') && map.getLayoutProperty('satellite', 'visibility') === 'visible') {
                    legendHTML += `<div class="legend-title">${layerInfo.displayName}</div>`;
                    const item = layerInfo.items[0];
                    const style = `background-color: ${item.color}; opacity: ${item.opacity};`;
                    const swatchClass = item.isLine ? 'color-line' : 'color-box';
                    legendHTML += `
                        <div class="legend-item-row">
                            <span class="${swatchClass}" style="${style}"></span>
                            <span>${item.label}</span>
                        </div>
                    `;
                }
                return;
            }

            const featuresByLayer = allVisibleFeatures.reduce((acc, feature) => {
                const layerId = feature.layer.id;
                if (!acc[layerId]) { acc[layerId] = []; }
                acc[layerId].push(feature);
                return acc;
            }, {});

            const itemsToShow = new Set();
            const matchedFeatureIds = new Set();

            layerInfo.items.forEach(item => {
                if (!item.code && !item.match) {
                    const itemLayerId = item.id || (layerInfo.sources.length === 1 ? layerInfo.sources[0].id : null);
                    if (itemLayerId && featuresByLayer[itemLayerId] && featuresByLayer[itemLayerId].length > 0) {
                        itemsToShow.add(item.label);
                    }
                    return; 
                }

                for (const feature of allVisibleFeatures) {
                    if (matchedFeatureIds.has(feature.id)) { continue; }
                    
                    const props = feature.properties;
                    
                    if (item.match) {
                        const rule = item.match;
                        if (props[rule.property] === rule.value) { itemsToShow.add(item.label); } 
                        else if (rule.property === "DATE" && (Number(props.DATE) >= rule.min && Number(props.DATE) <= rule.max)) { itemsToShow.add(item.label); } 
                        else if (rule.property === "_LOT_SIZE" && (Number(props._LOT_SIZE) >= rule.min && Number(props._LOT_SIZE) <= rule.max)) { itemsToShow.add(item.label); } 
                    } else if (item.code && item.code !== "__default__") {
                        const source = layerInfo.sources.find(s => s.id === feature.layer.id);
                        if (source && String(props[source.propertyKey]) === String(item.code)) {
                            itemsToShow.add(item.label);
                            matchedFeatureIds.add(feature.id);
                        }
                    } else if (item.code && item.code === "__default__") {
                        itemsToShow.add(item.label);
                    }
                }
            });
            
            const hasSpecificItem = layerInfo.items.some(item => item.code !== "__default__" && itemsToShow.has(item.label));
            const defaultItem = layerInfo.items.find(item => item.code === "__default__");
            if (hasSpecificItem && defaultItem && itemsToShow.has(defaultItem.label)) {
                 itemsToShow.delete(defaultItem.label);
            }

            if (itemsToShow.size > 0) {
                legendHTML += `<div class="legend-title">${layerInfo.displayName}</div>`;
                const visibleItems = layerInfo.items.filter(item => itemsToShow.has(item.label));
                visibleItems.forEach(item => {
                    const style = `background-color: ${item.color}; opacity: ${item.opacity};`;
                    const swatchClass = item.isLine ? 'color-line' : 'color-box';
                    legendHTML += `
                        <div class="legend-item-row">
                            <span class="${swatchClass}" style="${style}"></span>
                            <span>${item.label}</span>
                        </div>
                    `;
                });
            }
        });

        if (legendHTML === '') {
            legendHTML = '<div>No layers with a legend are currently visible.</div>';
        }
        
        legendBox.innerHTML = legendHTML;
    }

    window.updateLegend = updateLegend;

    legendButton.addEventListener('click', () => {
        legendVisibility = !legendVisibility;
        if (legendVisibility) {
            legendBox.style.display = 'block';
            legendButton.classList.add('active');
            updateLegend();
        } else {
            legendBox.style.display = 'none';
            legendButton.classList.remove('active');
        }
    });

    map.on('moveend', updateLegend);
    map.on('zoom', updateLegend);
};