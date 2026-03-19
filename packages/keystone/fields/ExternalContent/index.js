const { Text } = require('@open-keystone/fields')

const { ExternalContentImplementation } = require('./Implementation')

const { JsonKnexFieldAdapter, JsonMongooseFieldAdapter, JsonPrismaFieldAdapter } = require('../Json/Implementation')

module.exports = {
    type: 'ExternalContent',
    implementation: ExternalContentImplementation,
    adapters: {
        knex: JsonKnexFieldAdapter,
        mongoose: JsonMongooseFieldAdapter,
        prisma: JsonPrismaFieldAdapter,
    },
    views: {
        // This field is not intended to be edited via Admin UI.
        // Reuse Text views to keep UI stable if it is shown somewhere.
        Controller: require.resolve('../Json/views/Controller'),
        Field: Text.views.Field,
        Cell: Text.views.Cell,
    },
}

