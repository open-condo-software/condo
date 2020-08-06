const { OptionsMongooseFieldAdapter } = require('../Options/Implementation')
const { OptionsKnexFieldAdapter } = require('../Options/Implementation')
const { JsonTextImplementation } = require('./Implementation')
const { Text } = require('@keystonejs/fields');

module.exports = {
    type: 'JsonText',
    implementation: JsonTextImplementation,
    adapters: {
        knex: OptionsKnexFieldAdapter,
        mongoose: OptionsMongooseFieldAdapter,
    },
    views: {
        Controller: Text.views.Controller,
        Field: Text.views.Field,
    },
}
