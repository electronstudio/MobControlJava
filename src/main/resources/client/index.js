//
// Configuration.
//
const ADDRESS = `${new URL(window.location.href).hostname}/mobcontrol/`;
const UPDATES_PER_SECOND = 60;

const logElement = document.getElementById('log');
const logger = new Logger(logElement);

logger.log(UPDATES_PER_SECOND);

//
// Get HTML elements.
//
const canvasParentDiv = document.getElementById('canvasParentDiv');
const hitboxCanvas = document.getElementById('hitboxCanvas');
const overlayCanvas = document.getElementById('overlayCanvas');

//
// Initialise utilities.
//
const hitboxCanvasImage = new CanvasImage(hitboxCanvas);
const padState = new PadState(hitboxCanvasImage);

//
// Calibration.
//
function calibrate() {
    // Align canvas elements with the guide parent.
    hitboxCanvas.width = canvasParentDiv.scrollWidth;
    hitboxCanvas.height = canvasParentDiv.scrollHeight;
    overlayCanvas.width = canvasParentDiv.scrollWidth;
    overlayCanvas.height = canvasParentDiv.scrollHeight;

    // Draw the image.
    hitboxCanvasImage.drawImage(hitboxImage);

    // Initialise bounding boxes based on what we've drawn.
    padState.initAxisBoundingBoxes();

    // Draw bounding boxes just for visual verification.
    padState.getAxisBoundingBoxes().forEach((boundingBox) => {
        hitboxCanvasImage.context.strokeStyle = 'red';
        hitboxCanvasImage.context.lineWidth = 2;
        hitboxCanvasImage.context.strokeRect(...boundingBox);
    });
}

//
// Load the image.
//
const hitboxImage = new Image;
hitboxImage.addEventListener('load', function() {
    calibrate();
}, false);
hitboxImage.src = './layout_logical.png';

window.addEventListener('resize', function() {
    calibrate();
})

//
// State transmission.
//
const socket = new WebSocket(`ws://${ADDRESS}`);
function sendState() {
    const state = padState.getState();
    socket.send(JSON.stringify(state, null, 4));
}

//
// Send state at regular intervals.
//
setInterval(sendState, 1000 / UPDATES_PER_SECOND);

//
// On interaction start, add entry into pointer map, update button state.
//
hitboxCanvas.onpointerdown = (ev) => {
    const imagePixel = hitboxCanvasImage.getPixels(ev.clientX, ev.clientY, 1, 1).slice(0, 4);
    padState.onPointerDown(imagePixel, ev.pointerId);
    sendState();
 };

//
// On interaction move, update axis state.
//

hitboxCanvas.onpointermove = (ev) => {
    const imagePixel = hitboxCanvasImage.getPixels(ev.clientX, ev.clientY, 1, 1).slice(0, 4);
    padState.onPointerMove(imagePixel, ev.pointerId, ev.clientX, ev.clientY);
    sendState();
};

//
// On interaction end, remove entry from pointer map, reset relevant state.
//
hitboxCanvas.onpointerup = (ev) => {
    padState.onPointerUp(ev.pointerId);
    sendState();
};
