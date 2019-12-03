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
const overlayCanvas = document.getElementById('overlayCanvas');
const logElement = document.getElementById('log');

//
// Initialise utilities.
//
const hitboxCanvasImage = new CanvasImage(hitboxCanvas);
const padState = new PadState(hitboxCanvasImage);
const logger = new Logger(logElement);
logger.log(UPDATES_PER_SECOND);

//
// Redraw.
//
function redraw() {
	// Align canvas elements with the canvas guide.
	hitboxCanvas.width = canvasGuide.scrollWidth;
	hitboxCanvas.height = canvasGuide.scrollHeight;
	overlayCanvas.width = canvasGuide.scrollWidth;
	overlayCanvas.height = canvasGuide.scrollHeight;

	// Draw the image.
	hitboxCanvasImage.drawImage(hitboxImage);

	// Initialise bounding boxes based on what we've drawn.
	padState.initAxisBoundingBoxes();

	// Draw bounding boxes just for visual verification.
	padState.getAxisBoundingBoxes().forEach((boundingBox) => {
		hitboxCanvasImage.context.strokeStyle = 'red';
		hitboxCanvasImage.context.lineWidth = 2;
		hitboxCanvasImage.context.strokeRect(...boundingBox);
	});
}

//
// Load the image.
//
const hitboxImage = new Image;
hitboxImage.addEventListener('load', function() {
	redraw();
}, false);
hitboxImage.src = './layout_logical.png';

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
	padState.onPointerDown(rgba, ev.pointerId);
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
