function addSewerLayer() {
    map.addSource('sewer', {
        type: 'vector',
        url: 'mapbox://ese-toh.0ylassrw'
    });
    map.addLayer({
        'id': 'sewer',
        'type': 'fill',
        'source': 'sewer',
        'source-layer': 'Chatham_Sewer_2020c-bx3fy3',
        'layout': {
            'visibility': 'none'
        },
        'paint': {
            'fill-opacity': 0.4,
            'fill-color': [
                'match',
                ['get', 'CONTRACT'],
                '2010', '#473b02',
                '2011', '#756410',
                '2012', '#5e4f1e',
                '2013', '#86873d',
                '2014', '#8c872a',
                '2015', '#ced12e',
                '2016', '#87713d',
                '2017', '#634d19',
                '2018', '#4a3503',
                '2019', '#8a8506',
                '2020', '#e7fa16',
                '2021', '#3d3610',
                '2022', '#78672c',
                /* other */ '#ffffff'
            ],
        },
    });

    map.on('mouseenter', 'sewer', function () {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'sewer', function () {
        map.getCanvas().style.cursor = '';
    });
}

addSewerLayer();