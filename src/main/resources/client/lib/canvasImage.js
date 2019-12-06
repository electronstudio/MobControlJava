/**
 * CanvasImage
 *
 * Given a HTML Canvas element, provides utilities to derive
 * properties and read pixels drawn on the Canvas.
 */

//
// Utility to derive bounding box of a single colour.
//
function getRgbasBoundingBoxInternal(rgbas, allPixels, width) {
	let minX;
	let minY;
	let maxX;
	let maxY;

	for (let i = 0; i < allPixels.length; i += 4) {
		const pixelIndex = i / 4;
		const pixelX = pixelIndex % width;
		const pixelY = Math.floor(pixelIndex / width);

		let colourMatches = false;

		rgbas.forEach((rgba) => {
			const match = true
				&& rgba[0] === allPixels[i + 0]
				&& rgba[1] === allPixels[i + 1]
				&& rgba[2] === allPixels[i + 2]
				&& rgba[3] === allPixels[i + 3];

			if (match) {
				colourMatches = true;
			}
		});

		if (colourMatches) {
			if (minX === undefined || pixelX < minX) { minX = pixelX; }
			if (maxX === undefined || pixelX > maxX) { maxX = pixelX; }
			if (minY === undefined || pixelY < minY) { minY = pixelY; }
			if (maxY === undefined || pixelY > maxY) { maxY = pixelY; }
		}
	}

	return [minX, minY, maxX - minX, maxY - minY];
}

export default function CanvasImage(canvasElement, image) {
	this.canvasElement = canvasElement;
	this.image = image;
	this.context = canvasElement.getContext('2d');
}

CanvasImage.prototype.getSize = function getSize() {
	return {
		w: this.canvasElement.scrollWidth,
		h: this.canvasElement.scrollHeight,
	};
};

CanvasImage.prototype.alignWithElement = function alignWithElement(element) {
	this.canvasElement.width = element.scrollWidth;
	this.canvasElement.height = element.scrollHeight;
};

CanvasImage.prototype.drawImage = function drawImage() {
	if (!this.image) { return; }
	const size = this.getSize();
	this.context.drawImage(this.image, 0, 0, size.w, size.h);
};

CanvasImage.prototype.getPixels = function getPixels(x, y, w, h) {
	const size = this.getSize();
	return this.context.getImageData(x || 0, y || 0, w || size.w, h || size.h).data;
};

CanvasImage.prototype.getRgbasBoundingBox = function getRgbasBoundingBox(rgbas) {
	return getRgbasBoundingBoxInternal(rgbas, this.getPixels(), this.getSize().w);
};

CanvasImage.prototype.clear = function clear() {
	const size = this.getSize();
	this.context.clearRect(0, 0, size.w, size.h);
};

CanvasImage.prototype.drawBoundingBox = function drawBoundingBox(boundingBox, lineWidth, fillStyle, strokeStyle) {
	this.context.strokeStyle = 'yellow';
	this.context.lineWidth = lineWidth;
	this.context.fillStyle = fillStyle;
	this.context.strokeStyle = strokeStyle;
	this.context.strokeRect(...boundingBox);
};

CanvasImage.prototype.drawCircle = function drawCircle(x, y, r, lineWidth, fillStyle, strokeStyle) {
	this.context.beginPath();
	this.context.arc(x, y, r, 0, 2 * Math.PI, false);
	this.context.fillStyle = fillStyle;
	this.context.fill();
	this.context.lineWidth = lineWidth;
	this.context.strokeStyle = strokeStyle;
	this.context.stroke();
};

CanvasImage.prototype.drawLine = function drawLine(x1, y1, x2, y2, lineWidth, fillStyle, strokeStyle) {
	this.context.fillStyle = fillStyle;
	this.context.strokeStyle = strokeStyle;
	this.context.lineWidth = lineWidth;
	this.context.beginPath();
	this.context.moveTo(x1, y1);
	this.context.lineTo(x2, y2);
	this.context.stroke();
};
