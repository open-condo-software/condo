const { Text } = require('@keystonejs/fields')

const FileStorageTextAdapters = require('./adapters')
const { FileStorageTextImplementation } = require('./Implementation')

module.exports = {
    type: 'FileStorageText',
    implementation: FileStorageTextImplementation,
    views: {
        ...Text.views,
        Controller: require.resolve('./views/Controller'),
    },
    adapters: FileStorageTextAdapters,
}