/**
 * PadState
 *
 * Encapsulates the data structure that represents the pad state.
 * Stores a graphic representing coloured hitbox regions for each pad input.
 * Updates the state based on pointer up/move/down events on the graphic.
 */

//
// Expected colours, for each input type.
//
const buttonColours = {
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
    '63,11,10,255': 'BUTTON_DPAD_UP',
    '48,58,48,255': 'BUTTON_DPAD_DOWN',
    '61,49,39,255': 'BUTTON_DPAD_LEFT',
    '46,41,58,255': 'BUTTON_DPAD_RIGHT',
};

const axis1DColours = {
    '255,255,255,255': 'AXIS_TRIGGERLEFT',
    '0,0,0,255': 'AXIS_TRIGGERRIGHT',
};

const axis2DColours = {
    '255,0,0,255': 'AXIS_LEFT',
    '0,255,242,255': 'AXIS_RIGHT',
};

//
// IDs for each input, for convenience.
//
const buttons = Object.values(buttonColours);
const axis1Ds = Object.values(axis1DColours);
const axis2Ds = Object.values(axis2DColours);

//
// RGBA serialisation.
//
function pixelStringToRgba(pixelString) {
    return pixelString.split(',').map((x) => parseInt(x, 10));
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
function PadState(hitboxCanvasImage) {
    // Underlying image that defines where each button is.
	this.hitboxCanvasImage = hitboxCanvasImage;

    // State of the pad.
	this.buttonState = {};
	this.axis1DState = {};
	this.axis2DState = {};

    // Cache of active pointers to associated input.
    this.pointerToPointerDownInput = {};

    // Cache of bounding boxes for axis-inputs.
    this.axisBoundingBoxes = {};

    this.initialiseState();
}

PadState.prototype.initialiseState = function() {
	buttons.forEach(button => {
        this.buttonState[button] = false;
    });

	axis1Ds.forEach(axis => {
        this.axis1DState[axis] = 0;
    });

	axis2Ds.forEach(axis => {
        this.axis1DState[`${axis}X`] = 0;
        this.axis1DState[`${axis}Y`] = 0;
    });
}

PadState.prototype.initAxisBoundingBoxes = function() {
    // Derive and store the bounding boxes of the 1D axis colours.
    for (const pixelString of Object.keys(axis1DColours)) {
        const axis = axis1DColours[pixelString]
        const rgba = pixelStringToRgba(pixelString);
        this.axisBoundingBoxes[axis] = hitboxCanvasImage.getRgbaBoundingBox(rgba);
    }

    // Derive and store the bounding boxes of the 2D axis colours.
    for (const pixelString of Object.keys(axis2DColours)) {
        const axis = axis2DColours[pixelString]
        const rgba = pixelStringToRgba(pixelString);
        this.axisBoundingBoxes[axis] = hitboxCanvasImage.getRgbaBoundingBox(rgba);
    }
}

PadState.prototype.getAxisBoundingBoxes = function() {
    return Object.values(this.axisBoundingBoxes);
}

//
// React to pointer down/move/up.
//
PadState.prototype.onPointerDown = function(rgba, pointer) {
    // Find the associated input.
    const imagePixelString = rgbaToPixelString(rgba);
    const button = buttonColours[imagePixelString];
    const axis1D = axis1DColours[imagePixelString];
    const axis2D = axis2DColours[imagePixelString];

    const input = button || axis1D || axis2D;

    // Set state, according to the input type.
    if (button) {
        this.buttonState[button] = true;
    }

    if (axis1D) {
        // TODO: Update state.
    }

    if (axis2D) {
        // TODO: Update state.
    }

    // Update the pointer cache.
    if (input) {
        this.pointerToPointerDownInput[pointer] = input;
    }
}

PadState.prototype.onPointerMove = function(rgba, pointer, absX, absY) {
    const imagePixelString = rgbaToPixelString(rgba);

    // Find which axis is relevant to where the pointer moved to.
    const axis1D = axis1DColours[imagePixelString];
    const axis2D = axis2DColours[imagePixelString];
    const pointerMoveAxis = axis1D || axis2D;

    // If an axis was relevant...
    if (pointerMoveAxis) {
        const pointerDownInput = this.pointerToPointerDownInput[pointer];

        // If the move is still within the boundary of the initial interaction...
        if (pointerMoveAxis === pointerDownInput) {
            const boundingBox = this.axisBoundingBoxes[pointerMoveAxis];

            // If there have an associated bounding box... (no reason why there shouldn't be)
            if (boundingBox) {
                const [relX, relY] = getBoundingBoxRelativePosition(boundingBox, absX, absY);

                if (axis1D) {
                    this.axis1DState[axis1D] = -relY;
                }

                if (axis2D) {
                    this.axis2DState[`${axis2D}X`] = relX;
                    this.axis2DState[`${axis2D}Y`] = -relY;
                }
            }
        }
    }
}

PadState.prototype.onPointerUp = function(pointer) {
    // Find the original input.
    const pointerDownInput = this.pointerToPointerDownInput[pointer];

    // Reset the state, according to the input type.
    if (buttons.includes(pointerDownInput)) {
        this.buttonState[pointerDownInput] = false;
    }

    if (axis1Ds.includes(pointerDownInput)) {
        this.axis1DState[pointerDownInput] = 0;
    }

    if (axis2Ds.includes(pointerDownInput)) {
        this.axis2DState[`${pointerDownInput}X`] = 0;
        this.axis2DState[`${pointerDownInput}Y`] = 0;
    }

    // Reset the pointer cache.
    delete this.pointerToPointerDownInput[pointer];
}

PadState.prototype.getState = function() {
	return {
        ...this.buttonState,
        ...this.axis1DState,
        ...this.axis2DState,
    };
}
