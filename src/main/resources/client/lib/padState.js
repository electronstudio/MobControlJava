/**
 * PadState
 *
 * Encapsulates the data structure that represents the pad state.
 * Stores a graphic representing coloured hitbox sections for each pad input.
 * Updates the state based on pointer up/move/down events on the graphic.
 */

export default (function iife() {
	const AXIS2D_EXTENT_RADIUS = 20;

	//
	// Expected colours, for each input type.
	//
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

	function getInputTypeFromInput(input) {
		const inputTypes = Object.keys(inputColours);

		const validInputTypes = inputTypes.filter((inputType) => {
			const inputsOfType = Object.values(inputColours[inputType]);
			return inputsOfType.includes(input);
		});

		return validInputTypes.length > 0 ? validInputTypes[0] : 'unknown';
	}

	//
	// RGBA serialisation.
	//
	function pixelStringToRgbas(pixelString) {
		const rgbaStrings = pixelString.split('|');
		const rgbaStringToRgba = (x) => x.split(',').map((y) => parseInt(y, 10));
		const rgbas = rgbaStrings.map(rgbaStringToRgba);
		return rgbas;
	}

	function rgbaToPixelString(rgba) {
		return rgba.join(',');
	}

	//
	// Utils.
	//
	function getBoundingBoxRelativePosition(boundingBox, absX, absY) {
		const [x, y, w, h] = boundingBox;
		const centerX = x + (w / 2);
		const centerY = y + (h / 2);
		const relX = (absX - centerX) / (w / 2);
		const relY = (absY - centerY) / (h / 2);
		return [relX, relY];
	}

	//
	// Contains the state of the pad.
	//
	function PadState(sectionCanvasImage) {
		// Underlying image that defines where each button is.
		this.sectionCanvasImage = sectionCanvasImage;

		// Changes made to the pad state, since the last call of getAndResetDeltaState().
		// This should only be mutated via setState() + getAndResetDeltaState()!
		this.deltaState = {};

		// Cache of active pointers to associated info.
		this.activePointerInfoMap = {};

		// Cache of bounding boxes for move-enabled inputs.
		this.colourBoundingBoxes = {};

		this.resetState();
	}

	PadState.prototype.setState = function setState(partialState) {
		this.deltaState = { ...this.deltaState, ...partialState };
	};

	//
	// Bounding box init.
	//
	PadState.prototype.initAxisBoundingBoxes = function initAxisBoundingBoxes() {
		const pixelStringToInputMap = Object.assign({}, ...Object.values(inputColours));

		Object.keys(pixelStringToInputMap).forEach((pixelString) => {
			const input = pixelStringToInputMap[pixelString];
			const rgbas = pixelStringToRgbas(pixelString);
			this.colourBoundingBoxes[input] = this.sectionCanvasImage.getRgbasBoundingBox(rgbas);
		});
	};

	//
	// Bounding box get.
	//
	PadState.prototype.getAxisBoundingBoxes = function getAxisBoundingBoxes() {
		return Object.values(this.colourBoundingBoxes);
	};

	PadState.prototype.getActivePointerInfos = function getActivePointerInfos() {
		return Object.values(this.activePointerInfoMap);
	};

	//
	// State reset.
	//
	PadState.prototype.resetDirpad = function resetDirpad(dirpad) {
		this.setState({
			[`${dirpad}_LEFT`]: false,
			[`${dirpad}_RIGHT`]: false,
			[`${dirpad}_UP`]: false,
			[`${dirpad}_DOWN`]: false,
		});
	};

	PadState.prototype.resetButton = function resetButton(button) {
		this.setState({
			[button]: false,
		});
	};

	PadState.prototype.resetAxis1D = function resetAxis1D(axis1D) {
		this.setState({
			[axis1D]: 0,
		});
	};

	PadState.prototype.resetAxis2D = function resetAxis2D(axis2D) {
		this.setState({
			[`${axis2D}X`]: 0,
			[`${axis2D}Y`]: 0,
		});
	};

	PadState.prototype.resetState = function resetState() {
		Object.values(inputColours.dirpad).forEach((dirpad) => { this.resetDirpad(dirpad); });
		Object.values(inputColours.button).forEach((button) => { this.resetButton(button); });
		Object.values(inputColours.axis1D).forEach((axis1D) => { this.resetAxis1D(axis1D); });
		Object.values(inputColours.axis2D).forEach((axis2D) => { this.resetAxis2D(axis2D); });
	};

	//
	// State update.
	//
	PadState.prototype.updateDirpad = function updateDirpad(pointer, dirpad, absX, absY) {
		const boundingBox = this.colourBoundingBoxes[dirpad];
		const [relX, relY] = getBoundingBoxRelativePosition(boundingBox, absX, absY);

		const deadZone = 0.3;
		this.setState({
			[`${dirpad}_LEFT`]: relX < -deadZone,
			[`${dirpad}_RIGHT`]: relX > +deadZone,
			[`${dirpad}_UP`]: relY < -deadZone,
			[`${dirpad}_DOWN`]: relY > +deadZone,
		});
	};

	PadState.prototype.updateButton = function updateButton(pointer, button, absX, absY) {
		this.setState({
			[button]: true,
		});
	};

	PadState.prototype.updateAxis1D = function updateAxis1D(pointer, axis1D, absX, absY) {
		const boundingBox = this.colourBoundingBoxes[axis1D];
		const [, relY] = getBoundingBoxRelativePosition(boundingBox, absX, absY);
		this.setState({
			[axis1D]: (-relY / 2) + 0.5,
		});
	};

	PadState.prototype.updateAxis2D = function updateAxis2D(pointer, axis2D, absX, absY) {
		const { downPosition, extentRadius } = this.activePointerInfoMap[pointer];

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

		this.setState({
			[`${axis2D}X`]: clampedX,
			[`${axis2D}Y`]: clampedY,
		});
	};

	//
	// State get.
	//
	PadState.prototype.getAndResetDeltaState = function getAndResetDeltaState() {
		const { deltaState } = this;
		this.deltaState = {};
		return deltaState;
	};

	//
	// React to pointer down/move/up.
	//
	PadState.prototype.onPointerDown = function onPointerDown(pointer, absX, absY) {
		// Get associated input.
		const rgba = this.sectionCanvasImage.getPixels(absX, absY, 1, 1).slice(0, 4);
		const imagePixelString = rgbaToPixelString(rgba);

		const dirpad = inputColours.dirpad[imagePixelString];
		const button = inputColours.button[imagePixelString];
		const axis1D = inputColours.axis1D[imagePixelString];
		const axis2D = inputColours.axis2D[imagePixelString];

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
		switch (inputType) {
		case 'dirpad': { this.updateDirpad(pointer, input, absX, absY); break; }
		case 'button': { this.updateButton(pointer, input, absX, absY); break; }
		case 'axis1D': { this.updateAxis1D(pointer, input, absX, absY); break; }
		case 'axis2D': { this.updateAxis2D(pointer, input, absX, absY); break; }
		default: { break; }
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
				switch (inputType) {
				case 'dirpad': { this.updateDirpad(pointer, input, absX, absY); break; }
				case 'axis1D': { this.updateAxis1D(pointer, input, absX, absY); break; }
				case 'axis2D': { this.updateAxis2D(pointer, input, absX, absY); break; }
				default: { break; }
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
		switch (inputType) {
		case 'dirpad': { this.resetDirpad(input); break; }
		case 'button': { this.resetButton(input); break; }
		case 'axis1D': { this.resetAxis1D(input); break; }
		case 'axis2D': { this.resetAxis2D(input); break; }
		default: { break; }
		}
	};

	return PadState;
}());
