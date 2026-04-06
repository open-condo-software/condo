const { Text } = require('@open-keystone/fields')

const { ExternalContentImplementation } = require('./Implementation')

module.exports = {
    type: 'ExternalContent',
    implementation: ExternalContentImplementation,
    adapters: {
        knex: Text.adapters.knex,
        mongoose: Text.adapters.mongoose,
        prisma: Text.adapters.prisma,
    },
    views: {
        Controller: require.resolve('./views/Controller'),
        Field: require.resolve('./views/Field'),
        Cell: require.resolve('./views/Cell'),
    },
}

