const { Text } = require('@keystonejs/fields')

const { LocalizedText } = require('./Implementation')

module.exports = {
    type: 'LocalizedText',
    implementation: LocalizedText,
    views: Text.views,
    adapters: Text.adapters,
}
