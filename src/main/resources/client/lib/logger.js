/**
 * Logger
 *
 * Provide simple logging into a HTML element.
 */

export default (function iife() {
	const BUFFER_SIZE = 100;

	function Logger(element) {
		this.element = element;
		this.lines = [];
	}

	Logger.prototype.log = function log(...tokens) {
		const line = tokens.map((x) => `${x}`).join(' ');
		this.lines = [].concat([line], this.lines.slice(0, BUFFER_SIZE - 1));
		if (this.element) {
			this.element.innerHTML = this.lines.join('\n');
		}
	};

	return Logger;
}());
