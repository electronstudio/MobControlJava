/**
 * Logger
 *
 * Provide simple logging into a HTML element.
 */
const BUFFER_SIZE = 100;

const logElement = document.getElementById('log');

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

const logger = new Logger(logElement);
const log = logger.log.bind(logger);

export default log;
