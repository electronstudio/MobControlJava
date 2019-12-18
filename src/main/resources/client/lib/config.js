export default class Config {
	constructor() {
		this.configKey = 'mobcontrol_config';
	}

	resetConfig() {
		localStorage.removeItem(this.configKey);
	}

	setConfig(configObject) {
		const configString = JSON.stringify(configObject);
		localStorage.setItem(this.configKey, configString);
	}

	getConfig() {
		try {
			const configString = localStorage.getItem(this.configKey);
			const configObject = JSON.parse(configString);
			return configObject;
		} catch (error) {
			return {};
		}
	}

	applyConfig(partialConfig) {
		const config = {
			...this.getConfig(),
			...partialConfig,
		};

		return this.setConfig(config);
	}

	getValue(key, defaultValue = undefined) {
		return this.getConfig()[key] || defaultValue;
	}

	setValue(key, value) {
		return this.applyConfig({ [key]: value });
	}
}
