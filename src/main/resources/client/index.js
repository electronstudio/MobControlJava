//
// Configuration.
//
const ADDRESS = `${new URL(window.location.href).hostname}/mobcontrol/`;
const UPDATES_PER_SECOND = 60; // Set to 60 at some point.

//
// Logging.
//
const logElement = document.getElementById('log');
function log(line) {
    if (logElement) {
        logElement.innerHTML = line + '\n' + logElement.innerHTML;
    }
}

log(UPDATES_PER_SECOND);

//
// Load the canvas, context.
//
const hitboxParentDiv = document.getElementById('hitboxParentDiv');
const hitboxCanvas = document.getElementById('hitboxCanvas');
const hitboxContext = hitboxCanvas.getContext('2d');

function resizeCanvasAndDraw() {
    hitboxCanvas.width = hitboxParentDiv.scrollWidth;
    hitboxCanvas.height = hitboxParentDiv.scrollHeight;
    hitboxContext.drawImage(hitboxImage, 0, 0, hitboxCanvas.scrollWidth, hitboxCanvas.scrollHeight);
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

//
// Initialise state.
//
const buttonIds = Object.values(buttonColours);
const buttonState = {};
buttonIds.forEach(buttonId => { buttonState[buttonId] = false; });
const pointerIdMapToButtonId = {};

//
// State transmission.
//
const socket = new WebSocket(`ws://${ADDRESS}`);
function sendState() {
    socket.send(JSON.stringify(buttonState, null, 4));
}

//
// Send state at regular intervals.
//
setInterval(sendState, 1000 / UPDATES_PER_SECOND);

//
// Update state on interaction.
//
function onCanvasInteraction(ev, activate) {
    //log(JSON.stringify(ev));
    const imageX = (ev.clientX / hitboxCanvas.scrollWidth) * hitboxCanvas.width;
    const imageY = (ev.clientY / hitboxCanvas.scrollHeight) * hitboxCanvas.height;
    //log(imageX, imageY)

    const imagePixel = hitboxContext.getImageData(imageX, imageY, 1, 1).data;
    const imagePixelString = imagePixel.slice(0, 4).join(',');
    //log(imagePixelString)

    const buttonId = buttonColours[imagePixelString];
    if (buttonId) {
        buttonState[buttonId] = activate;
        pointerIdMapToButtonId[ev.pointerId] = buttonId;
        log("Button down: "+buttonId);
        sendState();
    }


}

hitboxCanvas.onpointerdown = (ev) => { onCanvasInteraction(ev, true); };

hitboxCanvas.onpointerup = (ev) => {
    log("Button up: "+pointerIdMapToButtonId[ev.pointerId]);
    buttonState[pointerIdMapToButtonId[ev.pointerId]] = false;
    delete pointerIdMapToButtonId[ev.pointerId];
    sendState();
};
