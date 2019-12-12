/**
 * Settings Page
 */

const selectableColours = [
	// TODO: Replace with hex, or whichever format is required.
	'WHITE',
	'SILVER',
	'GRAY',
	'BLACK',
	'RED',
	'MAROON',
	'YELLOW',
	'OLIVE',
	'LIME',
	'GREEN',
	'AQUA',
	'TEAL',
	'BLUE',
	'NAVY',
	'FUCHSIA',
	'PURPLE',
];

export default class SettingsPage {
	constructor(conn, padPage) {
		this.conn = conn;
		this.padPage = padPage;
		this.initName();
		this.initColour(1);
		this.initColour(2);
		this.initStickSensitivity();
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

	sendEventSetName(name) {
		this.conn.send({
			__type__: 'set_name',
			name,
		});
	}

	sendEventSetColour(index, colour) {
		this.conn.send({
			__type__: `set_colour_${index}`,
			colour,
		});
	}

	sendEventSetSensitivity(sensitivity) {
		const padState = this.padPage.getPadState();
		padState.setAnalogStickSensitivity(sensitivity);
	}
}