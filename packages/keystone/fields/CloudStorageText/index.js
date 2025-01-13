const { Text } = require('@keystonejs/fields')

const CloudStorageTextAdapters = require('./adapters')
const { CloudStorageTextImplementation } = require('./Implementation')

module.exports = {
    type: 'CloudStorageText',
    implementation: CloudStorageTextImplementation,
    views: {
        ...Text.views,
        Controller: require.resolve('./views/Controller'),
    },
    adapters: CloudStorageTextAdapters,
}