const { Text } = require('@keystonejs/fields')

const { DateInterval } = require('./Implementation')

module.exports = {
    type: 'DateInterval',
    implementation: DateInterval,
    views: Text.views,
    adapters: Text.adapters,
}
