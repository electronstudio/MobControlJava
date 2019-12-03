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

const axis1DColors = {
    '255,255,255,255': 'AXIS_TRIGGERLEFT',
    '0,0,0,255': 'AXIS_TRIGGERRIGHT',
};

const axis2DColors = {
    '255,0,0,255': 'AXIS_LEFT',
    '0,255,242,255': 'AXIS_RIGHT',
};

function pixelStringToRgba(pixelString) {
    return pixelString.split(',').map((x) => parseInt(x, 10));
}

function rgbaToPixelString(rgba) {
    return rgba.join(',');
}

function getBoundingBoxRelativePosition(boundingBox, absX, absY) {
    const [x,y,w,h] = boundingBox;
    const centerX = x + (w/2);
    const centerY = y + (h/2);
    const relX = (absX - centerX) / (w/2);
    const relY = (absY - centerY) / (h/2);
    return [relX, relY];
}

function PadState(hitboxCanvasImage) {
	this.hitboxCanvasImage = hitboxCanvasImage;

	this.buttonIds = Object.values(buttonColours);
	this.axis1DIds = Object.values(axis1DColors);
	this.axis2DIds = Object.values(axis2DColors);

	this.buttonState = {};
	this.axis1DState = {};
	this.axis2DState = {};

	this.buttonIds.forEach(buttonId => {
        this.buttonState[buttonId] = false;
    });

	this.axis1DIds.forEach(axisId => {
        this.axis1DState[axisId] = 0;
    });

	this.axis2DIds.forEach(axisId => {
        this.axis1DState[`${axisId}X`] = 0;
        this.axis1DState[`${axisId}Y`] = 0;
    });

	this.pointerIdMapToId = {};
	this.axisBoundingBoxes = {};
}

PadState.prototype.initAxisBoundingBoxes = function() {
    // Derive and store the bounding boxes of the 1D axis colours.
    for (const pixelString of Object.keys(axis1DColors)) {
        const axisId = axis1DColors[pixelString]
        const rgba = pixelStringToRgba(pixelString);
        this.axisBoundingBoxes[axisId] = hitboxCanvasImage.getRgbaBoundingBox(rgba);
    }

    // Derive and store the bounding boxes of the 2D axis colours.
    for (const pixelString of Object.keys(axis2DColors)) {
        const axisId = axis2DColors[pixelString]
        const rgba = pixelStringToRgba(pixelString);
        this.axisBoundingBoxes[axisId] = hitboxCanvasImage.getRgbaBoundingBox(rgba);
    }
}

PadState.prototype.getAxisBoundingBoxes = function() {
    return Object.values(this.axisBoundingBoxes);
}

PadState.prototype.onPointerDown = function(rgba, pointerId) {
    const imagePixelString = rgbaToPixelString(rgba);

    const buttonId = buttonColours[imagePixelString];
    if (buttonId) {
        this.pointerIdMapToId[pointerId] = buttonId;
        this.buttonState[buttonId] = true;
    }

    const axis1DId = axis1DColors[imagePixelString];
    if (axis1DId) {
        this.pointerIdMapToId[pointerId] = axis1DId;
    }

    const axis2DId = axis2DColors[imagePixelString];
    if (axis2DId) {
        this.pointerIdMapToId[pointerId] = axis2DId;
    }
}

PadState.prototype.onPointerMove = function(rgba, pointerId, absX, absY) {
    const imagePixelString = rgbaToPixelString(rgba);

    const axis1DId = axis1DColors[imagePixelString];
    const axis2DId = axis2DColors[imagePixelString];
    const axisId = axis1DId || axis2DId;

    if (axisId) {
        const pointedAxisId = this.pointerIdMapToId[pointerId];

        if (axisId === pointedAxisId) {
            const bb = this.axisBoundingBoxes[axisId];
            if (bb) {
                const [relX, relY] = getBoundingBoxRelativePosition(bb, absX, absY);

                if (axis1DId) {
                    this.axis1DState[axis1DId] = relY;
                }

                if (axis2DId) {
                    this.axis2DState[`${axis2DId}X`] = relX;
                    this.axis2DState[`${axis2DId}Y`] = relY;
                }
            }
        }
    }
}

PadState.prototype.onPointerUp = function(pointerId) {
    const pointedId = this.pointerIdMapToId[pointerId];

    if (this.buttonIds.includes(pointedId)) {
        this.buttonState[pointedId] = false;
    }

    if (this.axis1DIds.includes(pointedId)) {
        this.axis1DState[pointedId] = 0;
    }

    if (this.axis2DIds.includes(pointedId)) {
        this.axis2DState[`${pointedId}X`] = 0;
        this.axis2DState[`${pointedId}Y`] = 0;
    }

    delete this.pointerIdMapToId[pointerId];
}

PadState.prototype.getState = function() {
	return { ...this.buttonState, ...this.axis1DState, ...this.axis2DState };
}
