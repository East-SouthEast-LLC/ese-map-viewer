# East-South-East, LLC Interactive Map Viewer

## 1. Project Overview

The East-South-East (ESE) Map Viewer is a professional-grade, interactive web mapping application designed to provide clients and staff with clear, visual access to a rich set of GIS data for various towns, with a primary focus on Chatham and Barnstable, MA.

The application is built with a dynamic, modular architecture designed to be embedded within a Squarespace website. Its core assets (JavaScript, CSS, and data files) are hosted on a GitHub repository and served via GitHub Pages. This hybrid hosting model allows for easy updates to the application's functionality by simply pushing changes to the GitHub repository, while leveraging Squarespace's content management system for page creation and hosting of large file assets.

Its primary goal is to centralize crucial property and environmental data, offering powerful interactive tools (such as dynamic layer toggling, an address search, measurement tools, and bookmarking) and generating professional, multi-page printouts for reports and analysis.

---

## 2. Key Technologies

* **Mapping Library:** Mapbox GL JS
* **Hosting:**
    * **Frontend Page:** Squarespace (via embedded code blocks).
    * **Asset Hosting:** GitHub Pages for scripts and configuration; Squarespace for large file assets (e.g., panoramas, map tiles).
* **Core Languages:** HTML, CSS, JavaScript
* **Key Libraries:**
    * **Pannellum:** Used for rendering and displaying 360-degree panoramas.
    * **proj4js:** For on-the-fly coordinate system conversions.
    * **Turf.js:** Used for geospatial calculations.
    * **Mapbox GL Geocoder:** Powers the address search functionality.

---

## 3. System Architecture

The project's architecture is designed for scalability and ease of maintenance, separating the core application logic from the town-specific data configurations.

### 3.1. High-Level Flow

1.  A user navigates to a town-specific page on the `ese-llc.com` Squarespace site.
2.  The Squarespace page contains a **Code Block** with the contents of `src/pages/town-template.html`.
3.  A `data-town-id` attribute in the script tag tells the main application which town to display.
4.  The `src/js/main.js` script, hosted on GitHub Pages, is loaded.
5.  `main.js` fetches two configuration files: `assets/data/town_config.json` and `assets/data/layer_config.json`.
6.  It uses the `townId` to find the correct town profile in `town_config.json`, which specifies the map center, zoom, and a list of layer IDs to load.
7.  It then filters `layer_config.json` to get the full configuration for each required layer.
8.  Based on the `scriptName` in each layer's config, it dynamically loads all necessary JavaScript files for layers and controls.
9.  Once all scripts are loaded, the map is initialized, layers are added, and the UI (menus and toolkits) is rendered.

### 3.2. File Structure Breakdown

* **`/src/pages/town-template.html`**: The universal HTML template. This is the only file that needs to be manually placed into Squarespace. Its primary responsibility is to load the core application script.
* **`/src/pages/pano-viewer.html`**: A dedicated HTML page, embedded in a Squarespace Code Block, that serves as the 360-degree panorama viewer.
* **`/src/js/main.js`**: The central controller of the application. It orchestrates the entire map initialization process.
* **`/assets/data/town_config.json`**: This file defines which layers and map settings are used for each town.
* **`/assets/data/layer_config.json`**: The "brain" of the application. This central file contains a detailed object for each layer, specifying its ID, display name, script file, draw order, dependencies, and configurations for popups, identify behavior, and the legend.
* **`/src/js/layers/`**: This directory contains individual, lightweight JavaScript files for each map layer. They now primarily contain the `map.addSource` and `map.addLayer` logic, with most styling and behavior defined in `layer_config.json`.
* **`/src/js/components/`**: This directory contains the logic for all UI components. Each component is self-contained.
    * `/control/`: Contains scripts for individual toolkit buttons (e.g., `marker.js`, `print.js`, `measure.js`).
    * `/panorama-viewer.js`: Contains all logic for displaying and interacting with 360-degree panoramas.
    * Other files handle the toggleable menu, popups, and the disclaimer.
* **`/src/js/utils/`**: This directory holds reusable helper functions.
    * `/map-helpers.js`: Contains general utility functions that interact with the map, such as `listVisibleLayers`.
* **`/assets/data/pano_correction_data.json`**: This file contains the georeferencing data (position and orientation) for each panorama image.
* **`/src/css/globals.css`**: The single, comprehensive stylesheet for the entire application, including print-specific styles.

---

## 4. Special Features

### Skeleton Loading Screen
To improve the user's perception of performance, the application displays a skeleton screen while the main map and data are initializing.

* **Purpose**: This provides an immediate visual feedback that the page is loading, showing a simplified, animated placeholder of the final application layout.
* **How It Works**:
    1.  A script in the `<head>` (`skeleton.js`) immediately adds an `is-loading` class to the `<body>`.
    2.  CSS rules in `globals.css` use this class to hide the real application elements and show a pre-defined skeleton layout.
    3.  The skeleton's CSS is designed to sit below the main Squarespace header and mimics the layout of the ad container, layer menu, and map. A shimmer animation indicates activity.
    4.  Once `main.js` has fully initialized the map and all its components, it waits for Mapbox's `idle` event (signaling the first complete render).
    5.  It then calls the global `hideSkeleton()` function, which fades out the skeleton and removes the `is-loading` class, revealing the fully interactive map.
* **Key Files**: `src/js/components/skeleton.js`, `src/pages/town-template.html` (for the skeleton HTML and initial body class), `src/css/globals.css` (for all styling), and `src/js/main.js` (to trigger the hide function).

### Panorama Viewer

The application supports viewing 360-degree panoramic images directly on the map. The logic for this feature is now fully encapsulated in its own component for better modularity.
* **Component-Based Logic**: The panorama viewer is a self-contained component located at `src/js/components/panorama-viewer.js`. This script handles all aspects of the panorama feature, including fetching location data, creating the modal viewer, and correcting camera orientation.
* **Initialization**: The main application controller, `main.js`, loads the panorama component and calls the `initializePanoramaViewer()` function. This function attaches the necessary `click` event listener to the panorama layer, activating the feature on the map.
* **Cross-Domain Solution**: To avoid CORS issues, the viewer opens an `iframe` that loads a dedicated page (`/pano-viewer`), ensuring both the viewer and the images are on the same domain.
* **Orientation Correction**: The `pano-viewer.html` page script fetches camera orientation data from `pano_correction_data.json` to apply pitch and roll corrections, ensuring the panoramas are displayed correctly without tilting.

### Dynamic USGS Tile Loader

The "USGS Quad" layer is not a single data source but a collection of individual JPG tiles. The `usgs-tile-manager.js` script provides a high-performance solution for displaying this large dataset by only loading what is necessary for the current view.
1.  **Index Fetch**: On first activation, the manager fetches a central index file (`usgs_tiles.json`) which contains the georeferencing data for every available map tile.
2.  **Viewport Culling**: It listens for map `moveend` and `zoomend` events. On each event, it calculates the map's current bounding box and determines which map tiles intersect with the user's view.
3.  **Dynamic Loading/Unloading**: It dynamically adds only the necessary tile sources and layers to the map. Tiles that move out of view are removed to conserve browser memory and maintain performance.
4.  **Zoom Restriction**: The entire feature is automatically disabled at zoom levels less than 12 to prevent performance degradation when viewing a large area.

### Custom Multi-Page Printing

The "Custom Print" feature allows users to generate professional, multi-page PDF reports based on pre-defined layer combinations, ensuring consistency and high quality for client deliverables.

* **Presets**: The `custom-print.js` file contains a `printPresets` object where different report types (e.g., "Conservation", "Test Hole") are defined. Each preset contains a specific list of layers to be rendered on each page.
* **Dynamic Legend**: The legend on each printed page is generated by the `getLegendForPrint` function. This function intelligently queries the features visible within the map's print area and only includes legend items for data that is actually present on that specific page.
* **State Management**: The print function carefully manages the map's state. For complex, dynamically-loaded layers like the USGS quads, it de-initializes the tile manager before printing other pages and re-initializes it for the USGS page. It uses an asynchronous `await` to ensure all tiles are fully rendered before capturing the map image, preventing blank maps in the printout.

---

## 5. Developer Workflows

### How to Add a New Town

1.  **Add Configuration**: Open `assets/data/town_config.json` and add a new JSON object for the town. Copy the structure from an existing town and update the `townID`, `townName`, `map` settings, and the list of `layers` you want to be available.
2.  **Create Squarespace Page**: Create a new page on the Squarespace site.
3.  **Embed Code**: Add a Code Block, paste in the content from `src/pages/town-template.html`, and set the `data-town-id` attribute in the script tag to match the new `townID`.

### How to Add a New Layer

The application is designed to be highly modular, with all layer configurations managed centrally in the `assets/data/layer_config.json` file. Adding a new layer involves creating a simple script to draw it on the map and then defining all of its properties and behaviors in the central configuration file.

#### Example A: Adding a Simple Layer (e.g., "Parks")

This example shows how to add a single, simple layer that shows park areas as green polygons.

**Step 1: Prepare Your Geospatial Data**

First, your geographic data needs to be hosted on Mapbox.

1.  Upload your data (e.g., GeoJSON, Shapefile) to your Mapbox account.
2.  Create a new **Tileset** from your uploaded data.
3.  Once the tileset is created, click on it and copy the **Tileset ID** (e.g., `your-account.random-string`) and the **Source Layer Name** (e.g., `parks-data-layer`).

**Step 2: Create the Layer's JavaScript File**

In the `/src/js/layers/` directory, create a new file named `parks.js`. This file will contain the basic logic to add the layer to the map.

**`src/js/layers/parks.js`:**
```javascript
// src/js/layers/parks.js

function addParksLayer() {
    // add the mapbox source using your unique tileset id
    map.addSource('parks', {
        type: 'vector',
        url: 'mapbox://your-account.random-string' // <-- paste your tileset id here
    });

    // add the layer, linking it to the source
    map.addLayer({
        'id': 'parks', // this must match the 'id' in layer_config.json
        'type': 'fill',
        'source': 'parks',
        'source-layer': 'parks-data-layer', // <-- use the source layer name from mapbox
        'layout': {
            'visibility': 'none' // layers should always be hidden by default
        },
        'paint': {
            'fill-color': '#90ee90', // light green
            'fill-opacity': 0.5
        }
    });

    // these listeners change the mouse to a pointer on hover if the layer has a popup
    map.on('mouseenter', 'parks', function () {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'parks', function () {
        map.getCanvas().style.cursor = '';
    });
}

// call the function to add the layer
addParksLayer();
```

**Step 3: Configure the Layer in `layer_config.json`**

Open `/assets/data/layer_config.json` and add a new JSON object for your "Parks" layer.

```json
  {
    "id": "parks",
    "displayName": "Parks & Rec",
    "scriptName": "parks.js",
    "drawOrder": 38,
    "dependencies": [],
    "popupConfig": {
      "template": "<strong>Park Name:</strong> {PARK_NAME}"
    },
     "identifyConfig": {
        "template": "<strong>Park:</strong> {PARK_NAME}"
    },
    "legendConfig": {
        "displayName": "Parks & Recreation",
        "sources": [{ "id": "parks" }],
        "items": [
            { "label": "Park Area", "color": "#90ee90", "opacity": 0.5, "isLine": false }
        ]
    }
  }
```

**Step 4: Add the Layer to a Town**

Finally, open `/assets/data/town_config.json` and add the new layer's `id` ("parks") to the `layers` array for any towns that should have it.

---

#### Example B: Adding a Layer with Dependencies (e.g., "Waterways")

This example shows how to add a layer that has multiple parts: a blue line for the waterways and text labels that appear on top. The labels are a "dependency" that will be toggled on and off with the main layer.

**Step 1: Prepare Your Data**

This process is the same as the simple layer. Upload your waterway data to Mapbox and get the **Tileset ID** and **Source Layer Name**.

**Step 2: Create the Layer's JavaScript File**

In `/src/js/layers/`, create a new file named `waterways.js`. This file will add **both** the line layer and the symbol (label) layer.

**`src/js/layers/waterways.js`:**
```javascript
// src/js/layers/waterways.js

function addWaterwaysLayer() {
    // first, add the source, which will be shared by both layers
    map.addSource('waterways', {
        type: 'vector',
        url: 'mapbox://your-account.waterway-tileset' // <-- your tileset id
    });

    // next, add the main line layer for the waterways
    map.addLayer({
        'id': 'waterways', // the id for the main line layer
        'type': 'line',
        'source': 'waterways',
        'source-layer': 'waterways-data-layer', // your source layer name
        'layout': { 'visibility': 'none' },
        'paint': {
            'line-color': '#0077be', // a nice blue color
            'line-width': 2
        }
    });

    // now, add the dependent layer for the labels
    map.addLayer({
        'id': 'waterways-labels', // a unique id for the labels layer
        'type': 'symbol',
        'source': 'waterways', // uses the same source
        'source-layer': 'waterways-data-layer',
        'layout': {
            'visibility': 'none', // also hidden by default
            'symbol-placement': 'line',
            'text-field': ['get', 'STREAM_NAME'], // the property from your data to use as a label
            'text-size': 12
        },
        'paint': {
            'text-color': '#00558e',
            'text-halo-color': '#ffffff',
            'text-halo-width': 1
        }
    });

    // the mouseenter/mouseleave events should only apply to the main clickable layer
    map.on('mouseenter', 'waterways', function () {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'waterways', function () {
        map.getCanvas().style.cursor = '';
    });
}

addWaterwaysLayer();
```

**Step 3: Configure the Layer in `layer_config.json`**

Open `/assets/data/layer_config.json` and add the configuration for your waterways. The key difference is the `dependencies` array, which now includes the ID of your labels layer.

```json
  {
    "id": "waterways",
    "displayName": "Waterways",
    "scriptName": "waterways.js",
    "drawOrder": 58,
    "dependencies": ["waterways-labels"],
    "popupConfig": {
      "template": "<strong>Waterway:</strong> {STREAM_NAME}"
    },
     "identifyConfig": {
        "template": "<strong>Waterway:</strong> {STREAM_NAME}"
    },
    "legendConfig": {
        "displayName": "Waterways",
        "sources": [{ "id": "waterways" }],
        "items": [
            { "label": "River / Stream", "color": "#0077be", "opacity": 1.0, "isLine": true }
        ]
    }
  }
```

**Step 4: Add the Layer to a Town**

This is the same as before. Open `/assets/data/town_config.json` and add the main layer's `id` ("waterways") to the `layers` array for the desired towns. The application will automatically handle toggling the `waterways-labels` layer whenever the main "Waterways" layer is turned on or off, because you defined it as a dependency.

### How to Add a New Control Component

Adding a new button or interactive tool to the map's toolkit is a straightforward process. The application is designed to be modular, so all the necessary HTML for the toolkit is built dynamically in `main.js`, and each control's logic is kept in its own file.

#### Step 1: Create the JavaScript File for Your Control

First, create a new file for your tool's logic inside the `/src/js/components/control/` directory. For this example, we'll call it `new-control.js`.

Since your script will be loaded dynamically *after* the main HTML is on the page, you can immediately start looking for your button's ID without waiting for a `DOMContentLoaded` event.

Here is a basic template for your new control file. You can copy and paste this to get started:

```javascript
// src/js/components/control/new-control.js

// find the button and its associated panel by their unique ids
const newToolButton = document.getElementById('newToolButton');
const newToolBox = document.getElementById('new-tool-box');

// check to make sure the required elements were found
if (!newToolButton || !newToolBox) {
    console.error("required elements not found for the new tool.");
} else {
    // hide the panel by default
    newToolBox.style.display = 'none';
    let isToolActive = false;

    // add the main click event listener for the button
    newToolButton.addEventListener('click', () => {
        isToolActive = !isToolActive; // toggle the active state

        if (isToolActive) {
            // code to run when the tool is activated
            newToolBox.style.display = 'block';
            newToolBox.innerHTML = `<strong>My New Tool Is Active!</strong>`;
            newToolButton.classList.add('active');
            console.log("new tool activated!");
        } else {
            // code to run when the tool is deactivated
            newToolBox.style.display = 'none';
            newToolButton.classList.remove('active');
            console.log("new tool deactivated.");
        }
    });
}
```

#### Step 2: Add the Control's HTML Markup

All of the HTML for the toolkit is generated inside the `buildToolkit()` function in `/src/js/main.js`. This keeps the main `town-template.html` clean and simple.

Open `src/js/main.js` and find the `geocoderContainer.innerHTML` section. You'll see several placeholder buttons. Replace one of them with the HTML for your new button. Make sure the `id` matches the one you used in your new JavaScript file.

**Before:**
```html
// ... inside buildToolkit() in main.js
<div> 
    <!-- ... other buttons ... -->
    <button class="mapboxgl-ctrl-four" id="fourButton" aria-label="four" data-tooltip="Placeholder"></button>
    <!-- ... other buttons ... -->
</div>
```

**After:**
```html
<!-- ... inside buildToolkit() in main.js -->
<div> 
    <!-- ... other buttons ... -->
    <button class="mapboxgl-ctrl-new-tool" id="newToolButton" aria-label="New Tool" data-tooltip="This is my new tool"></button>
    <!-- ... other buttons ... -->
</div>
```

**After:**
```html
<!-- ... inside buildToolkit() in main.js -->
<div> 
    <!-- ... other buttons ... -->
    <button class="mapboxgl-ctrl-new-tool" id="newToolButton" aria-label="New Tool" data-tooltip="This is my new tool"></button>
    <!-- ... other buttons ... -->
</div>
```
If your tool needs a popup panel, add its `div` container at the bottom of the `innerHTML` string, giving it the `id` you used in your script.

```html
<!-- ... at the end of the innerHTML string in main.js -->
<div id="custom-print-box"></div>
<div id="bookmark-box"></div>
<div id="identify-box"></div>
<div id="new-tool-box"></div> 
```

#### Step 3: Style the New Button and Panel

Open `/src/css/globals.css` to add the necessary styling.

First, add a rule for your button's new class to set its icon. The icon should be a 60% sized image centered on the button.

```css
/* add this to the control button styles section */
.mapboxgl-ctrl-new-tool { 
    background-image: url('path/to/your/new-icon.png'); 
}
```

Next, if you added a panel for your tool, add a style rule for it. You can copy the style of an existing panel like `#scale-box` to ensure it looks consistent.

```css
/* add this to the info display panels section */
#new-tool-box {
  display: none; /* panels should be hidden by default */
  background: white;
  color: #333;
  padding: 10px 15px;
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  margin-top: 5px;
  max-width: 240px;
  width: 100%;
  box-sizing: border-box;
}
```

#### Step 4: Load Your New Script

The final step is to tell the application to load your new script. Open `src/js/main.js` and find the `controlScripts` array. Add the full URL path to your new JavaScript file to this list.

```javascript
// ... inside main.js
const controlScripts = [
    "https://east-southeast-llc.github.io/ese-map-viewer-dev/src/js/components/control/button.js",
    // ... other scripts ...
    "https://east-southeast-llc.github.io/ese-map-viewer-dev/src/js/components/control/bookmarks.js",
    "https://east-southeast-llc.github.io/ese-map-viewer-dev/src/js/components/control/identify.js",
    "https://east-southeast-llc.github.io/ese-map-viewer-dev/src/js/components/control/new-control.js" // <-- add your new script's path here
];
```

#### Step 5: Test Your New Control

With all these pieces in place, your new control is fully integrated. When you load the map, `main.js` will create the button, load your script, and your new tool should be ready to use.

## 6. Git Development Practices

### Git Overview
1. **Version Control**: Git is a version control system that allows multiple people to work on a project simultaneously. It tracks changes to files over time, enabling users to revert to previous versions if needed.
2. **Branching and Merging**: Git encourages using branches to work on new features or bug fixes in isolation. Once work is complete, branches can be merged back into the main codebase. The `main` branch should always contain the working production code.

### ESE Map Viewer Feature Workflow
1.  **Multiple Repositories**: There are two repositories: `ese-map-viewer` for production and `ese-map-viewer-dev` for development. The primary difference is the base URL used for loading scripts, which must be updated when moving code from development to production.
2.  **Cloning Repositories**: Clone both repositories to your local machine:
    ```bash
    git clone https://github.com/east-southeast-llc/ese-map-viewer.git
    git clone https://github.com/east-southeast-llc/ese-map-viewer-dev.git
    ```
3.  **Create a Feature Branch**: In the `ese-map-viewer-dev` repository, create a new branch from the `main` branch to work on your feature:
    ```bash
    git checkout main
    git pull origin main
    git checkout -b your-feature-name
    ```
4.  **Implement Your Feature**: Make your code changes. Commit and push your work regularly to your feature branch on GitHub:
    ```bash
    git add .
    git commit -m "add my new feature" 
    git push origin your-feature-name
    ```
5.  **Test Your Changes**: To test, go to the `ese-map-viewer-dev` repository on GitHub, navigate to `Settings > Pages`, and select your feature branch as the deployment source. After the GitHub Action completes, your changes will be live on the development URL for testing.
6.  **Complete Development**: Once testing is complete, merge your feature branch back into the `main` branch of the `ese-map-viewer-dev` repository.
    ```bash
    git checkout main
    git merge your-feature-name -m "merge feature branch"
    git push origin main
    ```
7.  **Move to Production**:
    * Navigate to your local `ese-map-viewer` repository.
    * Pull the changes from the development repository's `main` branch into your temporary feature branch. This is done in two steps to provide a clear merge message and automatically handle potential conflicts.
        ```bash
        # create a temporary branch to hold dev changes
        git checkout main
        git pull origin main
        git checkout -b your-feature-name main
        
        # step a: fetch the latest code from the dev repository
        git fetch https://github.com/East-SouthEast-LLC/ese-map-viewer-dev.git main

        # step b: merge the fetched code, favoring dev changes for any conflicts
        git merge FETCH_HEAD -X theirs --no-ff -m "merge main from dev repository"
        ```
    * **Crucially**, perform a find-and-replace across all files (except for this README.md) to change all instances of the repository path from `ese-map-viewer-dev` to `ese-map-viewer`.
    * Commit these path changes.
        ```bash
        git add .
        git commit -m "update paths for production"
        git push origin your-feature-name
        ```
    * Merge the updated branch into your production `main` branch and push.
        ```bash
        git checkout main
        git merge --no-ff your-feature-name -m "merge feature branch"
        git push origin main
        ```
    * Finally, update the code blocks on the live Squarespace pages with the new content from `src/pages/town-template.html` if it was changed.
<!-- add note about always doing new updates in the development repo and then you will never have to update the dev repo from the main repo. this will allow you to keep all the console logs you want in the dev server, etc -->
<!-- add note about deleting console.logs from prod code -->