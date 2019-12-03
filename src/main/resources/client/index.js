//
// Configuration.
//
const ADDRESS = `${new URL(window.location.href).hostname}/mobcontrol/`;
const UPDATES_PER_SECOND = 60;

const logElement = document.getElementById('log');
const logger = new Logger(logElement);

logger.log(UPDATES_PER_SECOND);

//
// Load the canvas, context.
//
const canvasParentDiv = document.getElementById('canvasParentDiv');
const hitboxCanvas = document.getElementById('hitboxCanvas');
const hitboxContext = hitboxCanvas.getContext('2d');
const overlayCanvas = document.getElementById('overlayCanvas');
const overlayContext = hitboxCanvas.getContext('2d');

const hitboxCanvasImage = new CanvasImage(hitboxCanvas);

//
// Canvas initialisation.
//
const axisBoundingBoxes = {
}

function resizeCanvases() {
    hitboxCanvas.width = canvasParentDiv.scrollWidth;
    hitboxCanvas.height = canvasParentDiv.scrollHeight;
    overlayCanvas.width = canvasParentDiv.scrollWidth;
    overlayCanvas.height = canvasParentDiv.scrollHeight;
}

function redrawCanvases() {
    // Draw the controller graphic.
    const hitboxSize = hitboxCanvasImage.getSize();
    hitboxContext.drawImage(hitboxImage, 0, 0, hitboxSize.w, hitboxSize.h);

    // Derive and store the bounding boxes of the 1D axis colours.
    for (const pixelString of Object.keys(axis1DColors)) {
        const axisId = axis1DColors[pixelString]
        const rgba = pixelStringToRgba(pixelString);
        axisBoundingBoxes[axisId] = hitboxCanvasImage.getRgbaBoundingBox(rgba);

        overlayContext.strokeStyle = 'yellow';
        overlayContext.lineWidth = 2;
        overlayContext.strokeRect(...axisBoundingBoxes[axisId]);
    }

    // Derive and store the bounding boxes of the 2D axis colours.
    for (const pixelString of Object.keys(axis2DColors)) {
        const axisId = axis2DColors[pixelString]
        const rgba = pixelStringToRgba(pixelString);
        axisBoundingBoxes[axisId] = hitboxCanvasImage.getRgbaBoundingBox(rgba);

        overlayContext.strokeStyle = 'yellow';
        overlayContext.lineWidth = 2;
        overlayContext.strokeRect(...axisBoundingBoxes[axisId]);
    }
}

function resizeCanvasAndDraw() {
    resizeCanvases();
    redrawCanvases();
}

//
// Load the image.
//
const hitboxImage = new Image;
hitboxImage.addEventListener('load', function() {
    resizeCanvasAndDraw();
}, false);
hitboxImage.src = './layout_logical.png';

window.addEventListener('resize', function() {
    resizeCanvasAndDraw();
})

//
// Define the buttons.
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

//
// Initialise state.
//
const buttonIds = Object.values(buttonColours);
const axis1DIds = Object.values(axis1DColors);
const axis2DIds = Object.values(axis2DColors);

const buttonState = {};
const axis1DState = {};
const axis2DState = {};

buttonIds.forEach(buttonId => { buttonState[buttonId] = false; });
axis1DIds.forEach(axisId => { axis1DState[axisId] = 0; });
axis2DIds.forEach(axisId => { axis1DState[`${axisId}X`] = 0; axis1DState[`${axisId}Y`] = 0; });

const pointerIdMapToId = {};

//
// State transmission.
//
const socket = new WebSocket(`ws://${ADDRESS}`);
function sendState() {
    const state = { ...buttonState, ...axis1DState, ...axis2DState };
    socket.send(JSON.stringify(state, null, 4));
}

//
// Send state at regular intervals.
//
setInterval(sendState, 1000 / UPDATES_PER_SECOND);

//
// On interaction start, add entry into pointer map, update button state.
//
function onPointerDown(ev) {
    const imagePixel = hitboxContext.getImageData(ev.clientX, ev.clientY, 1, 1).data;
    const imagePixelString = rgbaToPixelString(imagePixel.slice(0, 4));

    const buttonId = buttonColours[imagePixelString];
    if (buttonId) {
        pointerIdMapToId[ev.pointerId] = buttonId;

        buttonState[buttonId] = true;
        sendState();
    }

    const axis1DId = axis1DColors[imagePixelString];
    if (axis1DId) {
        pointerIdMapToId[ev.pointerId] = axis1DId;
    }

    const axis2DId = axis2DColors[imagePixelString];
    if (axis2DId) {
        pointerIdMapToId[ev.pointerId] = axis2DId;
    }
}

hitboxCanvas.onpointerdown = (ev) => { onPointerDown(ev); };

//
// On interaction move, update axis state.
//
function onPointerMove(ev) {
    const imagePixel = hitboxContext.getImageData(ev.clientX, ev.clientY, 1, 1).data;
    const imagePixelString = rgbaToPixelString(imagePixel.slice(0, 4));

    const axis1DId = axis1DColors[imagePixelString];
    const axis2DId = axis2DColors[imagePixelString];
    const axisId = axis1DId || axis2DId;

    if (axisId) {
        const pointedAxisId = pointerIdMapToId[ev.pointerId];

        if (axisId === pointedAxisId) {
            const bb = axisBoundingBoxes[axisId];
            if (bb) {
                const [x,y,w,h] = bb;
                const centerX = x + (w/2);
                const centerY = y + (h/2);
                const relX = (ev.clientX - centerX) / (w/2);
                const relY = (ev.clientY - centerY) / (h/2);

                if (axis1DId) {
                    axis1DState[axis1DId] = relY;
                }

                if (axis2DId) {
                    axis2DState[`${axis2DId}X`] = relX;
                    axis2DState[`${axis2DId}Y`] = relY;
                }
            }
        }
    }

    if (axisId) {
        sendState();
    }
}

hitboxCanvas.onpointermove = (ev) => { onPointerMove(ev); };

//
// On interaction end, remove entry from pointer map, reset relevant state.
//
hitboxCanvas.onpointerup = (ev) => {
    const pointedId = pointerIdMapToId[ev.pointerId];
    logger.log("Button up:", pointedId);

    if (buttonIds.includes(pointedId)) {
        buttonState[pointedId] = false;
    }

    if (axis1DIds.includes(pointedId)) {
        axis1DState[pointedId] = 0;
    }

    if (axis2DIds.includes(pointedId)) {
        axis2DState[`${pointedId}X`] = 0;
        axis2DState[`${pointedId}Y`] = 0;
    }

    delete pointerIdMapToId[ev.pointerId];

    sendState();
};
