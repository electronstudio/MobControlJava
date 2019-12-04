/**
 * MobControl Client
 *
 * Stores and updates internal representation of a pad based on user interaction.
 * Transmits internal representation to server on regular intervals.
 */

//
// Configuration.
//
const ADDRESS = `${new URL(window.location.href).hostname}/mobcontrol/`;
const UPDATES_PER_SECOND = 60;

//
// Get HTML elements.
//
const canvasGuide = document.getElementById('canvasGuide');

const hitboxCanvas = document.getElementById('hitboxCanvas');
const graphicCanvas = document.getElementById('graphicCanvas');
const overlayCanvas = document.getElementById('overlayCanvas');
const canvases = [hitboxCanvas, graphicCanvas, overlayCanvas];

//
// Load the images.
//
function getImage(imageSrc, onLoad) {
	const image = new Image;
	image.addEventListener('load', onLoad, false);
	image.src = imageSrc;
	return image;
}

const hitboxImage = getImage('./layout_logical.png', redraw);
const graphicImage = getImage('./controller.svg', redraw);

//
// Initialise utilities.
//
const hitboxCanvasImage = new CanvasImage(hitboxCanvas, hitboxImage);
const graphicCanvasImage = new CanvasImage(graphicCanvas, graphicImage);
const canvasImages = [hitboxCanvasImage, graphicCanvasImage];

const padState = new PadState(hitboxCanvasImage);

log(UPDATES_PER_SECOND);

//
// Redraw.
//
function redraw() {
	// Align canvas elements with the canvas guide.
	canvases.forEach(canvas => {
		canvas.width = canvasGuide.scrollWidth;
		canvas.height = canvasGuide.scrollHeight;
	});

	// Draw images.
	canvasImages.forEach(canvasImage => {
		canvasImage.drawImage();
	});

	// Initialise bounding boxes based on what we've drawn.
	padState.initAxisBoundingBoxes();

	// Draw bounding boxes just for visual verification.
	padState.getAxisBoundingBoxes().forEach((boundingBox) => {
		hitboxCanvasImage.context.strokeStyle = 'red';
		hitboxCanvasImage.context.lineWidth = 2;
		hitboxCanvasImage.context.strokeRect(...boundingBox);
	});
}

window.addEventListener('resize', function() {
	redraw();
})

//
// State transmission.
//
const socket = new WebSocket(`ws://${ADDRESS}`);
function sendState() {
	const state = padState.getState();
	socket.send(JSON.stringify(state, null, 4));
}

//
// Send state at regular intervals.
//
setInterval(sendState, 1000 / UPDATES_PER_SECOND);

//
// React to user interaction.
//
hitboxCanvas.onpointerdown = (ev) => {
	const rgba = hitboxCanvasImage.getPixels(ev.clientX, ev.clientY, 1, 1).slice(0, 4);
	padState.onPointerDown(rgba, ev.pointerId, ev.clientX, ev.clientY);
	sendState();
};

hitboxCanvas.onpointermove = (ev) => {
	const rgba = hitboxCanvasImage.getPixels(ev.clientX, ev.clientY, 1, 1).slice(0, 4);
	padState.onPointerMove(rgba, ev.pointerId, ev.clientX, ev.clientY);
	sendState();
};

hitboxCanvas.onpointerup = (ev) => {
	padState.onPointerUp(ev.pointerId);
	sendState();
};
