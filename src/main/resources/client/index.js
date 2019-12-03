//
// Configuration.
//
const ADDRESS = `${new URL(window.location.href).hostname}/mobcontrol/`;
const UPDATES_PER_SECOND = 60;

//
// Get HTML elements.
//
const canvasParentDiv = document.getElementById('canvasParentDiv');
const hitboxCanvas = document.getElementById('hitboxCanvas');
const overlayCanvas = document.getElementById('overlayCanvas');
const logElement = document.getElementById('log');

//
// Initialise utilities.
//
const hitboxCanvasImage = new CanvasImage(hitboxCanvas);
const padState = new PadState(hitboxCanvasImage);
const logger = new Logger(logElement);
logger.log(UPDATES_PER_SECOND);

//
// Redraw.
//
function redraw() {
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
    redraw();
}, false);
hitboxImage.src = './layout_logical.png';

window.addEventListener('resize', function() {
    redraw();
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
// React to user interaction.
//
hitboxCanvas.onpointerdown = (ev) => {
    const imagePixel = hitboxCanvasImage.getPixels(ev.clientX, ev.clientY, 1, 1).slice(0, 4);
    padState.onPointerDown(imagePixel, ev.pointerId);
    sendState();
 };

hitboxCanvas.onpointermove = (ev) => {
    const imagePixel = hitboxCanvasImage.getPixels(ev.clientX, ev.clientY, 1, 1).slice(0, 4);
    padState.onPointerMove(imagePixel, ev.pointerId, ev.clientX, ev.clientY);
    sendState();
};

hitboxCanvas.onpointerup = (ev) => {
    padState.onPointerUp(ev.pointerId);
    sendState();
};
