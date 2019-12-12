const SOCKET_TIMEOUT_MS = 5 * 1000;

export default (function iife() {
	function Conn(logger) {
		this.logger = logger;
		this.url = new URL(window.location.origin);
		this.url.protocol = 'ws';
		this.url.pathname = 'mobcontrol/';
		this.subs = [];
		this.socketState = null;
		this.socketStateLastModified = Date.now();

		this.setupSocket();

		setTimeout(() => { this.checkConnection(); }, 5000);
	}

	Conn.prototype.updateSocketState = function updateSocketState(socketState) {
		// Only update the timestamp if the state changed.
		if (this.socketState !== socketState) {
			this.socketState = socketState;
			this.socketStateLastModified = Date.now();
		}

		// Return how long the state has been the same for.
		const socketStateDurationMs = Date.now() - this.socketStateLastModified;
		return socketStateDurationMs;
	};

	Conn.prototype.setupSocket = function setupSocket() {
		if (this.socket) {
			this.socket.onmessage = null;
			this.socket.onerror = null;
			this.socket.onclose = null;
			this.socket.onopen = null;
		}

		this.updateSocketState(null);

		this.socket = new WebSocket(this.url);

		this.socket.onmessage = (event) => {
			const { header, __type__, data } = JSON.parse(event.data);

			this.subs.forEach((sub) => {
				sub(header || __type__, data);
			});
		};

		this.socket.onerror = (event) => {
			this.logger.log('Event: Socket error');
		};

		this.socket.onclose = (event) => {
			this.logger.log('Event: Socket closed');
		};

		this.socket.onopen = (event) => {
			this.logger.log('Event: Socket opened');
			this.logger.clearNotification();
		};
	};

	Conn.prototype.checkConnection = function checkConnection() {
		const state = this.socket.readyState;
		const socketStateDurationMs = this.updateSocketState(state);
		if (state === WebSocket.CLOSED) {
			this.logger.logAndNotify('Socket state: CLOSED, reconnecting...');
			this.setupSocket();
		} else if (state === WebSocket.CLOSING) {
			this.logger.logAndNotify(`Socket state: CLOSING for ${socketStateDurationMs} ms`);
			if (socketStateDurationMs > SOCKET_TIMEOUT_MS) {
				this.socketIsStuck();
			}
		} else if (state === WebSocket.CONNECTING) {
			this.logger.logAndNotify(`Socket state: CONNECTING for ${socketStateDurationMs} ms`);
			if (socketStateDurationMs > SOCKET_TIMEOUT_MS) {
				this.socketIsStuck();
			}
		}

		setTimeout(() => { this.checkConnection(); }, 2000);
	};

	Conn.prototype.socketIsStuck = function socketIsStuck() {
		this.logger.log('Socket seems to be stuck, reconnecting...');
		this.socket.close();
		this.setupSocket();
	};

	Conn.prototype.send = function send(payload) {
		if (this.socket.readyState !== WebSocket.OPEN) {
			this.logger.log(`WARNING: sending to closed socket. bufferedamount: ${this.socket.bufferedAmount}`);
		}
		console.log(payload);
		this.socket.send(payload);
	};

	Conn.prototype.addSub = function addSub(sub) {
		this.subs.push(sub);
	};

	return Conn;
}());
