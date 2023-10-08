const path = require('path')

const CopyPlugin = require('copy-webpack-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const lessLoader = require('./less-loader.config')

const baseCssLoaders = [
    MiniCssExtractPlugin.loader,
    { loader: 'css-loader', options: { importLoaders: 2 } },
    'postcss-loader',
]

module.exports = {
    entry: {
        'index': './src/index.ts',
        'colors/index': './src/colors/index.ts',
        'hooks': './src/hooks.ts',
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
        new CopyPlugin({
            patterns: [
                { from: 'src/tokens', to: 'style-vars', filter: (filepath) => filepath.includes('variables') },
            ],
        }),
    ],
    optimization: {
        minimizer: [
            new CssMinimizerPlugin({ include: /\.min\./ }),
        ],
    },
}