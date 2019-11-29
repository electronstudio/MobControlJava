const ADDRESS = 'localhost:80/mobcontrol/';
const UPDATES_PER_SECOND = 1; // Set to 60 at some point.

const buttonContainer = document.getElementById('buttonContainer');
const socket = new WebSocket(`ws://${ADDRESS}`);

const buttonNames = [
    'SDL_CONTROLLER_BUTTON_A',
    'SDL_CONTROLLER_BUTTON_B',
    'SDL_CONTROLLER_BUTTON_X',
    'SDL_CONTROLLER_BUTTON_Y',
    'SDL_CONTROLLER_BUTTON_BACK',
    'SDL_CONTROLLER_BUTTON_GUIDE',
    'SDL_CONTROLLER_BUTTON_START',
    'SDL_CONTROLLER_BUTTON_LEFTSTICK',
    'SDL_CONTROLLER_BUTTON_RIGHTSTICK',
    'SDL_CONTROLLER_BUTTON_LEFTSHOULDER',
    'SDL_CONTROLLER_BUTTON_RIGHTSHOULDER',
    'SDL_CONTROLLER_BUTTON_DPAD_UP',
    'SDL_CONTROLLER_BUTTON_DPAD_DOWN',
    'SDL_CONTROLLER_BUTTON_DPAD_LEFT',
    'SDL_CONTROLLER_BUTTON_DPAD_RIGHT',
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
