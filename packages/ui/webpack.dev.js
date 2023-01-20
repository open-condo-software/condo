const { merge } = require('webpack-merge')

const common = require('./webpack.common')

module.exports = merge(common, {
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    'babel-loader',
                    // NOTE: ts-Loader is slower but enables type-generation without tsj running for real-time update
                    {
                        loader: 'ts-loader',
                        options: {
                            configFile: 'tsconfig.prod.json',
                            compilerOptions: {
                                emitDeclarationOnly: false,
                            },
                        },
                    },
                ],
                exclude: /node_modules/,
            },
        ],
    },
    watch: true,
})