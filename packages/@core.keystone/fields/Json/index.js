const { JsonImplementation, JsonKnexFieldAdapter, JsonMongooseFieldAdapter } = require('./Implementation')
const { Text } = require('@keystonejs/fields')

module.exports = {
    type: 'Json',
    implementation: JsonImplementation,
    adapters: {
        knex: JsonKnexFieldAdapter,
        mongoose: JsonMongooseFieldAdapter,
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
