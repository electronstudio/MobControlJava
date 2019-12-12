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
	constructor(conn) {
		this.conn = conn;
		this.initName();
		this.initColour(1);
		this.initColour(2);
		this.initStickSensitivity();
	}

	initName() {
		const nameInput = document.getElementById('name');
		nameInput.oninput = (ev) => {
			const name = ev.target.value;
			this.sendEventChangeName(name);
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
				this.sendEventChangeColour(index, color);
			};
		});
	}

	initStickSensitivity() {
		const slider = document.getElementById('stickSensitivity');
		slider.oninput = (ev) => {
			const sensitivity = ev.target.value / 100;
			this.sendEventChangeSensitivity(sensitivity);
		};
	}

	sendEventChangeName(name) {
		this.conn.send({
			__type__: 'change_name',
			name,
		});
	}

	sendEventChangeColour(index, colour) {
		this.conn.send({
			__type__: `change_colour_${index}`,
			colour,
		});
	}

	sendEventChangeSensitivity(sensitivity) {
		this.conn.send({
			__type__: 'set_sensitivity',
			sensitivity,
		});
	}
}
