const { merge } = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')

const common = require('./webpack.common')

module.exports = merge(common, {
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    'babel-loader',
                ],
                exclude: /node_modules/,
            },
        ],
    },
    externals: [
        nodeExternals({
            modulesFromFile: true,
        }),
    ],
})
