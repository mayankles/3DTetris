const path = require('path');

module.exports = {
    entry: './src/main.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
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
            'OrbitControls': path.resolve('./node_modules/three/examples/jsm/controls/OrbitControls.js'),
        },
    },
    devtool: 'source-map',
    mode: 'development',
};