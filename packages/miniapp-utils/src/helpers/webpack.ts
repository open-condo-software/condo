import type { Configuration } from 'webpack'

export function nextCamelCaseCSSModulesTransform (config: Configuration): Configuration {
    const rules = config.module?.rules

    if (!config.module?.rules || !Array.isArray(rules)) return config

    config.module.rules = rules.map(rule => {
        if (!rule || typeof rule !== 'object') {
            return rule
        }
        if (!rule.oneOf) {
            return rule
        }

        rule.oneOf = rule.oneOf.map(option => {
            if (
                option &&
                option.test instanceof RegExp &&
                option.test.test('my.module.css') &&
                Array.isArray(option.use)
            ) {
                option.use = option.use.map(loader => {
                    if (
                        loader &&
                        typeof loader === 'object' &&
                        loader?.loader?.includes('/css-loader') &&
                        typeof loader.options === 'object'
                    ) {
                        if (!loader.options.modules) {
                            loader.options.modules = {}
                        }

                        loader.options.modules.exportLocalsConvention = 'camelCase'
                    }

                    return loader
                })
            }

            return option
        })

        return rule
    })

    return config
}