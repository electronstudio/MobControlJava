/**
 * Vibration
 *
 * Provide vibration.
 */

export default (function iife() {
	function Vibration(logger) {
		this.logger = logger;
		this.vibrationCheckbox = document.getElementById('vibrationCheckbox');

		navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
		if ('vibrate' in navigator) {
			logger.log('Vibration API supported');
		}
	}

	Vibration.prototype.getVibrationArray = function getVibrationArray(pct, duration) {
		const arrSum = (arr) => arr.reduce((a, b) => a + b, 0);
		const pattern = [Math.floor(100 * pct), 1];
		const patternDuration = arrSum(pattern);
		const patternRepeat = Math.floor(duration / patternDuration);
		const vibrationArray = [].concat(...Array(patternRepeat).fill(pattern));
		return vibrationArray;
	};

	Vibration.prototype.run = function run(data) {
		if(this.vibrationCheckbox.checked) {
			const {mag_left, mag_right, duration_ms} = data;
			const mag = (mag_left + mag_right) / 2;
			const vibrationArray = this.getVibrationArray(mag, duration_ms);
			const result = navigator.vibrate(vibrationArray);
			this.logger.log('V2:', result, vibrationArray);
		}
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
