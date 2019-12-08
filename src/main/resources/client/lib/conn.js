export default (function iife() {
	function Conn() {
		const url = new URL(window.location.origin);
		url.protocol = 'ws';
		url.pathname = 'mobcontrol/';

		this.socket = new WebSocket(url);
		this.subs = [];

		this.socket.onmessage = (event) => {
			const { header, __type__, data } = JSON.parse(event.data);

			this.subs.forEach((sub) => {
				sub(header || __type__, data);
			});
		};
	}

	Conn.prototype.send = function send(payload) {
		this.socket.send(payload);
	};

	Conn.prototype.addSub = function addSub(sub) {
		this.subs.push(sub);
	};

	return Conn;
}());
