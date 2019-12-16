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

const padPageElement = document.getElementById('padPage');
const settingsPageElement = document.getElementById('setPage');
const logElement = document.getElementById('log');
const notificationElement = document.getElementById('notification');
const logger = new Logger(logElement, notificationElement);


const pages = {
	settings: 'settingsPage',
	pad: 'padPage',
};

let currentPage = pages.settings;

function showElement(element, visible) {
	element.style.opacity = visible ? '1' : '0';
	element.style.pointerEvents = visible ? 'auto' : 'none';
}

function showPage(pageId) {
	showElement(settingsPageElement, pageId === pages.settings);
	showElement(padPageElement, pageId === pages.pad);
	currentPage = pageId;
}

const onSettingsPageRequested = () => {
	showPage(pages.settings);
};

const onPadPageRequested = () => {
	showPage(pages.pad);
};

const conn = new Conn(logger);
const padPage = new PadPage(conn, logger, onSettingsPageRequested);
const settingsPage = new SettingsPage(conn, padPage, onPadPageRequested);

window.addEventListener('resize', (ev) => {
	const portrait = window.matchMedia('(orientation: portrait)').matches;

	// Changing orientation from landscape->portrait is a shortcut for changing pad->settings by flipping to portrait.
	if (currentPage === pages.pad && portrait) {
		showPage(pages.settings);
	}
});

window.addEventListener('touchstart', (ev) => {
	document.body.requestFullscreen();
});

document.addEventListener('DOMContentLoaded', () => {
	showPage(pages.settings);
}, false);

if ('standalone' in window.navigator) {
	if (window.navigator.standalone) {
		logger.log('IOS standalone');
	} else {
		logger.log('IOS not standalone');
		alert("For best performance please press the share button at the centre bottom of the screen and select 'add to homescreen' from the menu.");
	}
}
