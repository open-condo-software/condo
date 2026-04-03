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
        // Admin UI renders file metadata as a clickable download link
        Controller: require.resolve('../Json/views/Controller'),
        Field: require.resolve('./views/Field'),
        Cell: require.resolve('./views/Cell'),
    },
}

