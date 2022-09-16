import type { StorybookConfig } from '@storybook/react/types'
import lessLoader from '../less-loader.config.json'

const baseCssLoaders = [
    'style-loader',
    { loader: 'css-loader', options: { importLoaders: 2 } },
    'postcss-loader'
]

const config: StorybookConfig = {
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
    'staticDirs': [{ from: '../public', to: '/ui' }],
    'webpackFinal': async (config) => {
        const configRules = config && config.module ? config.module.rules : []
        const modifiedRules = configRules.map(rule => {
            if (rule.test && rule.test.constructor === RegExp && rule.test.test('some.css')) {
                return {...rule, use: baseCssLoaders}
            }

            return rule
        })

        modifiedRules.push({
            test: /\.less$/,
            sideEffects: true,
            use: [...baseCssLoaders, lessLoader]
        })

        config.module = { ...config.module, rules: modifiedRules }

        return config
    }
}

export default config