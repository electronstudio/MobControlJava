/**
 * MobControl Client
 *
 * Stores and updates internal representation of a pad based on user interaction.
 * Transmits internal representation to server on regular intervals.
 */

import CanvasImage from './lib/canvasImage.js';
import PadState from './lib/padState.js';
import Logger from './lib/logger.js';
import Vibration from './lib/vibration.js';

//
// Configuration.
//

function getAddress() {
	const url = new URL(window.location.origin);
	url.protocol = 'ws';
	url.pathname = 'mobcontrol/';
	return url;
}

//
// Get HTML elements.
//
const logElement = document.getElementById('log');
const canvasGuide = document.getElementById('canvasGuide');
const sectionCanvas = document.getElementById('sectionCanvas');
const graphicCanvas = document.getElementById('graphicCanvas');
const overlayCanvas = document.getElementById('overlayCanvas');

//
// Load the images.
//
function getImage(imageSrc, onLoad) {
	const image = new Image();
	image.addEventListener('load', onLoad, false);
	image.src = imageSrc;
	return image;
}

const sectionImage = getImage('./pads/1/section.png', redraw);
const graphicImage = getImage('./pads/1/graphic.svg', redraw);

//
// Initialise utilities.
//
const logger = new Logger(logElement);
const vibration = new Vibration(logger);
const sectionCanvasImage = new CanvasImage(sectionCanvas, sectionImage);
const graphicCanvasImage = new CanvasImage(graphicCanvas, graphicImage);
const overlayCanvasImage = new CanvasImage(overlayCanvas, null);
const canvasImages = [sectionCanvasImage, graphicCanvasImage, overlayCanvasImage];

const padState = new PadState(sectionCanvasImage);

//
// Redraw.
//
function redrawBase() {
	canvasImages.forEach((canvasImage) => {
		canvasImage.alignWithElement(canvasGuide);
		canvasImage.drawImage();
	});

	// Initialise bounding boxes based on what we've drawn.
	padState.initAxisBoundingBoxes();
}

function redrawOverlay() {
	const style0 = 'rgba(0,0,0,0.0)';
	const style1 = 'rgba(0,0,0,0.005)';
	const style2 = 'rgba(0,0,0,0.02)';
	const lineWidth = 2;
	const r = 2;

	// Draw visual verification.
	overlayCanvasImage.clear();

	padState.getAxisBoundingBoxes().forEach((boundingBox) => {
		overlayCanvasImage.drawBoundingBox(boundingBox, lineWidth, style0, style2);
	});

	padState.getActivePointerInfos().forEach((pointerInfo) => {
		const { downPosition, movePosition, extentRadius } = pointerInfo;
		const x1 = downPosition.absX;
		const y1 = downPosition.absY;

		overlayCanvasImage.drawCircle(x1, y1, r, style1, style2);

		if (movePosition) {
			const x2 = movePosition.absX;
			const y2 = movePosition.absY;

			if (extentRadius) { overlayCanvasImage.drawCircle(x1, y1, extentRadius, style1, style2); }
			overlayCanvasImage.drawCircle(x2, y2, lineWidth, style1, style2);
			overlayCanvasImage.drawLine(x1, y1, x2, y2, lineWidth, style1, style2);
		}
	});
}

function redraw() {
	redrawBase();
	redrawOverlay();
}

window.addEventListener('resize', () => {
	redraw();
});

//
// State transmission.
//
const socket = new WebSocket(getAddress());

let lastPayload = null;

function sendState() {
	const deltaState = padState.getAndResetDeltaState();
	const thisPayload = JSON.stringify(deltaState, null, 4);
	if (lastPayload !== thisPayload) {
		lastPayload = thisPayload;
		socket.send(thisPayload);
	}

	if (deltaState.BUTTON_GUIDE) { vibration.testSimple(1234); }
	if (deltaState.BUTTON_BACK) { vibration.testComplex(); }
}

//
// Receive messages.
//
socket.onmessage = (event) => {
	const { header, data } = JSON.parse(event.data);
	switch (header) {
	case 'vibrate': { vibration.run(data); break; }
	default: { break; }
	}
};

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
