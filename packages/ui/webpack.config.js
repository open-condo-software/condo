const path = require('path')

module.exports = {
    mode: 'production',
    entry: {
        'index': './src/index.ts',
        'themes/index': './src/themes/index.ts',
        'themes/default': './src/themes/default.ts',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        library: {
            type: 'umd',
            name: '@condo/ui',
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
                    {
                        loader: '@linaria/webpack-loader',
                        options: { sourceMap: true },
                    },
                ],
                exclude: /node_modules/,
            },
        ],
    },
}
