var path    = require('path');
var webpack = require('webpack');


const babelOptions = {
    loader: 'babel-loader',
    options: {
        'sourceMaps': true,
        'presets': [
            ['@babel/preset-env', {
                'targets': {
                    'chrome': 68
                }
            }]
        ],
        'ignore': [],
    }
};


module.exports = function (env) {
    return [{
        target: "web",
        entry: {
            'mdne-ui': [
                path.resolve(__dirname, 'contents/assets/script/index.js')
            ]
        },
        node: {
            global: false,
            __filename: false,
            __dirname: false,
        },
        output: {
            library: 'mdne-ui',

            libraryTarget: 'umd',
            globalObject: 'this',
            filename: process.env.NODE_ENV === 'production' ? '[name].min.js' : '[name].js',
            path: path.resolve(__dirname, 'contents/assets/script'),
            devtoolModuleFilenameTemplate: void 0
        },
        module: {
            rules: [{
                use: [
                    babelOptions,
                ],
                test: /\.m?js/,
            }, {
                enforce: 'pre',
                test: /\.m?js/,
                use: {
                    loader: 'source-map-loader',
                    options: {
                    }
                },
                exclude: /node_modules[\/\\].*$/
            }]
        },
        plugins: [],
        resolve: {
            extensions: ['.js', '.mjs']
        },
        devtool: 'source-map'
    },

]}
