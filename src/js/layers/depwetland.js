function addDepWetlandLayer() {

    // source: polygons
    if (!map.getSource('DEP wetland')) {
        map.addSource('DEP wetland', {
            type: 'vector',
            url: 'mapbox://ese-toh.aflbsqhu'
        });
    }

    if (!map.getLayer('DEP wetland')) {
        map.addLayer({...});
    }

    // labels
    if (!map.getLayer('dep-wetland-labels')) {
        map.addLayer({...});
    }

    // line source
    if (!map.getSource('dep-wetland-line')) {
        map.addSource('dep-wetland-line', {
            type: 'vector',
            url: 'mapbox://ese-toh.4l1powhy'
        });
    }

    if (!map.getLayer('dep-wetland-line')) {
        map.addLayer({...});
    }

    // event handlers (only once)
    if (!map._depWetlandHoverBound) {
        map.on('mouseenter', 'DEP wetland', () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'DEP wetland', () => {
            map.getCanvas().style.cursor = '';
        });

        map._depWetlandHoverBound = true;
    }
}

addDepWetlandLayer();