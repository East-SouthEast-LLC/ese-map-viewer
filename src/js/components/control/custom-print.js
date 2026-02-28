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

    if (marker) {
        map.setCenter(marker.getLngLat());
    }

    allToggleableLayers.forEach(layerId => setLayerVisibility(layerId, 'none'));

    for (const config of pageConfigs) {
        const isUsgsPage = config.layers.includes('usgs quad');

        if (isUsgsPage) {
            if (typeof initializeUsgsTileManager === 'function') {
                await initializeUsgsTileManager();
            }
        } else {
            config.layers.forEach(layerId => setLayerVisibility(layerId, 'visible'));
            await new Promise(resolve => map.once('idle', resolve));
        }

        // ============================================================
        // PARCEL HIGHLIGHT (CLEAN SINGLE BLOCK)
        // ============================================================
        if (window.marker) {
            const pt = map.project(window.marker.getLngLat());

            const buffer = 5;
            const bbox = [
                [pt.x - buffer, pt.y - buffer],
                [pt.x + buffer, pt.y + buffer]
            ];

            const features = map.queryRenderedFeatures(bbox, {
                layers: ['parcel-fill']
            });

            if (features.length) {
                const parcelId = features[0].properties.MAP_PAR_ID;

                if (parcelId) {
                    map.setFilter('parcel-highlight', ['==', 'MAP_PAR_ID', parcelId]);
                }
            }
        }
        // ============================================================

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
                <link rel="stylesheet" href="https://east-southeast-llc.github.io/ese-map-viewer/src/css/globals.css?v=3" type="text/css" />

                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet">

                <style>
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