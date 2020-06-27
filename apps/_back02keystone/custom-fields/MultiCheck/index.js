const { Implementation, KnexFieldInterface, MongoFieldInterface } = require('./Implementation')

module.exports = {
    type: 'MultiCheck',
    implementation: Implementation,
    views: {
        // Note: You cannot currently import and extend a controller
        // outside this monorepo.
        Controller: require.resolve('./views/Controller'),
        Field: require.resolve('./views/Field'),
        // Filter: Text.views.Filter,
        Cell: require.resolve('./views/Cell'),
    },
    adapters: {
        mongoose: MongoFieldInterface,
        knex: KnexFieldInterface,
    },
}
