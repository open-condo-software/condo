const { Select: KSSelect } = require('@open-keystone/fields')

const { Select } = require('./implementation')

module.exports = {
    type: 'Select',
    implementation: Select,
    views: KSSelect.views,
    adapters: KSSelect.adapters,
}
