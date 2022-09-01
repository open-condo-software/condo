const { AddressField } = require('Implementation')
const { Text } = require('@keystonejs/fields')

module.exports = {
    type: 'AddressField',
    implementation: AddressField,
    views: Text.views,
    adapters: {
        mongoose: Text.adapters.mongoose,
        knex: Text.adapters.knex,
        prisma: Text.adapters.prisma,
    },
}
