const { JsonImplementation, JsonKnexFieldAdapter, JsonMongooseFieldAdapter } = require('./Implementation')
const { Text } = require('@keystonejs/fields')

module.exports = {
    type: 'Json',
    implementation: JsonImplementation,
    adapters: {
        knex: JsonKnexFieldAdapter,
        mongoose: JsonMongooseFieldAdapter,
    },
    views: Text.views,
}
