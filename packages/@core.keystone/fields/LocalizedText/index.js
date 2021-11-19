const { LocalizedText } = require('./Implementation')
const { Text } = require('@keystonejs/fields')

module.exports = {
    type: 'LocalizedText',
    implementation: LocalizedText,
    views: Text.views,
    adapters: Text.adapters,
}
