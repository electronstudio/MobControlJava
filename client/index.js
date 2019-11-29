//
// Configuration.
//
const ADDRESS = 'localhost:80/mobcontrol/';
const UPDATES_PER_SECOND = 60; // Set to 60 at some point.

//
// Load the canvas, context.
//
const hitboxCanvas = document.getElementById('hitboxCanvas');
const hitboxContext = hitboxCanvas.getContext('2d');

//
// Load the image.
//
const hitboxImage = new Image;
hitboxImage.addEventListener('load', function() {
    hitboxContext.drawImage(hitboxImage, 0, 0, hitboxCanvas.width, hitboxCanvas.height);
}, false);
hitboxImage.src = './layout_logical.png';

//
// Define the buttons.
//
const buttonColours = {
    '255,255,0,255': 'BUTTON_A',
    '255,255,1,255': 'BUTTON_B',
    '255,255,2,255': 'BUTTON_X',
    '255,255,3,255': 'BUTTON_Y',
    '255,255,4,255': 'BUTTON_BACK',
    '255,255,5,255': 'BUTTON_GUIDE',
    '255,255,6,255': 'BUTTON_START',
    '255,255,7,255': 'BUTTON_LEFTSTICK',
    '255,255,8,255': 'BUTTON_RIGHTSTICK',
    '255,255,9,255': 'BUTTON_LEFTSHOULDER',
    '255,255,0,255': 'BUTTON_RIGHTSHOULDER',
    '255,255,11,255': 'BUTTON_DPAD_UP',
    '255,255,12,255': 'BUTTON_DPAD_DOWN',
    '255,255,13,255': 'BUTTON_DPAD_LEFT',
    '255,255,14,255': 'BUTTON_DPAD_RIGHT',
};

//
// Initialise state.
//
const buttonIds = Object.values(buttonColours);
const buttonState = {};
buttonIds.forEach(buttonId => { buttonState[buttonId] = false; })

//
// Update state when button press and release.
//
function onCanvasInteraction(ev, activate) {
    const imageX = (ev.clientX / hitboxCanvas.scrollWidth) * hitboxCanvas.width;
    const imageY = (ev.clientY / hitboxCanvas.scrollHeight) * hitboxCanvas.height;
    var imagePixel = hitboxContext.getImageData(imageX, imageY, 1, 1).data;
    var imagePixelString = imagePixel.join(',');
    var buttonId = buttonColours[imagePixelString];
    if (buttonId) { buttonState[buttonId] = activate; }
    console.log(buttonId);
}

hitboxCanvas.onmousedown = (ev) => { onCanvasInteraction(ev, true); }
hitboxCanvas.ontouchend = (ev) => { onCanvasInteraction(ev, false); }
hitboxCanvas.onmousedown = (ev) => { onCanvasInteraction(ev, true); }
hitboxCanvas.onmouseup = (ev) => { onCanvasInteraction(ev, false); }

//
// Transmit padState on regular intervals.
//
const socket = new WebSocket(`ws://${ADDRESS}`);
setInterval(() => {
    socket.send(JSON.stringify(buttonState, null, 4));
}, 1000 / UPDATES_PER_SECOND);
