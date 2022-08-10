module.exports = {
    'stories': [
        '../stories/**/*.stories.mdx',
        '../stories/**/*.stories.@(ts|tsx)',
    ],
    'addons': [
        '@storybook/addon-links',
        '@storybook/addon-essentials',
        '@storybook/addon-interactions',
        '@storybook/addon-docs',
    ],
    'typescript': true,
    'framework': '@storybook/react',
    'core': {
        'builder': '@storybook/builder-webpack5',
    },
    'webpackFinal': async (config) => {
        const rules = config.module.rules.map(rule => {
            switch (String(rule.test)) {
                case String(/\.(mjs|tsx?|jsx?)$/):
                    return {
                        ...rule,
                        use: [
                            ...rule.use,
                            '@linaria/webpack-loader',
                        ],
                    }
                default:
                    return rule
            }
        })

        return {
            ...config,
            module: {
                ...config.module,
                rules,
            },
        }
    },
}