const { DateInterval } = require('./Implementation')
const { Text } = require('@keystonejs/fields')

module.exports = {
    type: 'DateInterval',
    implementation: DateInterval,
    views: Text.views,
    adapters: Text.adapters,
}
