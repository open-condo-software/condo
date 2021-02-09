const { AutoIncrementInteger, AutoIncrementIntegerKnexFieldAdapter, AutoIncrementIntegerMongooseFieldAdapter } = require('./Implementation')
const { Integer } = require('@keystonejs/fields')

module.exports = {
    type: 'AutoIncrementInteger',
    implementation: AutoIncrementInteger,
    adapters: {
        knex: AutoIncrementIntegerKnexFieldAdapter,
        mongoose: AutoIncrementIntegerMongooseFieldAdapter,
    },
    views: Integer.views,
}
