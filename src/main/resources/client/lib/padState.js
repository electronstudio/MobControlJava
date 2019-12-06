/**
 * PadState
 *
 * Encapsulates the data structure that represents the pad state.
 * Stores a graphic representing coloured hitbox sections for each pad input.
 * Updates the state based on pointer up/move/down events on the graphic.
 */

export default (function iife() {
	/**
	 *
	 * Configuration.
	 *
	 */

	const AXIS2D_EXTENT_RADIUS = 20;

	/**
	 *
	 * Expected colours, for each input type.
	 *
	 */

	const inputColours = {
		dirpad: {
			// Redundant info but it makes the lookup much easier.
			'63,11,10,255': 'BUTTON_DPAD',
			'48,58,48,255': 'BUTTON_DPAD',
			'61,49,39,255': 'BUTTON_DPAD',
			'46,41,58,255': 'BUTTON_DPAD',
			'63,11,10,255|48,58,48,255|61,49,39,255|46,41,58,255': 'BUTTON_DPAD',
		},
		button: {
			'58,47,42,255': 'BUTTON_A',
			'46,56,48,255': 'BUTTON_B',
			'53,31,41,255': 'BUTTON_X',
			'23,15,53,255': 'BUTTON_Y',
			'34,51,45,255': 'BUTTON_BACK',
			'51,35,41,255': 'BUTTON_GUIDE',
			'44,51,28,255': 'BUTTON_START',
			'33,38,51,255': 'BUTTON_LEFTSTICK',
			'51,48,26,255': 'BUTTON_RIGHTSTICK',
			'51,14,31,255': 'BUTTON_LEFTSHOULDER',
			'23,31,53,255': 'BUTTON_RIGHTSHOULDER',
		},
		axis1D: {
			'255,255,255,255': 'AXIS_TRIGGERLEFT',
			'0,0,0,255': 'AXIS_TRIGGERRIGHT',
		},
		axis2D: {
			'255,0,0,255': 'AXIS_LEFT',
			'0,255,242,255': 'AXIS_RIGHT',
		},
	};

	/**
	 *
	 * Utils.
	 *
	 */

	function getInputTypeFromInput(input) {
		const inputTypes = Object.keys(inputColours);

		const validInputTypes = inputTypes.filter((inputType) => {
			const inputsOfType = Object.values(inputColours[inputType]);
			return inputsOfType.includes(input);
		});

		return validInputTypes.length > 0 ? validInputTypes[0] : 'unknown';
	}

	function colourStringToRgbas(colourString) {
		const rgbaStrings = colourString.split('|');
		const rgbaStringToRgba = (x) => x.split(',').map((y) => parseInt(y, 10));
		const rgbas = rgbaStrings.map(rgbaStringToRgba);
		return rgbas;
	}

	function rgbaToColourString(rgba) {
		return rgba.join(',');
	}

	function getBoundingBoxRelativePosition(boundingBox, absX, absY) {
		const [x, y, w, h] = boundingBox;
		const centerX = x + (w / 2);
		const centerY = y + (h / 2);
		const relX = (absX - centerX) / (w / 2);
		const relY = (absY - centerY) / (h / 2);
		return [relX, relY];
	}

	/**
	 *
	 * Constructor.
	 *
	 */

	function PadState(sectionCanvasImage) {
		/* eslint-disable no-multi-spaces */
		this.sectionCanvasImage = sectionCanvasImage;   // Image whose colours define the hitbox of each input.
		this.colourBoundingBoxes = {};                  // Bounding box for each hitbox.
		this.activePointerInfoMap = {};                 // Metadata for each currently-active pointer.
		this.deltaState = {};                           // Changes made to the pad state, since the last call to flushDeltaState().
		/* eslint-enable no-multi-spaces */

		this.resetState();
	}

	/**
	 *
	 * Bounding box.
	 *
	 */

	PadState.prototype.initAxisBoundingBoxes = function initAxisBoundingBoxes() {
		const colourStringToInputMap = Object.assign({}, ...Object.values(inputColours));

		Object.keys(colourStringToInputMap).forEach((colourString) => {
			const input = colourStringToInputMap[colourString];
			const rgbas = colourStringToRgbas(colourString);
			this.colourBoundingBoxes[input] = this.sectionCanvasImage.getRgbasBoundingBox(rgbas);
		});
	};

	PadState.prototype.getAxisBoundingBoxes = function getAxisBoundingBoxes() {
		return Object.values(this.colourBoundingBoxes);
	};

	PadState.prototype.getActivePointerInfos = function getActivePointerInfos() {
		return Object.values(this.activePointerInfoMap);
	};

	/**
	 *
	 * State.
	 *
	 */

	PadState.prototype.setState = function setState(partialState) {
		Object.assign(this.deltaState, partialState);
	};

	PadState.prototype.flushState = function flushDeltaState() {
		const { deltaState } = this;
		this.deltaState = {};
		return deltaState;
	};

	const handlers = {
		dirpad: {
			reset: (input) => ({
				[`${input}_LEFT`]: false,
				[`${input}_RIGHT`]: false,
				[`${input}_UP`]: false,
				[`${input}_DOWN`]: false,
			}),
			update: (colourBoundingBoxes, activePointerInfoMap, pointer, input, absX, absY) => {
				const boundingBox = colourBoundingBoxes[input];
				const [relX, relY] = getBoundingBoxRelativePosition(boundingBox, absX, absY);

				const deadZone = 0.3;
				return {
					[`${input}_LEFT`]: relX < -deadZone,
					[`${input}_RIGHT`]: relX > +deadZone,
					[`${input}_UP`]: relY < -deadZone,
					[`${input}_DOWN`]: relY > +deadZone,
				};
			},
		},
		button: {
			reset: (input) => ({
				[input]: false,
			}),
			update: (colourBoundingBoxes, activePointerInfoMap, pointer, input, absX, absY) => ({
				[input]: true,
			}),
		},
		axis1D: {
			reset: (input) => ({
				[input]: 0,
			}),
			update: (colourBoundingBoxes, activePointerInfoMap, pointer, input, absX, absY) => {
				const boundingBox = colourBoundingBoxes[input];
				const [, relY] = getBoundingBoxRelativePosition(boundingBox, absX, absY);
				return {
					[input]: (-relY / 2) + 0.5,
				};
			},
		},
		axis2D: {
			reset: (input) => ({
				[`${input}X`]: 0,
				[`${input}Y`]: 0,
			}),
			update: (colourBoundingBoxes, activePointerInfoMap, pointer, input, absX, absY) => {
				const { downPosition, extentRadius } = activePointerInfoMap[pointer];

				const boundingBox = [
					downPosition.absX - extentRadius,
					downPosition.absY - extentRadius,
					extentRadius * 2,
					extentRadius * 2,
				];

				const [relX, relY] = getBoundingBoxRelativePosition(boundingBox, absX, absY);
				const magnitude = Math.sqrt(relX * relX + relY * relY);
				const clip = magnitude > 1;

				const clampedX = clip ? (relX / magnitude) : relX;
				const clampedY = clip ? (relY / magnitude) : relY;

				return {
					[`${input}X`]: clampedX,
					[`${input}Y`]: clampedY,
				};
			},
		},
	};

	PadState.prototype.resetState = function resetState() {
		Object.values(inputColours.dirpad).forEach((dirpad) => { this.setState(handlers.dirpad.reset(dirpad)); });
		Object.values(inputColours.button).forEach((button) => { this.setState(handlers.button.reset(button)); });
		Object.values(inputColours.axis1D).forEach((axis1D) => { this.setState(handlers.axis1D.reset(axis1D)); });
		Object.values(inputColours.axis2D).forEach((axis2D) => { this.setState(handlers.axis2D.reset(axis2D)); });
	};

	/**
	 *
	 * Pointer update.
	 *
	 */

	PadState.prototype.onPointerDown = function onPointerDown(pointer, absX, absY) {
		// Get associated input.
		const rgba = this.sectionCanvasImage.getPixels(absX, absY, 1, 1).slice(0, 4);
		const colourString = rgbaToColourString(rgba);

		const dirpad = inputColours.dirpad[colourString];
		const button = inputColours.button[colourString];
		const axis1D = inputColours.axis1D[colourString];
		const axis2D = inputColours.axis2D[colourString];

		const input = dirpad || button || axis1D || axis2D;
		const inputType = getInputTypeFromInput(input);

		// Update pointer cache.
		if (input) {
			this.activePointerInfoMap[pointer] = {
				input,
				downPosition: { absX, absY },
				extentRadius: axis2D && AXIS2D_EXTENT_RADIUS,
			};
		}

		// Update state.
		const handler = handlers[inputType];
		if (handler) {
			this.setState(handlers[inputType].update(this.colourBoundingBoxes, this.activePointerInfoMap, pointer, input, absX, absY));
		}
	};

	PadState.prototype.onPointerMove = function onPointerMove(pointer, absX, absY) {
		// Get associated input.
		const pointerInfo = this.activePointerInfoMap[pointer];
		const input = pointerInfo && pointerInfo.input;
		const inputType = getInputTypeFromInput(input);

		if (input) {
			if (inputType !== 'button') {
				// Update pointer cache.
				Object.assign(this.activePointerInfoMap[pointer], {
					movePosition: { absX, absY },
				});

				// Update state.
				const handler = handlers[inputType];
				if (handler) {
					this.setState(handlers[inputType].update(this.colourBoundingBoxes, this.activePointerInfoMap, pointer, input, absX, absY));
				}
			}
		}
	};

	PadState.prototype.onPointerUp = function onPointerUp(pointer) {
		// Get associated input.
		const pointerInfo = this.activePointerInfoMap[pointer];
		const input = pointerInfo && pointerInfo.input;
		const inputType = getInputTypeFromInput(input);

		// Update pointer cache.
		delete this.activePointerInfoMap[pointer];

		// Update state.
		const handler = handlers[inputType];
		if (handler) {
			this.setState(handlers[inputType].reset(input));
		}
	};

	return PadState;
}());
