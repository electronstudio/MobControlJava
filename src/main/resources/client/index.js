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
const overlayCanvasImage = new CanvasImage(overlayCanvas, null);
const canvasImages = [hitboxCanvasImage, graphicCanvasImage, overlayCanvasImage];

const padState = new PadState(hitboxCanvasImage);

log(UPDATES_PER_SECOND);

//
// Redraw.
//
function redrawBase() {
	canvasImages.forEach(canvasImage => {
		canvasImage.alignWithElement(canvasGuide);
		canvasImage.drawImage();
	});

	// Initialise bounding boxes based on what we've drawn.
	padState.initAxisBoundingBoxes();
}

function redrawOverlay() {
	// Draw internal state on the overlay for visual verification that the code is doing what it should be doing.
	overlayCanvasImage.clear();

	padState.getAxisBoundingBoxes().forEach((boundingBox) => {
		overlayCanvasImage.drawBoundingBox(boundingBox);
	});

	padState.getActivePointerInfos().forEach(pointerInfo => {
		const { downPosition, movePosition, extentRadius } = pointerInfo;
		const fillStyle = 'rgba(0,0,0,0.1)';
		const strokeStyle = 'rgba(0,0,0,0.3)';

		overlayCanvasImage.drawCircle(downPosition.absX, downPosition.absY, 3, fillStyle, strokeStyle);

		if (movePosition) {
			if (extentRadius) {
				overlayCanvasImage.drawCircle(downPosition.absX, downPosition.absY, extentRadius, fillStyle, strokeStyle);
			}
			overlayCanvasImage.drawCircle(movePosition.absX, movePosition.absY, 6, fillStyle, strokeStyle);
			overlayCanvasImage.drawLine(downPosition.absX, downPosition.absY, movePosition.absX, movePosition.absY);
		}
	});
}

function redraw() {
	redrawBase();
	redrawOverlay();
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
	padState.onPointerDown(ev.pointerId, ev.clientX, ev.clientY);
	redrawOverlay();
	sendState();
};

hitboxCanvas.onpointermove = (ev) => {
	padState.onPointerMove(ev.pointerId, ev.clientX, ev.clientY);
	redrawOverlay();
	sendState();
};

hitboxCanvas.onpointerup = (ev) => {
	padState.onPointerUp(ev.pointerId);
	redrawOverlay();
	sendState();
};
