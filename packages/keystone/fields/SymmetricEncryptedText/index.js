const { Text } = require('@keystonejs/fields')

const SymmetricEncryptedTextAdapters = require('./adapters')
const { SymmetricEncryptedTextImplementation } = require('./Implementation')

module.exports = {
    type: 'SymmetricEncryptedText',
    implementation: SymmetricEncryptedTextImplementation,
    views: Text.views,
    adapters: SymmetricEncryptedTextAdapters,
}
