/**
 * CanvasImage
 *
 * Given a HTML Canvas element, provides utilities to derive
 * properties and read pixels drawn on the Canvas.
 */

//
// Utility to derive bounding box of a single colour.
//
function getRgbasBoundingBox(rgbas, allPixels, width) {
	let minX, minY, maxX, maxY = undefined;

	for (var i=0; i<allPixels.length; i+=4) {
		const pixelIndex = i / 4;
		const pixelX = pixelIndex % width;
		const pixelY = Math.floor(pixelIndex / width);

		let colourMatches = false;

		rgbas.forEach(rgba => {
			const match = true
				&& rgba[0] === allPixels[i+0]
				&& rgba[1] === allPixels[i+1]
				&& rgba[2] === allPixels[i+2]
				&& rgba[3] === allPixels[i+3];

			if (match) {
				colourMatches = true;
			}
		})

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

CanvasImage.prototype.alignWithElement = function(element) {
	this.canvasElement.width = element.scrollWidth;
	this.canvasElement.height = element.scrollHeight;
}

CanvasImage.prototype.drawImage = function() {
	if (!this.image) { return; }
	const size = this.getSize();
	this.context.drawImage(this.image, 0, 0, size.w, size.h);
}

CanvasImage.prototype.getPixels = function(x, y, w, h) {
	const size = this.getSize();
	return this.context.getImageData(x || 0, y || 0, w || size.w, h || size.h).data;
}

CanvasImage.prototype.getRgbasBoundingBox = function(rgbas) {
	return getRgbasBoundingBox(rgbas, this.getPixels(), this.getSize().w);
}

CanvasImage.prototype.clear = function() {
	const size = this.getSize();
	this.context.clearRect(0, 0, size.w, size.h);
}

CanvasImage.prototype.drawBoundingBox = function(boundingBox) {
	this.context.strokeStyle = 'yellow';
	this.context.lineWidth = 4;
	this.context.strokeRect(...boundingBox);
}

CanvasImage.prototype.drawCircle = function(x, y, r, fillStyle, strokeStyle) {
	this.context.beginPath();
	this.context.arc(x, y, r, 0, 2 * Math.PI, false);
	this.context.fillStyle = fillStyle;
	this.context.fill();
	this.context.lineWidth = 5;
	this.context.strokeStyle = strokeStyle;
	this.context.stroke();
}

CanvasImage.prototype.drawLine = function(x1, y1, x2, y2) {
	this.context.beginPath();
	this.context.moveTo(x1, y1);
	this.context.lineTo(x2, y2);
	this.context.stroke();
}
