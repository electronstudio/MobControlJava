const ADDRESS = 'localhost:80/mobcontrol/';
const UPDATES_PER_SECOND = 1; // Set to 60 at some point.

const buttonContainer = document.getElementById('buttonContainer');
const socket = new WebSocket(`ws://${ADDRESS}`);

const buttonNames = [
    'BUTTON_A',
    'BUTTON_B',
    'BUTTON_X',
    'BUTTON_Y',
    'BUTTON_BACK',
    'BUTTON_GUIDE',
    'BUTTON_START',
    'BUTTON_LEFTSTICK',
    'BUTTON_RIGHTSTICK',
    'BUTTON_LEFTSHOULDER',
    'BUTTON_RIGHTSHOULDER',
    'BUTTON_DPAD_UP',
    'BUTTON_DPAD_DOWN',
    'BUTTON_DPAD_LEFT',
    'BUTTON_DPAD_RIGHT',
];

const buttonState = {};

function getButton(id) {
    const element = document.createElement('div');
    element.innerText = id;
    element.ontouchstart = () => { buttonState[id] = true; console.log(buttonState) };
    element.ontouchend = () => { buttonState[id] = false; console.log(buttonState) };
    element.onmousedown = () => { buttonState[id] = true; console.log(buttonState) };
    element.onmouseup = () => { buttonState[id] = false; console.log(buttonState) };

    return {
        id,
        element,
    };
}

const buttons = buttonNames.map(getButton);

buttons.forEach(button => {
    buttonContainer.appendChild(button.element);
})

setInterval(() => {
    socket.send(JSON.stringify(buttonState, null, 4));
}, 1000 / UPDATES_PER_SECOND);
