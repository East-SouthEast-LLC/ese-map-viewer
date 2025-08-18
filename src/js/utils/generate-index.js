const fs = require('fs');
const path = require('path');
let imageSize = require('image-size');

if (imageSize.default) {
    imageSize = imageSize.default;
}

const directoryPath = '.';
const allFiles = fs.readdirSync(directoryPath);
const jgwFiles = allFiles.filter(file => file.endsWith('.jgw'));

const tileData = jgwFiles.map(file => {
    const jgwContent = fs.readFileSync(path.join(directoryPath, file), 'utf8');
    const jgwValues = jgwContent.trim().split(/\s+/).map(parseFloat);

    const jpgPath = path.join(directoryPath, file.replace('.jgw', '.jpg'));

    // --- FINAL FIX ---
    // First, read the image file into a buffer.
    const imageBuffer = fs.readFileSync(jpgPath);
    // Then, pass the buffer directly to the image-size function.
    const dimensions = imageSize(imageBuffer);

    return {
        name: file.replace('.jgw', ''),
        jgw: jgwValues,
        width: dimensions.width,
        height: dimensions.height
    };
});

fs.writeFileSync('usgs_tiles.json', JSON.stringify(tileData, null, 2));