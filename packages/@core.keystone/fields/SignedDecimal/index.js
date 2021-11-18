const { Decimal } = require('@keystonejs/fields')
const { SignedDecimal } = require('./Implementation')

module.exports = {
    type: 'SignedDecimal',
    implementation: SignedDecimal,
    views: {
        Controller: '@keystonejs/fields/types/Decimal/views/Controller',
        Field: '@keystonejs/fields/types/Decimal/views/Field',
        Filter: '@keystonejs/fields/types/Decimal/views/Filter',
    },
    adapters: {
        mongoose: Decimal.adapters.mongoose,
        knex: Decimal.adapters.knex,
        prisma: Decimal.adapters.prisma,
    },
}