const baseCssLoaders = [
    'style-loader',
    { loader: 'css-loader', options: { importLoaders: 2 } },
    'postcss-loader'
]

module.exports = {
    'stories': [
        '../src/stories/**/*.stories.mdx',
        '../src/stories/**/*.stories.@(js|jsx|ts|tsx)'
    ],
    'addons': [
        '@storybook/addon-links',
        '@storybook/addon-essentials',
        '@storybook/addon-interactions'
    ],
    'framework': '@storybook/react',
    'core': {
        'builder': '@storybook/builder-webpack5'
    },
    'staticDirs': ['../public'],
    'webpackFinal': async (config) => {
        const newConfig = { ...config }

        const rules = config.module.rules.map(rule => {
            if (rule.test.test('some.css')) {
                return {...rule, use: baseCssLoaders}
            }

            return rule
        })

        rules.push({
            test: /\.less$/,
            sideEffects: true,
            use: [...baseCssLoaders, 'less-loader']
        })

        newConfig.module.rules = rules

        return newConfig
    }
}