const path = require('path');

module.exports = {
    entry: './src/main.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/dist/',
    },
    devServer: {
        static: {
            directory: __dirname,
        },
        port: 9000,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
        ],
    },
    resolve: {
        alias: {
            'three': path.resolve('./node_modules/three'),
            'FontLoader': path.resolve('./node_modules/three/examples/jsm/loaders/FontLoader.js'),
            'TextGeometry': path.resolve('./node_modules/three/examples/jsm/geometries/TextGeometry.js'),
        },
    },
    devtool: 'source-map',
    mode: 'development',
};