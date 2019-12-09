export default (function iife() {

	function Conn(logger) {
		this.logger = logger;
		this.url = new URL(window.location.origin);
		this.url.protocol = 'ws';
		this.url.pathname = 'mobcontrol/';

		this.setupSocket();

		window.setTimeout(checkConnection.bind(this), 5000);

	}

	Conn.prototype.setupSocket = function setupSocket() {
		this.socket = new WebSocket(this.url);
		this.subs = [];

		this.socket.onmessage = (event) => {
			const { header, __type__, data } = JSON.parse(event.data);

			this.subs.forEach((sub) => {
				sub(header || __type__, data);
			});
		};

		this.socket.onerror = (event) => {
			this.logger.log("event: socket connection error")
		};

		this.socket.onclose = (event) => {
			this.logger.log("event: socket connection closed")
		};

		this.socket.onopen = (event) => {
			this.logger.log("event: socket connection opened")
		};
	};

	function checkConnection() {
		if(this.socket.readyState === WebSocket.CLOSED) {
			this.logger.log("socket state: CLOSED, reconnecting...");
			this.setupSocket()
		}else if(this.socket.readyState === WebSocket.CLOSING) {
			this.logger.log("socket state: CLOSING (should not last for long, if it does we ought to close it");
		}else if(this.socket.readyState === WebSocket.CONNECTING) {
			this.logger.log("socket state: CONNECTING (should not last for long, if it does we ought to close it");
		}
		window.setTimeout(checkConnection.bind(this), 2000);
	}


	Conn.prototype.send = function send(payload) {
		if(this.socket.readyState != WebSocket.OPEN) {
			this.logger.log("WARNING: sending to closed socket. bufferedamount: "+this.socket.bufferedAmount)
		}
		this.socket.send(payload);
	};

	Conn.prototype.addSub = function addSub(sub) {
		this.subs.push(sub);
	};

	return Conn;
}());
