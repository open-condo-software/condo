const { Text } = require('@open-keystone/fields')

const EncryptedTextAdapters = require('./adapters')
const { EncryptedTextImplementation } = require('./Implementation')

module.exports = {
    type: 'EncryptedText',
    implementation: EncryptedTextImplementation,
    views: Text.views,
    adapters: EncryptedTextAdapters,
}
