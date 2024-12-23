const { Text } = require('@keystonejs/fields')

const LargeTextAdapters = require('./adapters')
const { LargeTextImplementation } = require('./Implementation')

module.exports = {
    type: 'LargeText',
    implementation: LargeTextImplementation,
    views: {
        ...Text.views,
        Controller: require.resolve('./views/Controller'),
    },
    adapters: LargeTextAdapters,
}