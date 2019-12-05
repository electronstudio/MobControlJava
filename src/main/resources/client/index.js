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

//
// Get HTML elements.
//
const canvasGuide = document.getElementById('canvasGuide');
const sectionCanvas = document.getElementById('sectionCanvas');
const graphicCanvas = document.getElementById('graphicCanvas');
const overlayCanvas = document.getElementById('overlayCanvas');

//
// Load the images.
//
function getImage(imageSrc, onLoad) {
	const image = new Image;
	image.addEventListener('load', onLoad, false);
	image.src = imageSrc;
	return image;
}

const sectionImage = getImage('./section.png', redraw);
const graphicImage = getImage('./graphic.svg', redraw);

//
// Initialise utilities.
//
const sectionCanvasImage = new CanvasImage(sectionCanvas, sectionImage);
const graphicCanvasImage = new CanvasImage(graphicCanvas, graphicImage);
const overlayCanvasImage = new CanvasImage(overlayCanvas, null);
const canvasImages = [sectionCanvasImage, graphicCanvasImage, overlayCanvasImage];

const padState = new PadState(sectionCanvasImage);

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

socket.onclose    = event => { console.log('onclose',   event); log('onclose',   event); }
socket.onerror    = event => { console.log('onerror',   event); log('onerror',   event); };
socket.onmessage  = event => { console.log('onmessage', event); log('onmessage', event); };
socket.onopen     = event => { console.log('onopen',    event); log('onopen',    event); };

let lastPayload = null;

function sendState() {
	const deltaState = padState.getAndResetDeltaState();
	const thisPayload = JSON.stringify(deltaState, null, 4);
	if (lastPayload !== thisPayload) {
		lastPayload = thisPayload;
		socket.send(thisPayload);
	}
}

//
// React to user interaction.
//
sectionCanvas.onpointerdown = (ev) => {
	padState.onPointerDown(ev.pointerId, ev.clientX, ev.clientY);
	redrawOverlay();
	sendState();
};

sectionCanvas.onpointermove = (ev) => {
	padState.onPointerMove(ev.pointerId, ev.clientX, ev.clientY);
	redrawOverlay();
	sendState();
};

sectionCanvas.onpointerup = (ev) => {
	padState.onPointerUp(ev.pointerId);
	redrawOverlay();
	sendState();
};
