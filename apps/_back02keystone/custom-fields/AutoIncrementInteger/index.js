const { AutoIncrementInteger, AutoIncrementIntegerKnexFieldAdapter } = require('./Implementation')
const { Integer } = require('@keystonejs/fields')

module.exports = {
    type: 'AutoIncrementInteger',
    implementation: AutoIncrementInteger,
    adapters: {
        knex: AutoIncrementIntegerKnexFieldAdapter,
    },
    views: Integer.views,
}
