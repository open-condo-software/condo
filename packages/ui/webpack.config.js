const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

const baseCssLoaders = [
    MiniCssExtractPlugin.loader,
    {
        loader: 'css-loader',
        options: {
            importLoaders: 2,
        },
    },
    'postcss-loader',
]

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
        extensions: [
            '.ts', '.tsx',
            '.css', '.less',
            '.js',
        ],
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
            {
                test: /\.css$/,
                use: baseCssLoaders,
            },
            {
                test: /\.less$/,
                use: [
                    ...baseCssLoaders,
                    {
                        loader: 'less-loader',
                    },
                ],
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
            new CssMinimizerPlugin({
                include: /\.min\./,
            }),
        ],
    },
}
