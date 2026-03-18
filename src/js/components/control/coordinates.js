(function () {

    const coordinatesButton = document.getElementById('coordinatesButton');
    const coordinatesBox = document.getElementById('coordinates-box');
    const shareButton = document.getElementById('shareButton'); // adjust if your Share Map button ID differs

    if (!coordinatesButton || !coordinatesBox || !window.map) {
        console.warn("coordinates tool: elements or map not found");
        return;
    }

    let active = false;
    let collectedPoints = [];
    let labelCounter = 65; // ASCII 'A'
    let currentCoordSystem = 'WGS84';

    // Append coordinatesBox to body and style
    document.body.appendChild(coordinatesBox);
    Object.assign(coordinatesBox.style, {
        position: 'absolute',
        width: '240px',
        maxHeight: '80vh',
        overflowY: 'auto',
        background: '#fff',
        border: '1px solid #ccc',
        padding: '6px',
        zIndex: 9999,
        display: 'none'
    });

    // Position box under Share Map button
    function updateBoxPosition() {
        if (!shareButton) return;
        const rect = shareButton.getBoundingClientRect();
        const boxWidth = coordinatesBox.offsetWidth || 240;
        const centerX = rect.left + rect.width / 2;
        coordinatesBox.style.left = `${centerX - boxWidth/2}px`;
        coordinatesBox.style.top = `${rect.bottom + 4}px`;
    }

    function toDMS(dec, type) {
        const absolute = Math.abs(dec);
        const degrees = Math.floor(absolute);
        const minutesFull = (absolute - degrees) * 60;
        const minutes = Math.floor(minutesFull);
        const seconds = ((minutesFull - minutes) * 60).toFixed(4);
        let hemisphere = '';
        if(type==='lat') hemisphere = dec >= 0 ? 'N' : 'S';
        if(type==='lon') hemisphere = dec >= 0 ? 'E' : 'W';
        return `${degrees}°${String(minutes).padStart(2,'0')}'${String(seconds).padStart(7,'0')}" ${hemisphere}`;
    }

// Include proj4.js in your page first: <script src="https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.8.0/proj4.js"></script>

function convertCoordinates(lat, lon, system){
    // WGS84 decimal lat/lon
    if(system==='WGS84') return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;

const projections = {
    // --- WGS84 remains decimal lat/lon ---
    WGS84: null, // no conversion needed

    // --- NARTF22 (Massachusetts TM) ---
    NARTF22_m: "+proj=tmerc +lat_0=42.0 +lon_0=-71.5 +k=1.0 +x_0=200000 +y_0=750000 +datum=NAD83 +units=m +no_defs",
    NARTF22_USFt: "+proj=tmerc +lat_0=42.0 +lon_0=-71.5 +k=1.0 +x_0=656167 +y_0=2460629 +datum=NAD83 +units=us-ft +no_defs",

    // --- NAD83 Mainland (Massachusetts LCC) ---
    NAD83_Mainland_m: "+proj=lcc +lat_1=41.71666666666667 +lat_2=42.68333333333333 +lat_0=41 +lon_0=-71.5 +x_0=200000 +y_0=750000 +datum=NAD83 +units=m +no_defs",
    NAD83_Mainland_USFt: "+proj=lcc +lat_1=41.71666666666667 +lat_2=42.68333333333333 +lat_0=41 +lon_0=-71.5 +x_0=656167 +y_0=2460629 +datum=NAD83 +units=us-ft +no_defs",

    // --- NAD27 Mainland (Massachusetts LCC) with rough datum shift ---
    NAD27_Mainland_m: "+proj=lcc +lat_1=41.71666666666667 +lat_2=42.68333333333333 +lat_0=41 +lon_0=-71.5 +x_0=200000 +y_0=750000 +datum=NAD27 +towgs84=-8,160,176,0,0,0,0 +units=m +no_defs",
    NAD27_Mainland_USFt: "+proj=lcc +lat_1=41.71666666666667 +lat_2=42.68333333333333 +lat_0=41 +lon_0=-71.5 +x_0=656167 +y_0=2460629 +datum=NAD27 +towgs84=-8,160,176,0,0,0,0 +units=us-ft +no_defs",

    // --- Optional Island placeholders ---
    NAD83_Island_m: "+proj=lcc +lat_1=20 +lat_2=21 +lat_0=19 +lon_0=-155 +x_0=0 +y_0=0 +datum=NAD83 +units=m +no_defs",
    NAD83_Island_USFt: "+proj=lcc +lat_1=20 +lat_2=21 +lat_0=19 +lon_0=-155 +x_0=0 +y_0=0 +datum=NAD83 +units=us-ft +no_defs",
    NAD27_Island_m: "+proj=lcc +lat_1=20 +lat_2=21 +lat_0=19 +lon_0=-155 +x_0=0 +y_0=0 +datum=NAD27 +towgs84=-8,160,176,0,0,0,0 +units=m +no_defs",
    NAD27_Island_USFt: "+proj=lcc +lat_1=20 +lat_2=21 +lat_0=19 +lon_0=-155 +x_0=0 +y_0=0 +datum=NAD27 +towgs84=-8,160,176,0,0,0,0 +units=us-ft +no_defs"
};

    if(!(system in projections)) return `${lat.toFixed(6)}, ${lon.toFixed(6)} (${system})`;

    const proj = projections[system];
    const [x, y] = proj4("WGS84", proj, [lon, lat]); // note: proj4 takes [lon, lat]
    return `${x.toFixed(3)}, ${y.toFixed(3)} (${system})`;
}

    function showConfirmPopup(x, y, message, callback){
        const popup = document.createElement("div");
        Object.assign(popup.style, {
            position:'absolute', left:`${x}px`, top:`${y}px`,
            background:'#fff', border:'1px solid #ccc',
            padding:'4px 6px', zIndex:10000,
            boxShadow:'0 2px 4px rgba(0,0,0,0.2)', fontSize:'12px'
        });
        popup.innerHTML = `
            <div style="margin-bottom:4px;">${message}</div>
            <div style="text-align:right;">
                <button id="confirmNo">No</button>
                <button id="confirmYes" style="margin-left:4px;">Yes</button>
            </div>
        `;
        document.body.appendChild(popup);
        popup.querySelector("#confirmNo").onclick = ()=>{document.body.removeChild(popup); callback(false);};
        popup.querySelector("#confirmYes").onclick = ()=>{document.body.removeChild(popup); callback(true);};
    }

    function refreshMapPoints(){
        if(!window.map.getSource('user-points')) return;
        const geojson = {
            type:"FeatureCollection",
            features: collectedPoints.map((pt,index)=>({
                type:"Feature",
                properties:{label:String.fromCharCode(65+index)},
                geometry:{type:"Point", coordinates:[pt.lonDecimal, pt.latDecimal]}
            }))
        };
        window.map.getSource('user-points').setData(geojson);
    }

    function exportToCSV() {
        if (!collectedPoints.length) {
            alert("No points to export.");
            return;
        }
        let csv = "Label,Description,Latitude,Longitude\n";
        collectedPoints.forEach((p,i)=>{
            csv += `"${String.fromCharCode(65+i)}","${p.description}",${p.latDecimal},${p.lonDecimal}\n`;
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "coordinates_export.csv";
        link.click();
        URL.revokeObjectURL(url);
    }

function renderPointsList(){
    updateBoxPosition();
    coordinatesBox.style.display = 'block';

    let html = `
        <div class="coord-title">Collected Points</div>
        <div class="coord-dropdown" style="margin-bottom:6px;">
            <label for="coordSystemSelect">Coordinate System:</label>
            <select id="coordSystemSelect">
                <option value="WGS84">WGS84</option>
                <option value="NARTF22_m">NARTF22 meters</option>
                <option value="NARTF22_USFt">NARTF22 US feet</option>
                <option value="NAD83_Mainland_m">NAD83 Mainland meters</option>
                <option value="NAD83_Mainland_USFt">NAD83 Mainland US feet</option>
                <option value="NAD83_Island_m">NAD83 Island meters</option>
                <option value="NAD83_Island_USFt">NAD83 Island US feet</option>
                <option value="NAD27_Mainland_m">NAD27 Mainland meters</option>
                <option value="NAD27_Mainland_USFt">NAD27 Mainland US feet</option>
                <option value="NAD27_Island_m">NAD27 Island meters</option>
                <option value="NAD27_Island_USFt">NAD27 Island US feet</option>
            </select>
        </div>
    `;

    // Loop through points
    collectedPoints.forEach((p,index)=>{
        const coordDisplay = convertCoordinates(p.latDecimal, p.lonDecimal, currentCoordSystem);
        html += `
            <div class="coord-row">
                <button class="label-btn" data-index="${index}">${String.fromCharCode(65+index)}</button>
                <div class="coord-values" style="width:180px;">
                    <div>${coordDisplay}</div>
                </div>
                <div class="coord-actions">
                    <button class="desc-btn">D</button>
                    <button class="del-btn">X</button>
                </div>
            </div>
        `;
    });

    html += `
        <div class="coord-footer" style="margin-top:6px;">
            <button id="copyCoords" class="coord-main-btn">COPY</button>
            <button id="exportCSV" class="coord-main-btn">EXPORT</button>
            <button id="clearCoords" class="coord-main-btn">CLEAR</button>
        </div>
    `;

    coordinatesBox.innerHTML = html;

    // Coordinate system dropdown
    const select = document.getElementById('coordSystemSelect');
    select.value = currentCoordSystem;
    select.onchange = ()=>{
        currentCoordSystem = select.value;
        renderPointsList(); // refresh with new system
    };

    // Row button actions
    coordinatesBox.onclick = (e)=>{
        const target = e.target;
        const row = target.closest('.coord-row');
        if(!row) return;
        const idx = parseInt(row.querySelector('.label-btn').dataset.index);
        const point = collectedPoints[idx];

        if(target.classList.contains('label-btn')){
            // Fly to point
            window.map.flyTo({center:[point.lonDecimal, point.latDecimal], essential:true});
        }
        if(target.classList.contains('desc-btn')){
            const newDesc = prompt("Edit description:", point.description);
            if(newDesc!==null){ point.description=newDesc; renderPointsList(); }
        }
        if(target.classList.contains('del-btn')){
            const rect = target.getBoundingClientRect();
            showConfirmPopup(rect.left+rect.width, rect.top, "Delete this point?", ok=>{
                if(!ok) return;
                collectedPoints.splice(idx,1);
                refreshMapPoints();
                renderPointsList();
            });
        }
    };

    // Footer buttons
    const copyBtn = document.getElementById('copyCoords');
    const exportBtn = document.getElementById('exportCSV');
    const clearBtn = document.getElementById('clearCoords');

    if(copyBtn){
        copyBtn.onclick = ()=>{
            const csv = collectedPoints.map((p,i)=>{
                const coordDisplay = convertCoordinates(p.latDecimal,p.lonDecimal,currentCoordSystem);
                return `"${String.fromCharCode(65+i)}","${p.description}","${coordDisplay}"`;
            }).join("\n");
            navigator.clipboard.writeText(csv).then(()=>alert("Copied to clipboard"));
        };
    }
    if(exportBtn){
        exportBtn.onclick = ()=>{
            if(!collectedPoints.length){ alert("No points to export."); return; }
            let csv = "Label,Description,Coordinates\n";
            collectedPoints.forEach((p,i)=>{
                const coordDisplay = convertCoordinates(p.latDecimal,p.lonDecimal,currentCoordSystem);
                csv += `"${String.fromCharCode(65+i)}","${p.description}","${coordDisplay}"\n`;
            });
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "coordinates_export.csv";
            link.click();
            URL.revokeObjectURL(url);
        };
    }
    if(clearBtn){
        clearBtn.onclick = ()=>{
            if(!confirm("Clear all points?")) return;
            collectedPoints=[];
            labelCounter=65;
            refreshMapPoints();
            renderPointsList();
        };
    }
}

    function handleMapClick(e){
        const {lat,lng} = e.lngLat;
        const label = String.fromCharCode(labelCounter++);
        const point = {label, description:"", latDecimal:lat, lonDecimal:lng, latDMS:toDMS(lat,'lat'), lonDMS:toDMS(lng,'lon')};
        collectedPoints.push(point);
        refreshMapPoints();
        renderPointsList();
    }

    function addSourceAndLayers(){
        if(!window.map.getSource('user-points')){
            window.map.addSource('user-points',{type:'geojson', data:{type:"FeatureCollection", features:[]}});
        }
        if(window.map.getLayer('user-points-layer')) window.map.removeLayer('user-points-layer');
        if(window.map.getLayer('user-points-label')) window.map.removeLayer('user-points-label');

        window.map.addLayer({
            id:'user-points-layer', type:'circle', source:'user-points',
            paint:{'circle-radius':6,'circle-stroke-width':2,'circle-color':'#ff0000','circle-stroke-color':'#ffffff'}
        });
        window.map.addLayer({
            id:'user-points-label', type:'symbol', source:'user-points',
            layout:{'text-field':['get','label'],'text-size':12,'text-anchor':'top-left','text-offset':[1,-1]},
            paint:{'text-color':'#000000'}
        });
        refreshMapPoints();
    }

    function enable(){
        active=true;
        coordinatesButton.classList.add('active');
        window.map.getCanvas().style.cursor='crosshair';
        if(window.map.isStyleLoaded()) addSourceAndLayers();
        else window.map.once('load', addSourceAndLayers);
        window.map.on('click', handleMapClick);
    }

    function disable(){
        active=false;
        coordinatesButton.classList.remove('active');
        window.map.getCanvas().style.cursor='';
        coordinatesBox.style.display='none';
        window.map.off('click', handleMapClick);
    }

    coordinatesButton.addEventListener('click', ()=>{
        active ? disable() : (enable(), renderPointsList());
    });

})();