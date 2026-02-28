// PRINT CONTROL BUTTON SCRIPT

/**
 * Generates the complete HTML for the standard print page body.
 * @param {string} mapImageSrc - The base64 encoded image of the map canvas.
 * @returns {string} The complete HTML for the print page.
 */
function getStandardPrintPageHTML(mapImageSrc) {
    const currentDate = new Date().toLocaleDateString();

    // This structure is based on the original, ensuring the layout remains identical.
    return `
        <div class="frame">
            <div class="top-frame">
                <div class="map-container">
                    <img src="${mapImageSrc}" alt="Map Image" />
                </div>
            </div>
            <div class="bottom-frame">
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


// ============================================================================
// MAIN PRINT FUNCTION (event listener)
// ============================================================================

document.getElementById('printButton').addEventListener('click', () => {
    trackEvent('print_map', {});

    // If marker exists, attempt to highlight the parcel first
    if (window.marker) {
        const pt = map.project(window.marker.getLngLat());

        const buffer = 5;
        const bbox = [
            [pt.x - buffer, pt.y - buffer],
            [pt.x + buffer, pt.y + buffer]
        ];

        const features = map.queryRenderedFeatures(bbox, {
            layers: ['parcel-fill'] // your polygon layer
        });

        if (features.length) {
            const parcelId = features[0].properties.MAP_PAR_ID;

            if (parcelId) {
                // Apply highlight filter BEFORE rendering the print image
                map.setFilter('parcel-highlight', ['==', 'MAP_PAR_ID', parcelId]);
            }
        }
    }

    map.once('render', () => {
        const canvas = map.getCanvas();
        const mapImageSrc = canvas.toDataURL();
        const win = window.open('', '_blank');

        if (win) {
            win.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Map Print</title>
                    <link rel="stylesheet" href="https://east-southeast-llc.github.io/ese-map-viewer/src/css/globals.css?v=3" type="text/css" />
                </head>
                <body class="print-body">
                    ${getStandardPrintPageHTML(mapImageSrc)}
                </body>
                </html>
            `);

            win.document.title = 'Map Print';
            win.document.close();

            win.onload = () => {
                win.print();
                win.close();
            };
        } else {
            alert("Popup blocked! Please allow popups for this site.");
        }

        // OPTIONAL: reset highlight after printing if you don't want it persistent
        // map.setFilter('parcel-highlight', ['==', 'MAP_PAR_ID', '']);
    });

    map.resize();
    map.triggerRepaint();
});