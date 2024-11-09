const { Text } = require('@keystonejs/fields')

const { RegexplessKnexFieldAdapter } = require('@open-condo/keystone/fields/utils/RegexplessKnexFieldAdapter')

module.exports = {
    type: 'Text',
    implementation: Text.implementation,
    views: Text.views,
    adapters: {
        mongoose: Text.adapters.mongoose,
        knex: RegexplessKnexFieldAdapter,
        prisma: Text.adapters.prisma,
    },
}
