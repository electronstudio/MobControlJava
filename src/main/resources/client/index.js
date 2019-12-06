/**
 * MobControl Client
 *
 * Stores and updates internal representation of a pad based on user interaction.
 * Transmits internal representation to server on regular intervals.
 */

import CanvasImage from './lib/canvasImage.js';
import PadState from './lib/padState.js';
import log from './lib/logger.js';

//
// Configuration.
//

function getAddress() {
	let url = new URL(window.location.origin);
	url.protocol='ws';
	url.pathname='mobcontrol/';
	return url;
}

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
	const image = new Image();
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
	canvasImages.forEach((canvasImage) => {
		canvasImage.alignWithElement(canvasGuide);
		canvasImage.drawImage();
	});

	// Initialise bounding boxes based on what we've drawn.
	padState.initAxisBoundingBoxes();
}

function redrawOverlay() {
	// Draw visual verification.
	overlayCanvasImage.clear();

	padState.getAxisBoundingBoxes().forEach((boundingBox) => {
		overlayCanvasImage.drawBoundingBox(boundingBox);
	});

	padState.getActivePointerInfos().forEach((pointerInfo) => {
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

window.addEventListener('resize', () => {
	redraw();
});

//
// Vibration.
//
navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
if ('vibrate' in navigator) {
	log('Vibration API supported');
}

function vibrate1(data) {
	const result = navigator.vibrate(data.duration_ms);
	log('Vibration 1 result:', result, data.duration_ms / 1000);
}

function vibrate2() {
	const result = navigator.vibrate([100, 30, 100, 30, 100, 30, 200, 30, 200, 30, 200, 30, 100, 30, 100, 30, 100]);
	log('Vibration 2 result:', result);
}

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

	if (deltaState.BUTTON_GUIDE) { vibrate1({ duration_ms: 1234 }); }
	if (deltaState.BUTTON_BACK) { vibrate2(); }
}

//
// Receive messages.
//
socket.onmessage = (event) => {
	const { header, data } = JSON.parse(event.data);
	switch (header) {
	case 'vibrate': { vibrate1(data); break; }
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
