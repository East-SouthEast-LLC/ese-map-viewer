// src/js/components/toggleable-menu.js

function setupToggleableMenu() {
    const menuRightEdge = 305;
    const toolkitRightEdge = 580;
    const desiredGap = 10;
    const menuOnlyOffset = menuRightEdge + desiredGap;
    const fullToolkitOffset = toolkitRightEdge + desiredGap;
    
    const mapContainer = document.getElementById('map');
    const geocoderContainer = document.getElementById("geocoder-container");
    const menu = document.getElementById('menu');

    function openToolkit() {
        if (getComputedStyle(geocoderContainer).display === "none") {
            geocoderContainer.style.display = "flex";
            const toolsButton = document.querySelector('[data-layer-id="tools"]');
            if(toolsButton) toolsButton.classList.add('active');
            
            document.getElementById('bookmark-box').style.display = 'none';
            document.getElementById('bookmarkButton').classList.remove('active');
            document.getElementById('identify-box').style.display = 'none';
            document.getElementById('identifyButton').classList.remove('active');

            mapContainer.style.width = `calc(95vw - ${fullToolkitOffset}px)`;
            mapContainer.style.marginLeft = `${fullToolkitOffset}px`;
            setTimeout(() => map.resize(), 400);
        }
    }

    // first, manually create the 'tools' button as it's a special ui element
    const toolsLink = document.createElement('a');
    toolsLink.href = '#';
    toolsLink.textContent = 'Tools';
    toolsLink.dataset.layerId = 'tools';
    toolsLink.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        trackEvent('layer_toggle', {
            layer_id: 'tools',
            action: this.classList.contains('active') ? 'off' : 'on'
        });
        if (getComputedStyle(geocoderContainer).display === "none") {
            openToolkit();
        } else {
            geocoderContainer.style.display = "none";
            this.classList.remove('active');
            document.getElementById('bookmark-box').style.display = 'none';
            document.getElementById('bookmarkButton').classList.remove('active');
            mapContainer.style.width = `calc(95vw - ${menuOnlyOffset}px)`;
            mapContainer.style.marginLeft = `${menuOnlyOffset}px`;
            setTimeout(() => map.resize(), 400);
        }
    };
    menu.appendChild(toolsLink);


    // now, create the rest of the layer buttons dynamically
    if (window.toggleableLayerIds && window.layerConfig) {
        const menuLayers = window.layerConfig.filter(l => window.toggleableLayerIds.includes(l.id));

        for (const layerInfo of menuLayers) {
            const id = layerInfo.id;
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = layerInfo.displayName;
            link.dataset.layerId = id;

            link.onclick = function(e) {
                const clickedLayer = this.dataset.layerId;
                e.preventDefault();
                e.stopPropagation();

                trackEvent('layer_toggle', {
                    layer_id: clickedLayer,
                    action: this.classList.contains('active') ? 'off' : 'on'
                });
                
                const layerConfig = window.layerConfig.find(l => l.id === clickedLayer);
                if (!layerConfig) return;

                if (layerConfig.type === 'managed') {
                    const isActive = this.classList.toggle('active');
                    if (isActive) {
                        if (window.initializeUsgsTileManager) initializeUsgsTileManager();
                    } else {
                        if (window.deinitializeUsgsTileManager) deinitializeUsgsTileManager();
                    }
                    return;
                }

                if (layerConfig.type === 'managed-stream') {
                    const isActive = this.classList.toggle('active');
                    if (isActive) {
                        if (window.initializeUsgsStream) initializeUsgsStream();
                    } else {
                        if (window.deinitializeUsgsStream) deinitializeUsgsStream();
                    }
                    return;
                }
// chatgpt add 
if (clickedLayer === 'maphelp') {
    window.open('https://www.ese-llc.com/maphelp/map-help', '_blank', 'noopener,noreferrer');
    return;
}		
if (clickedLayer === 'donategis') {
    window.open('https://www.ese-llc.com/donate-gis', '_blank', 'noopener,noreferrer');
    return;
}		
if (clickedLayer === 'updates') {
    window.open('https://www.ese-llc.com/updates', '_blank', 'noopener,noreferrer');
    return;
}		
				

                if (!map.getLayer(clickedLayer)) {
                    return console.warn("Layer not found:", clickedLayer);
                }

                const isVisible = map.getLayoutProperty(clickedLayer, 'visibility') === 'visible';
                const newVisibility = isVisible ? 'none' : 'visible';
                map.setLayoutProperty(clickedLayer, 'visibility', newVisibility);
                this.className = newVisibility === 'visible' ? 'active' : '';

                if (layerConfig.dependencies) {
                    layerConfig.dependencies.forEach(depId => {
                        if (map.getLayer(depId)) {
                            map.setLayoutProperty(depId, 'visibility', newVisibility);
                        }
                    });
                }
                
                // Show/hide panorama controls box with the panoramas layer
                if (clickedLayer === 'panoramas') {
                    const panoControls = document.getElementById('pano-controls');
                    if (panoControls) {
                        panoControls.style.display = newVisibility === 'visible' ? 'block' : 'none';
                    }
                    // Reset sliders and color mode when hiding
                    if (newVisibility === 'none') {
                        window.panoColorMode = 'default';
                        const colorBtn = document.getElementById('pano-color-btn');
                        if (colorBtn) { colorBtn.textContent = '● Default'; colorBtn.style.color = '#00ffff'; }
                        const minSlider = document.getElementById('pano-min-slider');
                        const maxSlider = document.getElementById('pano-max-slider');
                        if (minSlider && maxSlider) {
                            minSlider.value = window.panoMinTs;
                            maxSlider.value = window.panoMaxTs;
                            const sliderValues = document.getElementById('pano-slider-values');
                            if (sliderValues) {
                                sliderValues.textContent = `${new Date(window.panoMinTs).toISOString().slice(0,10)} – ${new Date(window.panoMaxTs).toISOString().slice(0,10)}`;
                            }
                        }
                        map.setFilter('panoramas', null); // clear any active date filter
                        if (window.panoPanoData) {
                            map.setPaintProperty('panoramas', 'circle-color', [
                                'case',
                                ['boolean', ['feature-state', 'viewed'], false],
                                '#FFFF00',
                                '#00ffff'
                            ]);
                        }
                    }
                }

                if (clickedLayer === 'private properties upland') {
                    if (typeof window.toggleUplandControls === 'function') {
                        window.toggleUplandControls(newVisibility === 'visible');
                        if (newVisibility === 'visible') openToolkit();
                    }
                }
                
                if (typeof window.updateLegend === 'function') {
                    if (!map._legendUpdateListenerAdded) {
                        map._legendUpdateListenerAdded = true;
                        map.once('idle', function() {
                            window.updateLegend();
                            map._legendUpdateListenerAdded = false; 
                        });
                    }
                }
            };
    
            menu.appendChild(link);

            // ── ACCESS CODE button — injected below Pano Projects ────────────
            if (id === 'pano-projects-fill') {
                const codeBtn = document.createElement('a');
                codeBtn.href = '#';
                codeBtn.id = 'pano-access-btn';
                codeBtn.style.cssText = `
                    font-size: 10px;
                    padding: 2px 8px;
                    color: #aaa;
                    letter-spacing: 0.04em;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    border-top: none;
                    margin-top: -4px;
                `;
                codeBtn.innerHTML = `<span id="pano-lock-icon">🔒</span> ACCESS CODE`;

                codeBtn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const existing = document.getElementById('pano-code-popup');
                    if (existing) { existing.remove(); return; }

                    const popup = document.createElement('div');
                    popup.id = 'pano-code-popup';
                    popup.style.cssText = `
                        position: absolute;
                        left: 310px;
                        z-index: 1000;
                        background: rgba(0,0,0,0.85);
                        border-radius: 8px;
                        padding: 10px 12px;
                        display: flex;
                        gap: 6px;
                        align-items: center;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
                    `;
                    popup.innerHTML = `
                        <input id="pano-code-input" placeholder="ACCESS CODE"
                            style="font-family:monospace;font-size:12px;padding:5px 10px;border-radius:4px;
                                   border:1px solid #555;background:#111;color:#fff;width:130px;outline:none;">
                        <button id="pano-code-go"
                            style="font-family:monospace;font-size:12px;padding:5px 12px;border-radius:4px;
                                   border:none;background:#4488ff;color:#fff;cursor:pointer;font-weight:600;">
                            GO
                        </button>
                    `;

                    // Position vertically near the button
                    const btnRect = codeBtn.getBoundingClientRect();
                    popup.style.top = `${btnRect.top}px`;
                    document.getElementById('map').appendChild(popup);

                    const input = document.getElementById('pano-code-input');
                    input.focus();

                    async function submitCode() {
                        const val = input.value.trim();
                        if (!val) return;
                        const url = new URL(window.location.href);
                        url.searchParams.set('code', val);
                        window.location.href = url.toString();
                    }

                    document.getElementById('pano-code-go').addEventListener('click', submitCode);
                    input.addEventListener('keydown', e => { if (e.key === 'Enter') submitCode(); });

                    // Close popup if clicking outside
                    setTimeout(() => {
                        document.addEventListener('click', function closePop(ev) {
                            if (!popup.contains(ev.target) && ev.target !== codeBtn) {
                                popup.remove();
                                document.removeEventListener('click', closePop);
                            }
                        });
                    }, 100);
                };

                menu.appendChild(codeBtn);

                // Update lock icon based on current access code state
                function updateLockIcon() {
                    const icon = document.getElementById('pano-lock-icon');
                    const btn  = document.getElementById('pano-access-btn');
                    if (!icon || !btn) return;
                    const code = sessionStorage.getItem('panoAccessCode');
                    if (code) {
                        icon.textContent = '🔓';
                        btn.style.color  = '#88aaff';
                    } else {
                        icon.textContent = '🔒';
                        btn.style.color  = '#aaa';
                    }
                }

                // Check on load and whenever access code resolves
                updateLockIcon();
                window.panoAccessCodeReady?.then(updateLockIcon);
            }
        }
    }
    
    mapContainer.style.width = `calc(95vw - ${menuOnlyOffset}px)`;
    mapContainer.style.marginLeft = `${menuOnlyOffset}px`;
    map.resize();

    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 200, unit: 'imperial' }), 'bottom-right');
}
