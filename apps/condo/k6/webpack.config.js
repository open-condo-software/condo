const path = require('path')

// const glob = require('glob')
// const GlobEntries = require('webpack-glob-entries')

module.exports = {
    mode: 'production',
    // entry: glob.sync('./src/*.ts'),
    entry: {
        'ticket.test': path.join(__dirname, 'src/ticket.test.ts'),
        'news.test': path.join(__dirname, 'src/news.test.ts'),
    },
    output: {
        path: path.join(__dirname, 'dist'),
        libraryTarget: 'commonjs',
        filename: '[name].js',
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'babel-loader',
                exclude: /node_modules/,
            },
        ],
    },
    target: 'web',
    externals: /^(k6|https?:\/\/)(\/.*)?/,
    devtool: 'source-map',
    stats: {
        colors: true,
    },
    optimization: {
        minimize: false,
    },
}
