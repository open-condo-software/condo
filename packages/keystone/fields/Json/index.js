const { Text } = require('@open-keystone/fields')

const { JsonImplementation, JsonKnexFieldAdapter, JsonMongooseFieldAdapter, JsonPrismaFieldAdapter } = require('./Implementation')

module.exports = {
    type: 'Json',
    implementation: JsonImplementation,
    adapters: {
        knex: JsonKnexFieldAdapter,
        mongoose: JsonMongooseFieldAdapter,
        prisma: JsonPrismaFieldAdapter,
    },
    views: {
        // Note: You cannot currently import and extend a controller
        // outside this monorepo.
        Controller: require.resolve('./views/Controller'),
        Field: Text.views.Field,
        // Filter: Text.views.Filter,
        Cell: Text.views.Cell,
    },
}
