/**
 * MobControl Client
 *
 * Stores and updates internal representation of a pad based on user interaction.
 * Transmits internal representation to server on regular intervals.
 */

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
export default padPage;

function show(){
	const width = pageContainer.scrollWidth;
	const height = pageContainer.scrollHeight;
	const portrait = width < height;
	showElement(setPageElement, portrait);
	showElement(padPageElement, !portrait);
}

function showElement(element, show) {
	element.style.opacity = show ? '1' : '0';
	element.style.pointerEvents = show ? 'auto' : 'none';
}

window.addEventListener('resize', (ev) => {
	show();
});

document.addEventListener('DOMContentLoaded', function() {
	show();
}, false);

if('standalone' in window.navigator){
	if(window.navigator.standalone){
		logger.log("IOS standalone")
	}else{
		logger.log("IOS not standalone");
		alert("For best performance please press the share button at the centre bottom of the screen and select 'add to homescreen' from the menu.")
	}
}


