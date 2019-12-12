module.exports = {
	"env": {
		"browser": true,
		"es6": true
	},
	"plugins": [
		"html"
	],
	"extends": "airbnb",
	"rules": {
		"no-param-reassign": [2, { "props": false }],
		"no-console": 0,
		"no-alert": 0,
		"import/extensions": 0,
		"object-curly-newline": 0,
		"camelcase": 0,
		"no-unused-vars": ["error", { "args": "none" }],
		"max-len": [2, 200],
		"linebreak-style": [2, "windows"],
		"indent": ["error", "tab"],
		"no-tabs": 0
	}
};
