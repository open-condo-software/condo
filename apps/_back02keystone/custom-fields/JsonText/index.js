const { JsonTextImplementation, JsonTextKnexFieldAdapter, JsonTextMongooseFieldAdapter } = require('./Implementation')
const { Text } = require('@keystonejs/fields')

module.exports = {
    type: 'JsonText',
    implementation: JsonTextImplementation,
    adapters: {
        knex: JsonTextKnexFieldAdapter,
        mongoose: JsonTextMongooseFieldAdapter,
    },
    views: Text.views,
}
