const { LocalizedText } = require('./Implementation')
const { Text } = require('@keystonejs/fields')

module.exports = {
    type: 'LocalizedText',
    implementation: LocalizedText,
    adapters: {
        mongoose: Text.adapters.mongoose,
        knex: Text.adapters.knex,
    },
}
