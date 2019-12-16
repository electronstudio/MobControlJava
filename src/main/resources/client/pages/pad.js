import CanvasImage from '../lib/canvasImage.js';
import PadState from '../lib/padState.js';
import Vibration from '../lib/vibration.js';

export default class PadPage {
	constructor(conn, logger, onSettingsPageRequested) {
		this.conn = conn;
		this.logger = logger;
		this.onSettingsPageRequested = onSettingsPageRequested;

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
		this.logger.logAndNotify('Loading layout 1');
		const sectionImage = getImage('./pads/1/section.png', () => {
			redraw();
			this.logger.logAndNotify('Layout 1 loaded');
		});
		this.logger.logAndNotify('Loading graphic 1');
		const graphicImage = getImage('./pads/1/graphic.svg', () => {
			redraw();
			this.logger.logAndNotify('Graphic 1 loaded');
		});


		//
		// Initialise utilities.
		//
		const vibration = new Vibration(this.logger);
		const sectionCanvasImage = new CanvasImage(sectionCanvas, sectionImage);
		const graphicCanvasImage = new CanvasImage(graphicCanvas, graphicImage);
		const overlayCanvasImage = new CanvasImage(overlayCanvas, null);
		const canvasImages = [sectionCanvasImage, graphicCanvasImage, overlayCanvasImage];

		this.padState = new PadState(sectionCanvasImage, onSettingsPageRequested);

		//
		// Redraw.
		//
		const redrawBase = () => {
			canvasImages.forEach((canvasImage) => {
				canvasImage.alignWithElement(canvasGuide);
				canvasImage.drawImage();
			});

			// Initialise bounding boxes based on what we've drawn.
			this.padState.initAxisBoundingBoxes();
		};

		const redrawOverlay = () => {
			overlayCanvasImage.clear();

			// Draw very faint bounding boxes.
			this.padState.getAxisBoundingBoxes().forEach((boundingBox) => {
				overlayCanvasImage.drawBoundingBox({ boundingBox, lineWidth: 2, fillColour: 'rgba(0,0,0,0.0)', outlineWidth: 'rgba(0,0,0,0.02)' });
			});

			this.padState.getActivePointerInfos().forEach((pointerInfo) => {
				// Derive dimensions relative to the screen resolution.
				const windowHeight = graphicCanvasImage.getSize().h;
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
				overlayCanvasImage.drawCircle({ x: downPosition.absX, y: downPosition.absY, r: dotRadius, fillColour, outlineColour, outlineWidth: thinWidth });

				if (movePosition) {
					// Draw a line between the down and move positions.
					overlayCanvasImage.drawLine({ x1: downPosition.absX, y1: downPosition.absY, x2: movePosition.absX, y2: movePosition.absY, colour: outlineColour, lineWidth: thinWidth });

					const isAxis2D = extentRadius;
					if (isAxis2D) {
						// Draw a circle where the pointer was down. (With thick outline.)
						overlayCanvasImage.drawCircle({ x: downPosition.absX, y: downPosition.absY, r: bigRadius, fillColour, outlineColour, outlineWidth: thickWidth });

						// Draw a circle where the pointer has moved to. (With thin outline.)
						overlayCanvasImage.drawCircle({ x: movePosition.absX, y: movePosition.absY, r: bigRadius, fillColour, outlineColour, outlineWidth: thinWidth });

						// Draw the axis-bounds. This shows the effect of changing the analogue stick sensitivity.
						overlayCanvasImage.drawCircle({ x: downPosition.absX, y: downPosition.absY, r: extentRadius, fillColour: extentColour, outlineColour, outlineWidth: thinWidth });
					}
				}
			});
		};

		const redraw = () => {
			redrawBase();
			redrawOverlay();
		};

		window.addEventListener('resize', () => {
			redraw();
		});

		//
		// State transmission.
		//

		let lastPayload = null;

		const sendState = () => {
			const deltaState = this.padState.flushState();
			const thisPayload = JSON.stringify(deltaState, null, 4);
			if (lastPayload !== thisPayload) {
				lastPayload = thisPayload;
				this.conn.send(thisPayload);
			}

			if (deltaState.BUTTON_GUIDE) { vibration.testSimple(1234); }
			if (deltaState.BUTTON_BACK) { vibration.testComplex(); }
		};

		//
		// Receive messages.
		//

		const sub = (type, data) => {
			switch (type) {
			case 'vibrate': { vibration.run(data); break; }
			default: { break; }
			}
		};

		this.conn.addSub(sub);

		//
		// React to user interaction.
		//
		sectionCanvas.onpointerdown = (ev) => {
			this.padState.onPointerDown(ev.pointerId, ev.clientX, ev.clientY);
			redrawOverlay();
			sendState();
		};

		sectionCanvas.onpointermove = (ev) => {
			this.padState.onPointerMove(ev.pointerId, ev.clientX, ev.clientY);
			redrawOverlay();
			sendState();
		};

		sectionCanvas.onpointerup = (ev) => {
			this.padState.onPointerUp(ev.pointerId);
			redrawOverlay();
			sendState();
		};
	}

	getPadState() {
		return this.padState;
	}
}
