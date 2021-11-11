const { LocalizedText } = require('./Implementation')
const { Text } = require('@keystonejs/fields')

module.exports = {
    type: 'LocalizedText',
    implementation: LocalizedText,
    views: {
        Controller: '@keystonejs/fields/types/Text/views/Controller',
        Field: '@keystonejs/fields/types/Text/views/Field',
        Filter: '@keystonejs/fields/types/Text/views/Filter',
    },
    adapters: {
        mongoose: Text.adapters.mongoose,
        knex: Text.adapters.knex,
        prisma: Text.adapters.prisma,
    },
}
