//var UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    context: __dirname,

	entry: {
		main: './app/main.js'
	},
	output: {
        path: __dirname + '/app/static',
		filename: 'bundle.js',
        publicPath:''
	}
	/*,


	plugins: [
		new UglifyJSPlugin()
	]
	*/

};
