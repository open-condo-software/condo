const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const lessLoader = require('./less-loader.config.json')

const baseCssLoaders = [
    MiniCssExtractPlugin.loader,
    { loader: 'css-loader', options: { importLoaders: 2 } },
    'postcss-loader',
]

module.exports = {
    mode: 'production',
    entry: {
        'index': './src/index.ts',
        'colors/index': './src/colors/index.ts',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        library: {
            type: 'umd',
            name: '@open-condo/ui',
        },
        globalObject: 'this',
    },
    externals: {
        react: 'react',
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json', '.less', '.css'],
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
            {
                test: /\.css$/,
                use: baseCssLoaders,
            },
            {
                test: /\.less$/,
                use: [...baseCssLoaders, lessLoader],
            },
            {
                test: /\.js$/,
                use: ['source-map-loader'],
                exclude: /node_modules/,
                enforce: 'pre',
            },
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({ filename: 'styles.css' }),
        new MiniCssExtractPlugin({ filename: 'styles.min.css' }),
    ],
    optimization: {
        minimizer: [
            new CssMinimizerPlugin({ include: /\.min\./ }),
        ],
    },
}