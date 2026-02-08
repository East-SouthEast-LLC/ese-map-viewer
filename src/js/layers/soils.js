function addSoilsLayer() {
	// add source for soils SE
	map.addSource('soils', {
		type: 'vector',
		url: 'mapbox://ese-toh.2bmwa01h'
	});

	// add layer for soils
	map.addLayer({
		'id': 'soils',
		'type': 'fill',
		'source': 'soils',
		'source-layer': '2026_soils_SE-3a559s',
		'layout': {
			'visibility': 'none'
		},
		'paint': {
			'fill-opacity': [
				'match',
				['get', 'SLOPE'],
				'0', 0.6, 'A', 0.45, 'B', 0.50, 'C', 0.55, 'D', 0.60,
				/* other */ 0.04
			],
			'fill-color': [
				'match',
				['get', 'MUSYM'],
				'258A', '#C88F0D', '430B', '#EAE23B', '430C', '#FFE60A', '431B', '#EBEE1E',
				'431C', '#EBEE1E', '432D', '#EBEE1E', '485C', '#EEF108', '488C', '#E4E65A',
				'489C', '#E4E65A', '490C', '#E4E65A', '494C', '#E4E65A', '610', '#EEEF89',
				'225B', '#BC8A26', '11A', '#444F61', '220A', '#BA7E06', '220B', '#BA7E06',
				'259A', '#F6EE2E', '259B', '#F6EE2E', '252A', '#F5E663', '252B', '#F5E663',
				'252C', '#F5E663', '252D', '#F5E663', '263B', '#f5b73b', '263C', '#f5b73b',
				'263D', '#f5b73b', '256A', '#edd768', '652', '#8c8a80', '611', '#fdff99',
				'264A', '#f0f26f', '264B', '#f0f26f', '264C', '#f0f26f', '264D', '#f0f26f',
				'265A', '#dee046', '265B', '#dee046', '265C', '#dee046', '52A', '#272D4B',
				'54A', '#211F56', '55A', '#5F5E6D', '253A', '#e3dc81', '253B', '#e3dc81',
				'242C', '#e3dc81', '242D', '#e3dc81', '226A', '#9e951c', '226B', '#9e951c',
				'226C', '#9e951c', '612C', '#c9c973', '612D', '#c9c973', '613C', '#e0e094',
				'66A', '#484679', '12A', '#131230', '13A', '#524670', '254A', '#c2b91d',
				'254B', '#c2b91d', '254C', '#c2b91d', '254D', '#c2b91d', '245A', '#c2b91d',
				'245B', '#c2b91d', '245C', '#c2b91d', '245D', '#c2b91d', '299', '#f2e6a7',
				'299A', '#f2e6a7', '299B', '#f2e6a7', '299C', '#f2e6a7', '299D', '#f2e6a7',
				'380B', '#807c69', '380C', '#807c69', '381B', '#6e6d67', '381C', '#6e6d67',
				'38A', '#412D70', '600', '#d1cebe', '435A', '#f5ef98', '435B', '#f5ef98',
				'435C', '#f5ef98', '435D', '#f5ef98', '436B', '#f3f7a8', '436C', '#f3f7a8',
				'436D', '#f3f7a8', '483C', '#f2f196', '483D', '#f2f196', '484C', '#f2e796',
				'484D', '#f2e796', '493D', '#b5b18f', '14A', '#6A8195', '269A', '#d1c877',
				'665', '#e3e1cc', '602', '#45443f', '21A', '#355D7E', '1', '#378df0',
				'607', '#2872bd', '608', '#76ace3', '53A', '#323538', '260A', '#323538',
				'431D', '#787437',
				/* other */ '#273613'
			],
		},
	});

	map.addLayer({
		'id': 'soils-labels',
		'type': 'symbol',
		'source': 'soils',
		'source-layer': '2026_soils_SE-3a559s',
		'layout': {
			'text-field': ['get', 'MUSYM'],
			'text-size': 9,
			'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
			'text-anchor': 'center',
			'text-allow-overlap': true,
			'visibility': 'none'
		},
		'paint': {
			'text-color': '#000000',
			'text-halo-color': '#FFFFFF',
			'text-halo-width': 1
		}
	});

	map.addLayer({
		'id': 'soils-outline',
		'type': 'line',
		'source': 'soils',
		'source-layer': '2026_soils_SE-3a559s',
		'layout': {
			'visibility': 'none'
		},
		'paint': {
			'line-color': '#7f5702',
			'line-width': 0.1
		}
	});

	map.on('click', 'soils', function(e) {
		new mapboxgl.Popup()
			.setLngLat(e.lngLat)
			.setHTML("Numeric State Legend: " + '<strong>' + e.features[0].properties.MUSYM + '</strong><br>' + 
					"Published Map Unit: " + '<strong>' + e.features[0].properties.MUS_TXT + '</strong><br>' + 
					'<strong>' + e.features[0].properties.MUS_DESC + '</strong><br>')
			.addTo(map);
	});

	map.on('mouseenter', 'soils', function() {
		map.getCanvas().style.cursor = 'pointer';
	});

	map.on('mouseleave', 'soils', function() {
		map.getCanvas().style.cursor = '';
	});
	
	// add soils NE
		map.addSource('soils NE', {
		type: 'vector',
		url: 'mapbox://ese-toh.51iym262'
	});

	// add layer for soils
	map.addLayer({
		'id': 'soils NE',
		'type': 'fill',
		'source': 'soils NE',
		'source-layer': '2026_soils_NE-4uf0vq',
		'layout': {
			'visibility': 'none'
		},
		'paint': {
			'fill-opacity': [
				'match',
				['get', 'SLOPE'],
				'0', 0.6, 'A', 0.45, 'B', 0.50, 'C', 0.55, 'D', 0.60,
				/* other */ 0.04
			],
			'fill-color': [
				'match',
				['get', 'MUSYM'],
				'258A', '#C88F0D', '430B', '#EAE23B', '430C', '#FFE60A', '431B', '#EBEE1E',
				'431C', '#EBEE1E', '432D', '#EBEE1E', '485C', '#EEF108', '488C', '#E4E65A',
				'489C', '#E4E65A', '490C', '#E4E65A', '494C', '#E4E65A', '610', '#EEEF89',
				'225B', '#BC8A26', '11A', '#444F61', '220A', '#BA7E06', '220B', '#BA7E06',
				'259A', '#F6EE2E', '259B', '#F6EE2E', '252A', '#F5E663', '252B', '#F5E663',
				'252C', '#F5E663', '252D', '#F5E663', '263B', '#f5b73b', '263C', '#f5b73b',
				'263D', '#f5b73b', '256A', '#edd768', '652', '#8c8a80', '611', '#fdff99',
				'264A', '#f0f26f', '264B', '#f0f26f', '264C', '#f0f26f', '264D', '#f0f26f',
				'265A', '#dee046', '265B', '#dee046', '265C', '#dee046', '52A', '#272D4B',
				'54A', '#211F56', '55A', '#5F5E6D', '253A', '#e3dc81', '253B', '#e3dc81',
				'242C', '#e3dc81', '242D', '#e3dc81', '226A', '#9e951c', '226B', '#9e951c',
				'226C', '#9e951c', '612C', '#c9c973', '612D', '#c9c973', '613C', '#e0e094',
				'66A', '#484679', '12A', '#131230', '13A', '#524670', '254A', '#c2b91d',
				'254B', '#c2b91d', '254C', '#c2b91d', '254D', '#c2b91d', '245A', '#c2b91d',
				'245B', '#c2b91d', '245C', '#c2b91d', '245D', '#c2b91d', '299', '#f2e6a7',
				'299A', '#f2e6a7', '299B', '#f2e6a7', '299C', '#f2e6a7', '299D', '#f2e6a7',
				'380B', '#807c69', '380C', '#807c69', '381B', '#6e6d67', '381C', '#6e6d67',
				'38A', '#412D70', '600', '#d1cebe', '435A', '#f5ef98', '435B', '#f5ef98',
				'435C', '#f5ef98', '435D', '#f5ef98', '436B', '#f3f7a8', '436C', '#f3f7a8',
				'436D', '#f3f7a8', '483C', '#f2f196', '483D', '#f2f196', '484C', '#f2e796',
				'484D', '#f2e796', '493D', '#b5b18f', '14A', '#6A8195', '269A', '#d1c877',
				'665', '#e3e1cc', '602', '#45443f', '21A', '#355D7E', '1', '#378df0',
				'607', '#2872bd', '608', '#76ace3', '53A', '#323538', '260A', '#323538',
				'431D', '#787437',
				/* other */ '#273613'
			],
		},
	});

	map.addLayer({
		'id': 'soils-labels NE',
		'type': 'symbol',
		'source': 'soils NE',
		'source-layer': '2026_soils_NE-4uf0vq',
		'layout': {
			'text-field': ['get', 'MUSYM'],
			'text-size': 9,
			'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
			'text-anchor': 'center',
			'text-allow-overlap': true,
			'visibility': 'none'
		},
		'paint': {
			'text-color': '#000000',
			'text-halo-color': '#FFFFFF',
			'text-halo-width': 1
		}
	});

	map.addLayer({
		'id': 'soils-outline NE',
		'type': 'line',
		'source': 'soils NE',
		'source-layer': '2026_soils_NE-4uf0vq',
		'layout': {
			'visibility': 'none'
		},
		'paint': {
			'line-color': '#7f5702',
			'line-width': 0.1
		}
	});

	map.on('click', 'soils NE', function(e) {
		new mapboxgl.Popup()
			.setLngLat(e.lngLat)
			.setHTML("Numeric State Legend: " + '<strong>' + e.features[0].properties.MUSYM + '</strong><br>' + 
					"Published Map Unit: " + '<strong>' + e.features[0].properties.MUS_TXT + '</strong><br>' + 
					'<strong>' + e.features[0].properties.MUS_DESC + '</strong><br>')
			.addTo(map);
	});

	map.on('mouseenter', 'soils NE', function() {
		map.getCanvas().style.cursor = 'pointer';
	});

	map.on('mouseleave', 'soils NE', function() {
		map.getCanvas().style.cursor = '';
	});
	
		// add soils WEST
		map.addSource('soils WEST', {
		type: 'vector',
		url: 'mapbox://ese-toh.2ez8y0zc'
	});

	// add layer for soils
	map.addLayer({
		'id': 'soils WEST',
		'type': 'fill',
		'source': 'soils WEST',
		'source-layer': '2026_soils_WEST-9jt2pt',
		'layout': {
			'visibility': 'none'
		},
		'paint': {
			'fill-opacity': [
				'match',
				['get', 'SLOPE'],
				'0', 0.6, 'A', 0.45, 'B', 0.50, 'C', 0.55, 'D', 0.60,
				/* other */ 0.04
			],
			'fill-color': [
				'match',
				['get', 'MUSYM'],
				'258A', '#C88F0D', '430B', '#EAE23B', '430C', '#FFE60A', '431B', '#EBEE1E',
				'431C', '#EBEE1E', '432D', '#EBEE1E', '485C', '#EEF108', '488C', '#E4E65A',
				'489C', '#E4E65A', '490C', '#E4E65A', '494C', '#E4E65A', '610', '#EEEF89',
				'225B', '#BC8A26', '11A', '#444F61', '220A', '#BA7E06', '220B', '#BA7E06',
				'259A', '#F6EE2E', '259B', '#F6EE2E', '252A', '#F5E663', '252B', '#F5E663',
				'252C', '#F5E663', '252D', '#F5E663', '263B', '#f5b73b', '263C', '#f5b73b',
				'263D', '#f5b73b', '256A', '#edd768', '652', '#8c8a80', '611', '#fdff99',
				'264A', '#f0f26f', '264B', '#f0f26f', '264C', '#f0f26f', '264D', '#f0f26f',
				'265A', '#dee046', '265B', '#dee046', '265C', '#dee046', '52A', '#272D4B',
				'54A', '#211F56', '55A', '#5F5E6D', '253A', '#e3dc81', '253B', '#e3dc81',
				'242C', '#e3dc81', '242D', '#e3dc81', '226A', '#9e951c', '226B', '#9e951c',
				'226C', '#9e951c', '612C', '#c9c973', '612D', '#c9c973', '613C', '#e0e094',
				'66A', '#484679', '12A', '#131230', '13A', '#524670', '254A', '#c2b91d',
				'254B', '#c2b91d', '254C', '#c2b91d', '254D', '#c2b91d', '245A', '#c2b91d',
				'245B', '#c2b91d', '245C', '#c2b91d', '245D', '#c2b91d', '299', '#f2e6a7',
				'299A', '#f2e6a7', '299B', '#f2e6a7', '299C', '#f2e6a7', '299D', '#f2e6a7',
				'380B', '#807c69', '380C', '#807c69', '381B', '#6e6d67', '381C', '#6e6d67',
				'38A', '#412D70', '600', '#d1cebe', '435A', '#f5ef98', '435B', '#f5ef98',
				'435C', '#f5ef98', '435D', '#f5ef98', '436B', '#f3f7a8', '436C', '#f3f7a8',
				'436D', '#f3f7a8', '483C', '#f2f196', '483D', '#f2f196', '484C', '#f2e796',
				'484D', '#f2e796', '493D', '#b5b18f', '14A', '#6A8195', '269A', '#d1c877',
				'665', '#e3e1cc', '602', '#45443f', '21A', '#355D7E', '1', '#378df0',
				'607', '#2872bd', '608', '#76ace3', '53A', '#323538', '260A', '#323538',
				'431D', '#787437',
				/* other */ '#273613'
			],
		},
	});

	map.addLayer({
		'id': 'soils-labels WEST',
		'type': 'symbol',
		'source': 'soils WEST',
		'source-layer': '2026_soils_WEST-9jt2pt',
		'layout': {
			'text-field': ['get', 'MUSYM'],
			'text-size': 9,
			'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
			'text-anchor': 'center',
			'text-allow-overlap': true,
			'visibility': 'none'
		},
		'paint': {
			'text-color': '#000000',
			'text-halo-color': '#FFFFFF',
			'text-halo-width': 1
		}
	});

	map.addLayer({
		'id': 'soils-outline WEST',
		'type': 'line',
		'source': 'soils WEST',
		'source-layer': '2026_soils_WEST-9jt2pt',
		'layout': {
			'visibility': 'none'
		},
		'paint': {
			'line-color': '#7f5702',
			'line-width': 0.1
		}
	});

	map.on('click', 'soils WEST', function(e) {
		new mapboxgl.Popup()
			.setLngLat(e.lngLat)
			.setHTML("Numeric State Legend: " + '<strong>' + e.features[0].properties.MUSYM + '</strong><br>' + 
					"Published Map Unit: " + '<strong>' + e.features[0].properties.MUS_TXT + '</strong><br>' + 
					'<strong>' + e.features[0].properties.MUS_DESC + '</strong><br>')
			.addTo(map);
	});

	map.on('mouseenter', 'soils WEST', function() {
		map.getCanvas().style.cursor = 'pointer';
	});

	map.on('mouseleave', 'soils WEST', function() {
		map.getCanvas().style.cursor = '';
	});
	
	
			// add soils CEN
		map.addSource('soils CEN', {
		type: 'vector',
		url: 'mapbox://ese-toh.ds5w50zm'
	});

	// add layer for soils
	map.addLayer({
		'id': 'soils CEN',
		'type': 'fill',
		'source': 'soils CEN',
		'source-layer': '2026_soils_CEN-9ofdpw',
		'layout': {
			'visibility': 'none'
		},
		'paint': {
			'fill-opacity': [
				'match',
				['get', 'SLOPE'],
				'0', 0.6, 'A', 0.45, 'B', 0.50, 'C', 0.55, 'D', 0.60,
				/* other */ 0.04
			],
			'fill-color': [
				'match',
				['get', 'MUSYM'],
				'258A', '#C88F0D', '430B', '#EAE23B', '430C', '#FFE60A', '431B', '#EBEE1E',
				'431C', '#EBEE1E', '432D', '#EBEE1E', '485C', '#EEF108', '488C', '#E4E65A',
				'489C', '#E4E65A', '490C', '#E4E65A', '494C', '#E4E65A', '610', '#EEEF89',
				'225B', '#BC8A26', '11A', '#444F61', '220A', '#BA7E06', '220B', '#BA7E06',
				'259A', '#F6EE2E', '259B', '#F6EE2E', '252A', '#F5E663', '252B', '#F5E663',
				'252C', '#F5E663', '252D', '#F5E663', '263B', '#f5b73b', '263C', '#f5b73b',
				'263D', '#f5b73b', '256A', '#edd768', '652', '#8c8a80', '611', '#fdff99',
				'264A', '#f0f26f', '264B', '#f0f26f', '264C', '#f0f26f', '264D', '#f0f26f',
				'265A', '#dee046', '265B', '#dee046', '265C', '#dee046', '52A', '#272D4B',
				'54A', '#211F56', '55A', '#5F5E6D', '253A', '#e3dc81', '253B', '#e3dc81',
				'242C', '#e3dc81', '242D', '#e3dc81', '226A', '#9e951c', '226B', '#9e951c',
				'226C', '#9e951c', '612C', '#c9c973', '612D', '#c9c973', '613C', '#e0e094',
				'66A', '#484679', '12A', '#131230', '13A', '#524670', '254A', '#c2b91d',
				'254B', '#c2b91d', '254C', '#c2b91d', '254D', '#c2b91d', '245A', '#c2b91d',
				'245B', '#c2b91d', '245C', '#c2b91d', '245D', '#c2b91d', '299', '#f2e6a7',
				'299A', '#f2e6a7', '299B', '#f2e6a7', '299C', '#f2e6a7', '299D', '#f2e6a7',
				'380B', '#807c69', '380C', '#807c69', '381B', '#6e6d67', '381C', '#6e6d67',
				'38A', '#412D70', '600', '#d1cebe', '435A', '#f5ef98', '435B', '#f5ef98',
				'435C', '#f5ef98', '435D', '#f5ef98', '436B', '#f3f7a8', '436C', '#f3f7a8',
				'436D', '#f3f7a8', '483C', '#f2f196', '483D', '#f2f196', '484C', '#f2e796',
				'484D', '#f2e796', '493D', '#b5b18f', '14A', '#6A8195', '269A', '#d1c877',
				'665', '#e3e1cc', '602', '#45443f', '21A', '#355D7E', '1', '#378df0',
				'607', '#2872bd', '608', '#76ace3', '53A', '#323538', '260A', '#323538',
				'431D', '#787437',
				/* other */ '#273613'
			],
		},
	});

	map.addLayer({
		'id': 'soils-labels CEN',
		'type': 'symbol',
		'source': 'soils CEN',
		'source-layer': '2026_soils_CEN-9ofdpw',
		'layout': {
			'text-field': ['get', 'MUSYM'],
			'text-size': 9,
			'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
			'text-anchor': 'center',
			'text-allow-overlap': true,
			'visibility': 'none'
		},
		'paint': {
			'text-color': '#000000',
			'text-halo-color': '#FFFFFF',
			'text-halo-width': 1
		}
	});

	map.addLayer({
		'id': 'soils-outline CEN',
		'type': 'line',
		'source': 'soils CEN',
		'source-layer': '2026_soils_CEN-9ofdpw',
		'layout': {
			'visibility': 'none'
		},
		'paint': {
			'line-color': '#7f5702',
			'line-width': 0.1
		}
	});

	map.on('click', 'soils CEN', function(e) {
		new mapboxgl.Popup()
			.setLngLat(e.lngLat)
			.setHTML("Numeric State Legend: " + '<strong>' + e.features[0].properties.MUSYM + '</strong><br>' + 
					"Published Map Unit: " + '<strong>' + e.features[0].properties.MUS_TXT + '</strong><br>' + 
					'<strong>' + e.features[0].properties.MUS_DESC + '</strong><br>')
			.addTo(map);
	});

	map.on('mouseenter', 'soils CEN', function() {
		map.getCanvas().style.cursor = 'pointer';
	});

	map.on('mouseleave', 'soils CEN', function() {
		map.getCanvas().style.cursor = '';
	});
	
}

addSoilsLayer();