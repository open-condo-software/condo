const { OptionsImplementation, OptionsKnexFieldAdapter, OptionsMongooseFieldAdapter } = require('./Implementation')

module.exports = {
    type: 'Options',
    implementation: OptionsImplementation,
    adapters: {
        knex: OptionsKnexFieldAdapter,
        mongoose: OptionsMongooseFieldAdapter,
    },
    views: {
        // Note: You cannot currently import and extend a controller
        // outside this monorepo.
        Controller: require.resolve('./views/Controller'),
        Field: require.resolve('./views/Field'),
        // Filter: Text.views.Filter,
        Cell: require.resolve('./views/Cell'),
    },
}
