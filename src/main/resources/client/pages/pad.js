import CanvasImage from '../lib/canvasImage.js';
import PadState from '../lib/padState.js';
import Vibration from '../lib/vibration.js';

export default class PadPage {
	constructor(conn, logger, onSettingsPageRequested) {
		this.conn = conn;
		this.logger = logger;
		this.onSettingsPageRequested = onSettingsPageRequested;
		this.padIndex = null;

		//
		// Get HTML elements.
		//
		this.canvasGuide = document.getElementById('canvasGuide');
		this.sectionCanvas = document.getElementById('sectionCanvas');
		this.graphicCanvas = document.getElementById('graphicCanvas');
		this.overlayCanvas = document.getElementById('overlayCanvas');

		this.initCanvasGraphics(1);
		this.padState = new PadState(this.sectionCanvasImage, () => { this.onSettingsPageRequested(this.padIndex); });
		this.initRedraw();
		this.vibration = new Vibration(this.logger);
		this.lastPayload = null;
		this.initVibration();
		this.initPointerEvents();
	}

	initCanvasGraphics(padIndex) {
		if (this.padIndex === padIndex) {
			return;
		}

		this.padIndex = padIndex;

		//
		// Load the images.
		//
		function getImage(imageSrc, onLoad) {
			const image = new Image();
			image.addEventListener('load', onLoad, false);
			image.src = imageSrc;
			return image;
		}
		this.logger.logAndNotify(`Loading layout ${padIndex}`);
		const sectionImage = getImage(`./pads/${padIndex}/section.png`, () => {
			this.redraw();
			this.logger.logAndNotify(`Layout ${padIndex} loaded`);
		});
		this.logger.logAndNotify(`Loading graphic ${padIndex}`);
		const graphicImage = getImage(`./pads/${padIndex}/graphic.svg`, () => {
			this.redraw();
			this.logger.logAndNotify(`Graphic ${padIndex} loaded`);
		});


		//
		// Initialise utilities.
		//
		this.sectionCanvasImage = new CanvasImage(this.sectionCanvas, sectionImage);
		this.graphicCanvasImage = new CanvasImage(this.graphicCanvas, graphicImage);
		this.overlayCanvasImage = new CanvasImage(this.overlayCanvas, null);
		this.canvasImages = [this.sectionCanvasImage, this.graphicCanvasImage, this.overlayCanvasImage];
	}

	//
	// Redraw.
	//
	redrawBase() {
		this.canvasImages.forEach((canvasImage) => {
			canvasImage.alignWithElement(this.canvasGuide);
			canvasImage.drawImage();
		});

		// Initialise bounding boxes based on what we've drawn.
		this.padState.initAxisBoundingBoxes();
	}

	redrawOverlay() {
		this.overlayCanvasImage.clear();

		// Draw very faint bounding boxes.
		this.padState.getAxisBoundingBoxes().forEach((boundingBox) => {
			this.overlayCanvasImage.drawBoundingBox({ boundingBox, lineWidth: 2, fillColour: 'rgba(0,0,0,0.0)', outlineWidth: 'rgba(0,0,0,0.02)' });
		});

		this.padState.getActivePointerInfos().forEach((pointerInfo) => {
			// Derive dimensions relative to the screen resolution.
			const windowHeight = this.graphicCanvasImage.getSize().h;
			const bigRadius = Math.floor(windowHeight * 0.2);
			const dotRadius = Math.floor(bigRadius / 10);
			const thinWidth = Math.floor(dotRadius / 3);
			const thickWidth = thinWidth * 4;

			// Main colours.
			const fillColour = 'rgba(0,0,255,0.7)';
			const outlineColour = 'rgba(0,0,0,0.8)';
			const extentColour = 'rgba(255,0,0,0.3)';

			const { downPosition, movePosition, extentRadius } = pointerInfo;

			// Draw a dot on wherever is pressed down.
			this.overlayCanvasImage.drawCircle({ x: downPosition.absX, y: downPosition.absY, r: dotRadius, fillColour, outlineColour, outlineWidth: thinWidth });

			if (movePosition) {
				// Draw a line between the down and move positions.
				this.overlayCanvasImage.drawLine({ x1: downPosition.absX, y1: downPosition.absY, x2: movePosition.absX, y2: movePosition.absY, colour: outlineColour, lineWidth: thinWidth });

				const isAxis2D = extentRadius;
				if (isAxis2D) {
					// Draw a circle where the pointer was down. (With thick outline.)
					this.overlayCanvasImage.drawCircle({ x: downPosition.absX, y: downPosition.absY, r: bigRadius, fillColour, outlineColour, outlineWidth: thickWidth });

					// Draw a circle where the pointer has moved to. (With thin outline.)
					this.overlayCanvasImage.drawCircle({ x: movePosition.absX, y: movePosition.absY, r: bigRadius, fillColour, outlineColour, outlineWidth: thinWidth });

					// Draw the axis-bounds. This shows the effect of changing the analogue stick sensitivity.
					this.overlayCanvasImage.drawCircle({ x: downPosition.absX, y: downPosition.absY, r: extentRadius, fillColour: extentColour, outlineColour, outlineWidth: thinWidth });
				}
			}
		});
	}

	redraw() {
		this.redrawBase();
		this.redrawOverlay();
	}

	initRedraw() {
		window.addEventListener('resize', () => {
			this.redraw();
		});
	}

	//
	// State transmission.
	//

	sendState() {
		const deltaState = this.padState.flushState();
		const thisPayload = JSON.stringify(deltaState, null, 4);
		if (this.lastPayload !== thisPayload) {
			this.lastPayload = thisPayload;
			this.conn.send(thisPayload);
		}

		if (deltaState.BUTTON_GUIDE) { this.vibration.testSimple(1234); }
		if (deltaState.BUTTON_BACK) { this.vibration.testComplex(); }
	}

	//
	// Receive messages.
	//

	initVibration() {
		const sub = (type, data) => {
			switch (type) {
			case 'vibrate': { this.vibration.run(data); break; }
			default: { break; }
			}
		};

		this.conn.addSub(sub);
	}

	//
	// React to user interaction.
	//

	initPointerEvents() {
		this.sectionCanvas.onpointerdown = (ev) => {
			this.padState.onPointerDown(ev.pointerId, ev.clientX, ev.clientY);
			this.redrawOverlay();
			this.sendState();
		};

		this.sectionCanvas.onpointermove = (ev) => {
			this.padState.onPointerMove(ev.pointerId, ev.clientX, ev.clientY);
			this.redrawOverlay();
			this.sendState();
		};

		this.sectionCanvas.onpointerup = (ev) => {
			this.padState.onPointerUp(ev.pointerId);
			this.redrawOverlay();
			this.sendState();
		};
	}

	getPadState() {
		return this.padState;
	}
}
