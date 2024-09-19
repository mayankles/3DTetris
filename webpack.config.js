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
            'three': path.resolve(__dirname, 'node_modules/three/build/three.module.js'),
            'OrbitControls': path.resolve(__dirname, 'node_modules/three/examples/jsm/controls/OrbitControls.js'),
            'cannon-es': path.resolve(__dirname, 'node_modules/cannon-es/dist/cannon-es.js'),
        },
        extensions: ['.js'],
        mainFields: ['browser', 'module', 'main'],
    },
    mode: 'development',
};