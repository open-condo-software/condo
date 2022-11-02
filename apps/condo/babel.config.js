module.exports = function (api) {
    api.cache(true)
    return {
        'presets': ['next/babel'],
        'plugins': [
            '@emotion',
            // NOTE(antonal): We cannot just add '@babel/preset-env' plugin with a set of syntactic sugar, because not all parts of the project supports it.
            // For example a check `if (testFunc.constructor.name !== 'AsyncFunction')` in `catchErrorFrom`
            // will not work because of 'babel-plugin-transform-async-to-module-method' plugin, included in '@babel/preset-env'.
            // Using 'babel-plugin-transform-async-to-module-method' can get performance degradation according to
            // some reports.
            // So, pick one-by-one so far
            '@babel/plugin-proposal-private-methods',
        ],
    }
}
