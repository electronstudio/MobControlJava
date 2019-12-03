//
// Utility to derive bounding box of a single colour.
//

function getHitboxRgbaBoundingBox(rgba, allPixels) {
    const hitboxSize = getHitboxSize();

    let minX, minY, maxX, maxY = undefined;

    for (var i=0; i<allPixels.length; i+=4) {
        const pixelIndex = i / 4;
        const pixelX = pixelIndex % hitboxSize.w;
        const pixelY = Math.floor(pixelIndex / hitboxSize.w);

        const colourMatches = true
            && rgba[0] === allPixels[i+0]
            && rgba[1] === allPixels[i+1]
            && rgba[2] === allPixels[i+2]
            && rgba[3] === allPixels[i+3];

        if (colourMatches) {
            if (minX === undefined || pixelX < minX) { minX = pixelX; }
            if (maxX === undefined || pixelX > maxX) { maxX = pixelX; }
            if (minY === undefined || pixelY < minY) { minY = pixelY; }
            if (maxY === undefined || pixelY > maxY) { maxY = pixelY; }
        }
    }

    return [minX, minY, maxX - minX, maxY - minY];
}
