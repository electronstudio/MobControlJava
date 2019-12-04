/**
 * PadState
 *
 * Encapsulates the data structure that represents the pad state.
 * Stores a graphic representing coloured hitbox sections for each pad input.
 * Updates the state based on pointer up/move/down events on the graphic.
 */

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
}

function getInputTypeFromInputId(inputId) {
	for (const inputType of Object.keys(inputColours)) {
		const inputColoursOfType = inputColours[inputType];
		const inputIdsOfType = Object.values(inputColoursOfType);
		if (inputIdsOfType.includes(inputId)) {
			return inputType;
		}
	}
	return 'unknown';
}

//
// RGBA serialisation.
//
function pixelStringToRgbas(pixelString) {
	const rgbaStrings = pixelString.split('|');
	const rgbaStringToRgba = (x) => x.split(',').map((x) => parseInt(x, 10));
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
	const [x,y,w,h] = boundingBox;
	const centerX = x + (w/2);
	const centerY = y + (h/2);
	const relX = (absX - centerX) / (w/2);
	const relY = (absY - centerY) / (h/2);
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

PadState.prototype.setState = function(partialState) {
	this.deltaState = { ...this.deltaState, ...partialState };
};

//
// Bounding box init.
//
PadState.prototype.initAxisBoundingBoxes = function() {
	// Derive and store the bounding boxes of the dirpad colours.
	for (const pixelString of Object.keys(inputColours.dirpad)) {
		const dirpad = inputColours.dirpad[pixelString]
		const rgbas = pixelStringToRgbas(pixelString);
		this.colourBoundingBoxes[dirpad] = sectionCanvasImage.getRgbasBoundingBox(rgbas);
	}

	// Derive and store the bounding boxes of the 1D axis colours.
	for (const pixelString of Object.keys(inputColours.axis1D)) {
		const axis = inputColours.axis1D[pixelString]
		const rgbas = pixelStringToRgbas(pixelString);
		this.colourBoundingBoxes[axis] = sectionCanvasImage.getRgbasBoundingBox(rgbas);
	}

	// Derive and store the bounding boxes of the 2D axis colours.
	for (const pixelString of Object.keys(inputColours.axis2D)) {
		const axis = inputColours.axis2D[pixelString]
		const rgbas = pixelStringToRgbas(pixelString);
		this.colourBoundingBoxes[axis] = sectionCanvasImage.getRgbasBoundingBox(rgbas);
	}
}

//
// Bounding box get.
//
PadState.prototype.getAxisBoundingBoxes = function() {
	return Object.values(this.colourBoundingBoxes);
}

PadState.prototype.getActivePointerInfos = function() {
	return Object.values(this.activePointerInfoMap);
}

//
// State reset.
//
PadState.prototype.resetDirpad = function(dirpad) {
	this.setState({
		[`${dirpad}_LEFT`]: 0,
		[`${dirpad}_RIGHT`]: 0,
		[`${dirpad}_UP`]: 0,
		[`${dirpad}_DOWN`]: 0,
	});
}

PadState.prototype.resetButton = function(button) {
	this.setState({
		[button]: false,
	});
}

PadState.prototype.resetAxis1D = function(axis1D) {
	this.setState({
		[axis1D]: 0,
	});
}

PadState.prototype.resetAxis2D = function(axis2D) {
	this.setState({
		[`${axis2D}X`]: 0,
		[`${axis2D}Y`]: 0,
	});
}

PadState.prototype.resetState = function() {
	Object.values(inputColours.dirpad).forEach(dirpad => { this.resetDirpad(dirpad); });
	Object.values(inputColours.button).forEach(button => { this.resetButton(button); });
	Object.values(inputColours.axis1D).forEach(axis1D => { this.resetAxis1D(axis1D); });
	Object.values(inputColours.axis2D).forEach(axis2D => { this.resetAxis2D(axis2D); });
}

//
// State update.
//
PadState.prototype.updateDirpad = function(pointer, dirpad, absX, absY) {
	const boundingBox = this.colourBoundingBoxes[dirpad];
	const [relX, relY] = getBoundingBoxRelativePosition(boundingBox, absX, absY);

	const deadZone = 0.3;
	this.setState({
		[`${dirpad}_LEFT`]: relX < -deadZone,
		[`${dirpad}_RIGHT`]:relX > +deadZone,
		[`${dirpad}_UP`]: relY < -deadZone,
		[`${dirpad}_DOWN`]: relY > +deadZone,
	});
}

PadState.prototype.updateButton = function(pointer, button, absX, absY) {
	this.setState({
		[button]: true,
	});
}

PadState.prototype.updateAxis1D = function(pointer, axis1D, absX, absY) {
	const boundingBox = this.colourBoundingBoxes[axis1D];
	const [relX, relY] = getBoundingBoxRelativePosition(boundingBox, absX, absY);
	this.setState({
		[axis1D]: (-relY / 2) + 0.5,
	});
}

PadState.prototype.updateAxis2D = function(pointer, axis2D, absX, absY) {
	const { downPosition, extentRadius } = this.activePointerInfoMap[pointer];

	const boundingBox = [
		downPosition.absX - extentRadius,
		downPosition.absY - extentRadius,
		extentRadius * 2,
		extentRadius * 2,
	];

	const [relX, relY] = getBoundingBoxRelativePosition(boundingBox, absX, absY);
	this.setState({
		[`${axis2D}X`]: relX,
		[`${axis2D}Y`]: -relY,
	});
}

//
// State get.
//
PadState.prototype.getAndResetDeltaState = function() {
	const deltaState = this.deltaState;
	this.deltaState = {};
	return deltaState;
}

//
// React to pointer down/move/up.
//
PadState.prototype.onPointerDown = function(pointer, absX, absY) {
	const rgba = sectionCanvasImage.getPixels(absX, absY, 1, 1).slice(0, 4);
	const imagePixelString = rgbaToPixelString(rgba);

	// Get associated input.
	const dirpad = inputColours.dirpad[imagePixelString];
	const button = inputColours.button[imagePixelString];
	const axis1D = inputColours.axis1D[imagePixelString];
	const axis2D = inputColours.axis2D[imagePixelString];
	const input = dirpad || button || axis1D || axis2D;

	// Update pointer cache.
	if (input) {
		this.activePointerInfoMap[pointer] = {
			input,
			downPosition: {
				absX,
				absY,
			},
			extentRadius: axis2D && 200,
		};
	}

	// Update state.
	const inputType = getInputTypeFromInputId(input);

	switch(inputType) {
		case 'dirpad': { this.updateDirpad(pointer, input, absX, absY); break; }
		case 'button': { this.updateButton(pointer, input, absX, absY); break; }
		case 'axis1D': { this.updateAxis1D(pointer, input, absX, absY); break; }
		case 'axis2D': { this.updateAxis2D(pointer, input, absX, absY); break; }
		default: {}
	}
}

PadState.prototype.onPointerMove = function(pointer, absX, absY) {
	// Which input did the pointer start from?
	const pointerInfo = this.activePointerInfoMap[pointer];
	const pointerDownInput = pointerInfo && pointerInfo.input;
	if (!pointerDownInput) {
		return;
	}

	// What is the input type?
	const inputType = getInputTypeFromInputId(pointerDownInput);
	const legalMove = ['dirpad', 'axis1D', 'axis2D'].includes(inputType);
	if (legalMove) {
		Object.assign(this.activePointerInfoMap[pointer], {
			movePosition: {
				absX,
				absY,
			},
		});

		switch(inputType) {
			case 'dirpad': { this.updateDirpad(pointer, pointerDownInput, absX, absY); break; }
			case 'axis1D': { this.updateAxis1D(pointer, pointerDownInput, absX, absY); break; }
			case 'axis2D': { this.updateAxis2D(pointer, pointerDownInput, absX, absY); break; }
			default: {}
		}
	}
}

PadState.prototype.onPointerUp = function(pointer) {
	// Get associated input.
	const pointerDownInput = this.activePointerInfoMap[pointer].input;

	// Update state.
	const inputType = getInputTypeFromInputId(pointerDownInput);

	switch(inputType) {
		case 'dirpad': { this.resetDirpad(pointerDownInput); break; }
		case 'button': { this.resetButton(pointerDownInput); break; }
		case 'axis1D': { this.resetAxis1D(pointerDownInput); break; }
		case 'axis2D': { this.resetAxis2D(pointerDownInput); break; }
		default: {}
	}

	// Update pointer cache.
	delete this.activePointerInfoMap[pointer];
}
