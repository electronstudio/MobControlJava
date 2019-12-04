/**
 * CanvasImage
 *
 * Given a HTML Canvas element, provides utilities to derive
 * properties and read pixels drawn on the Canvas.
 */

//
// Utility to derive bounding box of a single colour.
//
function getRgbaBoundingBox(rgba, allPixels, width) {
	let minX, minY, maxX, maxY = undefined;

	for (var i=0; i<allPixels.length; i+=4) {
		const pixelIndex = i / 4;
		const pixelX = pixelIndex % width;
		const pixelY = Math.floor(pixelIndex / width);

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

function CanvasImage(canvasElement, image) {
	this.canvasElement = canvasElement;
	this.image = image;
	this.context = canvasElement.getContext('2d');
}

CanvasImage.prototype.getSize = function() {
	return {
		w: this.canvasElement.scrollWidth,
		h: this.canvasElement.scrollHeight,
	};
}

CanvasImage.prototype.drawImage = function(image) {
	const size = this.getSize();
	this.context.drawImage(this.image, 0, 0, size.w, size.h);
}

CanvasImage.prototype.getPixels = function(x, y, w, h) {
	const size = this.getSize();
	return this.context.getImageData(x || 0, y || 0, w || size.w, h || size.h).data;
}

CanvasImage.prototype.getRgbaBoundingBox = function(rgba) {
	return getRgbaBoundingBox(rgba, this.getPixels(), this.getSize().w);
}
