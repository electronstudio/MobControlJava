/**
 * Vibration
 *
 * Provide vibration.
 */

export default (function iife() {
	function Vibration(logger) {
		this.logger = logger;

		navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
		if ('vibrate' in navigator) {
			logger.log('Vibration API supported');
		}
	}

	Vibration.prototype.run = function run(data) {
		const { mag_left, mag_right, duration_ms } = data;
		const result = navigator.vibrate(duration_ms);
		this.logger.log('V:', result, mag_left, mag_right, duration_ms / 1000);
	};

	Vibration.prototype.testSimple = function testSimple(durationMs) {
		const result = navigator.vibrate(durationMs);
		this.logger.log('V1:', result);
	};

	Vibration.prototype.testComplex = function testComplex() {
		const result = navigator.vibrate([100, 30, 100, 30, 100, 30, 200, 30, 200, 30, 200, 30, 100, 30, 100, 30, 100]);
		this.logger.log('V2:', result);
	};

	return Vibration;
}());
