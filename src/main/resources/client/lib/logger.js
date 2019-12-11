/**
 * Logger
 *
 * Provide simple logging into a HTML element.
 */

export default (function iife() {
	const BUFFER_SIZE = 100;

	function Logger(logElement, notificationElement) {
		this.logElement = logElement;
		this.notificationElement = notificationElement;
		this.lines = [];
	}

	Logger.prototype.log = function log(...tokens) {
		const line = tokens.map((x) => `${x}`).join(' ');
		this.lines = [].concat([line], this.lines.slice(0, BUFFER_SIZE - 1));
		if (this.logElement) {
			this.logElement.innerHTML = this.lines.join('\n');
		}
	};

	Logger.prototype.setNotification = function setNotification(text) {
		this.notificationElement.innerHTML = text;
		this.notificationElement.style.display = text ? 'block' : 'none';
	};

	Logger.prototype.clearNotification = function clearNotification() {
		this.setNotification(null);
	};

	Logger.prototype.logAndNotify = function logAndNotify(text) {
		this.log(text);
		this.setNotification(text);
	};

	return Logger;
}());
