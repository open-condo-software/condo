const { Text } = require('@open-keystone/fields')

const { DateInterval } = require('./Implementation')

module.exports = {
    type: 'DateInterval',
    implementation: DateInterval,
    views: Text.views,
    adapters: Text.adapters,
}
