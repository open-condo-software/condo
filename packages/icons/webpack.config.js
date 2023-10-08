const path = require('path')

module.exports = {
    mode: 'production',
    entry: {
        'index': './src/index.ts',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        library: {
            type: 'umd',
            name: '@open-condo/icons',
        },
        globalObject: 'this',
    },
    externals: {
        react: 'react',
    },
    resolve: {
        extensions: ['.ts', '.tsx'],
    },
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
}