function addSewerPlansLayer() {
    map.addSource('sewer plans', {
        type: 'vector',
        url: 'mapbox://ese-toh.br0wm8ul'
    });

    map.addLayer({
        'id': 'sewer plans',
        'type': 'fill',
        'source': 'sewer plans',
        'source-layer': 'TOC_SEWER_2025-08-21b-13zzh6',
        'layout': {
            'visibility': 'none'
        },
        'paint': {
            'fill-opacity': 0.4,
            'fill-color': [
                'case',
                ['==', ['get', 'ADDED'], 'Y'],'#ffcccc',
                [
                    'case',
                    ['all', ['>=', ['to-number', ['get', 'DATE']], 2019], ['<=', ['to-number', ['get', 'DATE']], 2022]], '#d32f2f',
                    ['all', ['>=', ['to-number', ['get', 'DATE']], 2016], ['<=', ['to-number', ['get', 'DATE']], 2018]], '#d32f2f',
                    ['all', ['>=', ['to-number', ['get', 'DATE']], 2014], ['<', ['to-number', ['get', 'DATE']], 2016]], '#d32f2f',
                    ['all', ['>=', ['to-number', ['get', 'DATE']], 2011], ['<', ['to-number', ['get', 'DATE']], 2014]], '#b71c1c',
                    ['all', ['>=', ['to-number', ['get', 'DATE']], 2008], ['<', ['to-number', ['get', 'DATE']], 2011]], '#b71c1c',
                    ['all', ['>=', ['to-number', ['get', 'DATE']], 2007], ['<', ['to-number', ['get', 'DATE']], 2008]], '#a31515',
                    ['all', ['>=', ['to-number', ['get', 'DATE']], 2000], ['<', ['to-number', ['get', 'DATE']], 2007]], '#a31515',
                    ['all', ['>=', ['to-number', ['get', 'DATE']], 1983], ['<', ['to-number', ['get', 'DATE']], 2000]], '#7f1010',
                    ['all', ['>=', ['to-number', ['get', 'DATE']], 1969], ['<', ['to-number', ['get', 'DATE']], 1983]], '#4b0707',
                    /* fallback */ '#ffffff'
                ]
            ]
        }
    });

    map.addLayer({
        'id': 'sewer-plans-outline',
        'type': 'line',
        'source': 'sewer plans',
        'source-layer': 'TOC_SEWER_2025-08-21b-13zzh6',
        'layout': { 'visibility': 'none' },
        'paint': {
            'line-width': 0.5, 
            'line-color': '#000000', 
            'line-opacity': 0.5 
        }
    });

    map.on('mouseenter', 'sewer plans', function() {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'sewer plans', function() {
        map.getCanvas().style.cursor = '';
    });
}

addSewerPlansLayer();