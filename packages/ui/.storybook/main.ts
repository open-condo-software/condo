import { dirname, join } from "path";
import get from 'lodash/get'
const lessLoader = require('../less-loader.config.js')

import type { RuleSetRule } from 'webpack'
import type { StorybookConfig } from '@storybook/react-webpack5'

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
        getAbsolutePath("@storybook/addon-links"),
        getAbsolutePath("@storybook/addon-webpack5-compiler-babel"),
        getAbsolutePath("@chromatic-com/storybook"),
        getAbsolutePath("@storybook/addon-docs")
    ],

    'framework': {
        name: getAbsolutePath("@storybook/react-webpack5"),
        options: {}
    },

    'staticDirs': [{ from: '../public', to: '/ui' }],

    'webpackFinal': async (config) => {
        const configRules: Array<RuleSetRule> = get(config, ['module', 'rules'], []) as Array<RuleSetRule>
        const modifiedRules = configRules.map(rule => {
            if (typeof rule === 'object' && 'test' in rule && rule.test &&
                rule.test.constructor === RegExp && rule.test.test('some.css')) {
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
    },

    typescript: {
        reactDocgen: 'react-docgen-typescript'
    }
}

export default config

function getAbsolutePath(value: string): string {
    // Controlled traversal
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    return dirname(require.resolve(join(value, "package.json")));
}