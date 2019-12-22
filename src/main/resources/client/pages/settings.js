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

const defaultName = 'Player';
const defaultColours = [null, '#ffffff', '#1b2632'];
const defaultSensitivity = 0.6;
const defaultLogVisibility = false;
const defaultVibration = true;

export default class SettingsPage {
	constructor(conn, padPage, config, onPadPageRequested) {
		// Store parameters.
		this.conn = conn;
		this.padPage = padPage;
		this.config = config;
		this.onPadPageRequested = onPadPageRequested;

		// Initialise Client.
		this.initClientPadIndex();
		this.initClientName();
		this.initClientColour(1);
		this.initClientColour(2);
		this.initClientSensitivity();
		this.initClientLogVisibility();
		this.initClientVibration();

		this.loaded = false;
	}

	loadConfig() {
		if (!this.loaded) {
			this.loadName();
			this.loadColour(1);
			this.loadColour(2);
			this.loadSensitivity();
			this.loadLogVisibility();
			this.loadVibration();
			this.loaded = true;
		}
	}

	//
	// Pad index
	//

	setPadIndexOnClient(padIndex) {
		this.onPadPageRequested(padIndex);
	}

	setPadIndex(padIndex) {
		this.setPadIndexOnClient(padIndex);
		this.config.setValue('PAD_INDEX', padIndex);
	}

	initClientPadIndex() {
		this.showPadButton1 = document.getElementById('showPadButton1');
		this.showPadButton2 = document.getElementById('showPadButton2');
		this.showPadButton1.onclick = () => {
			this.setPadIndex(1);
		};

		this.showPadButton2.onclick = () => {
			this.setPadIndex(2);
		};
	}

	//
	// Name
	//

	setNameOnServer(name) {
		const data = {
			__type__: 'set_name',
			name,
		};
		const json = JSON.stringify(data, null, 4);
		try { this.conn.send(json); } catch (error) {}
	}

	setNameOnClient(name) {
		this.nameInput.value = name;
	}

	setName(name) {
		this.setNameOnClient(name);
		this.setNameOnServer(name);
		this.config.setValue('PLAYER_NAME', name);
	}

	loadName() {
		const name = this.config.getValue('PLAYER_NAME', defaultName);
		this.setName(name);
	}

	initClientName() {
		this.nameInput = document.getElementById('name');
		this.nameInput.oninput = (ev) => {
			this.setName(ev.target.value);
		};
	}

	//
	// Colour
	//

	setColourOnServer(index, colour) {
		const rgb = colour.match(/\d+/g);
		const data = {
			__type__: `set_colour_${index}`,
			rgb,
		};
		const json = JSON.stringify(data, null, 4);
		try { this.conn.send(json); } catch (error) {}
	}

	setColourOnClient(index, color) {
		const swatch = this.swatchElements[index];
		swatch.style['background-color'] = color;
	}

	setColour(index, color) {
		this.setColourOnClient(index, color);
		this.setColourOnServer(index, color);
		this.config.setValue(`PLAYER_COL_${index}`, color);
	}

	loadColour(index) {
		const color = this.config.getValue(`PLAYER_COL_${index}`, defaultColours[index]);
		this.setColour(index, color);
	}

	initClientColour(index) {
		this.swatchElements = [
			'convert zero-indexing to one-indexing',
			document.getElementById(`colour${1}Swatch`),
			document.getElementById(`colour${2}Swatch`),
		];
		this.selectButtonContainers = [
			'convert zero-indexing to one-indexing',
			document.getElementById(`colour${1}SelectButtons`),
			document.getElementById(`colour${2}SelectButtons`),
		];

		const selectButtons = this.selectButtonContainers[index];
		selectButtons.innerHTML = ''; // Remove all example children.
		selectableColours.forEach((selectableColour) => {
			const child = document.createElement('div');
			child.className = 'colour-select';
			child.style['background-color'] = selectableColour;
			selectButtons.appendChild(child);
		});

		selectButtons.childNodes.forEach((selectButton) => {
			selectButton.onclick = () => {
				this.setColour(index, selectButton.style['background-color']);
			};
		});
	}

	//
	// Sensitivity
	//

	setSensitivityOnServer(sensitivity) {
		const padState = this.padPage.getPadState();
		padState.setAnalogStickSensitivity(sensitivity);
	}

	setSensitivityOnClient(sensitivity) {
		this.sensitivitySlider.value = sensitivity * 100;
		console.log("set sensitivity: "+sensitivity)
	}

	setSensitivity(sensitivity) {
		this.setSensitivityOnClient(sensitivity);
		this.setSensitivityOnServer(sensitivity);
		this.config.setValue('ANALOG_STICK_SENSITIVITY', sensitivity);
		console.log('ANALOG_STICK_SENSITIVITY', sensitivity);
	}

	loadSensitivity() {
		const sensitivity = this.config.getValue('ANALOG_STICK_SENSITIVITY', defaultSensitivity);
		console.log("load sensitivity: "+sensitivity)
		this.setSensitivity(sensitivity);
	}

	initClientSensitivity() {
		this.sensitivitySlider = document.getElementById('stickSensitivity');
		this.sensitivitySlider.oninput = (ev) => {
			this.setSensitivity(ev.target.value / 100);
		};
	}

	//
	// Log Visibility
	//

	setLogVisibilityOnClient(logVisibility) {
		this.logTextArea.hidden = !logVisibility;
	}

	setLogVisibility(logVisibility) {
		this.setLogVisibilityOnClient(logVisibility);
		this.config.setValue('SHOW_LOG', logVisibility);
	}

	loadLogVisibility() {
		const logVisibility = this.config.getValue('SHOW_LOG', defaultLogVisibility);
		this.setLogVisibility(logVisibility);
		this.showLogCheckbox.checked = logVisibility;
	}

	initClientLogVisibility() {
		this.logTextArea = document.getElementById('log');
		this.showLogCheckbox = document.getElementById('showLogCheckbox');
		this.showLogCheckbox.oninput = (ev) => {
			this.setLogVisibility(ev.target.checked);
		};
	}

	//
	// Vibration
	//

	initClientVibration() {
		this.vibrationCheckbox = document.getElementById('vibrationCheckbox');
		this.vibrationCheckbox.oninput = (ev) => {
			this.setVibration(ev.target.checked);
		};
	}

	setVibration(vibration) {
		this.config.setValue('VIBRATION', vibration);
	}

	loadVibration() {
		const vibration = this.config.getValue('VIBRATION', defaultVibration);
		this.vibrationCheckbox.checked = vibration;
	}
}
