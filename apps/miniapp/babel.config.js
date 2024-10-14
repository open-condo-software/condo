module.exports = function (api) {
    api.cache(true)
    return {
        'presets': ['next/babel'],
        'plugins': ['@emotion', '@babel/plugin-proposal-private-methods'],
    }
}
