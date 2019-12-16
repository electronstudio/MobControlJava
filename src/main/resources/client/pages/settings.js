/**
 * Settings Page
 */

const selectableColours = [
	'#000000',
	'#493c2b',
	'#be2633',
	'#e06f8b',
	'#9d9d9d',
	'#a46422',
	'#eb8931',
	'#f7e26b',
	'#ffffff',
	'#1b2632',
	'#2f484e',
	'#44891a',
	'#a3ce27',
	'#005784',
	'#31a2f2',
	'#b2dcef',
];

export default class SettingsPage {
	constructor(conn, padPage, onPadPageRequested) {
		this.conn = conn;
		this.padPage = padPage;
		this.onPadPageRequested = onPadPageRequested;

		this.initName();
		this.initColour(1);
		this.initColour(2);
		this.initStickSensitivity();
		this.initShowPadButton();
	}

	initName() {
		const nameInput = document.getElementById('name');
		nameInput.oninput = (ev) => {
			const name = ev.target.value;
			this.sendEventSetName(name);
		};
	}

	initColour(index) {
		const prefix = `colour${index}`;
		const swatch = document.getElementById(`${prefix}Swatch`);
		const selectButtons = document.getElementById(`${prefix}SelectButtons`);

		selectButtons.innerHTML = ''; // Remove all example children.
		selectableColours.forEach((selectableColour) => {
			const child = document.createElement('div');
			child.className = 'colour-select';
			child.style['background-color'] = selectableColour;
			selectButtons.appendChild(child);
		});

		selectButtons.childNodes.forEach((selectButton) => {
			selectButton.onclick = () => {
				const color = selectButton.style['background-color'];
				swatch.style['background-color'] = color;
				this.sendEventSetColour(index, color);
			};
		});
	}

	initStickSensitivity() {
		const slider = document.getElementById('stickSensitivity');
		const padState = this.padPage.getPadState();
		const initialSensitivity = padState.getAnalogStickSensitivity();
		slider.value = initialSensitivity * 100;

		slider.oninput = (ev) => {
			const sensitivity = ev.target.value / 100;
			this.sendEventSetSensitivity(sensitivity);
		};
	}

	initShowPadButton() {
		const showPadButton = document.getElementById('showPadButton');
		showPadButton.onclick = (ev) => {
			this.onPadPageRequested();
		};
	}

	sendEventSetName(name) {
		const data = {
			__type__: 'set_name',
			name,
		};
		const json = JSON.stringify(data, null, 4);
		this.conn.send(json);
	}

	sendEventSetColour(index, colour) {
		const rgb = colour.match(/\d+/g);
		const data = {
			__type__: `set_colour_${index}`,
			rgb,
		};
		const json = JSON.stringify(data, null, 4);
		this.conn.send(json);
	}

	sendEventSetSensitivity(sensitivity) {
		const padState = this.padPage.getPadState();
		padState.setAnalogStickSensitivity(sensitivity);
	}
}
