//
// Logging.
//
function Logger(element) {
	this.element = element;
}

Logger.prototype.log = function (...tokens) {
	const line = tokens.map(x => `${x}`).join(' ');
    if (this.element) {
        this.element.innerHTML = line + '!\n' + this.element.innerHTML;
    }
}
