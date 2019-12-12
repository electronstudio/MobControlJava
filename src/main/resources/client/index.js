/**
 * MobControl Client
 *
 * Stores and updates internal representation of a pad based on user interaction.
 * Transmits internal representation to server on regular intervals.
 */

import SettingsPage from './pages/settings.js';
import PadPage from './pages/pad.js';
import Conn from './lib/conn.js';
import Logger from './lib/logger.js';

const pageContainer = document.getElementById('pageContainer');
const padPageElement = document.getElementById('padPage');
const setPageElement = document.getElementById('setPage');
const logElement = document.getElementById('log');
const notificationElement = document.getElementById('notification');
const logger = new Logger(logElement, notificationElement);

const conn = new Conn(logger);
const padPage = new PadPage(conn, logger);
const settingsPage = new SettingsPage(conn, padPage);

export default {
	settingsPage,
	padPage,
};

function showElement(element, visible) {
	element.style.opacity = visible ? '1' : '0';
	element.style.pointerEvents = visible ? 'auto' : 'none';
}

function show() {
	const width = pageContainer.scrollWidth;
	const height = pageContainer.scrollHeight;
	const portrait = width < height;
	showElement(setPageElement, portrait);
	showElement(padPageElement, !portrait);
}

window.addEventListener('resize', (ev) => {
	show();
});

window.addEventListener('touchstart', (ev) => {
	document.body.requestFullscreen();
});

document.addEventListener('DOMContentLoaded', () => {
	show();
}, false);

if ('standalone' in window.navigator) {
	if (window.navigator.standalone) {
		logger.log('IOS standalone');
	} else {
		logger.log('IOS not standalone');
		alert("For best performance please press the share button at the centre bottom of the screen and select 'add to homescreen' from the menu.");
	}
}
