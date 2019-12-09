export default (function iife() {
	function Conn(logger) {
		this.logger = logger;
		this.url = new URL(window.location.origin);
		this.url.protocol = 'ws';
		this.url.pathname = 'mobcontrol/';
		this.subs = [];

		this.setupSocket();

		setTimeout(() => { this.checkConnection(); }, 5000);
	}

	Conn.prototype.setupSocket = function setupSocket() {
		if (this.socket) {
			this.socket.onmessage = null;
			this.socket.onerror = null;
			this.socket.onclose = null;
			this.socket.onopen = null;
		}

		this.socket = new WebSocket(this.url);

		this.socket.onmessage = (event) => {
			const { header, __type__, data } = JSON.parse(event.data);

			this.subs.forEach((sub) => {
				sub(header || __type__, data);
			});
		};

		this.socket.onerror = (event) => {
			this.logger.log('Socket error');
		};

		this.socket.onclose = (event) => {
			this.logger.log('Socket closed');
		};

		this.socket.onopen = (event) => {
			this.logger.log('Socket opened');
		};
	};

	Conn.prototype.checkConnection = function checkConnection() {
		if (this.socket.readyState === WebSocket.CLOSED) {
			this.logger.log('Socket CLOSED, reconnecting...');
			this.setupSocket();
		} else if (this.socket.readyState === WebSocket.CLOSING) {
			// Should not last for long, if it does we ought to close it.
			this.logger.log('Socket CLOSING');
		} else if (this.socket.readyState === WebSocket.CONNECTING) {
			// Should not last for long, if it does we ought to close it.
			this.logger.log('Socket CONNECTING');
		}

		setTimeout(() => { this.checkConnection(); }, 2000);
	};


	Conn.prototype.send = function send(payload) {
		if (this.socket.readyState !== WebSocket.OPEN) {
			this.logger.log(`WARNING: sending to closed socket. bufferedamount: ${this.socket.bufferedAmount}`);
		}
		this.socket.send(payload);
	};

	Conn.prototype.addSub = function addSub(sub) {
		this.subs.push(sub);
	};

	return Conn;
}());
