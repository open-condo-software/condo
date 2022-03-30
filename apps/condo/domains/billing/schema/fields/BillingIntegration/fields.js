const { Checkbox } = require('@keystonejs/fields')

const IS_HIDDEN_FIELD = {
    schemaDoc: 'Indicates whether the integration is hidden inside the CRM',
    type: Checkbox,
    defaultValue: false,
    isRequired: true,
}

module.exports = {
    IS_HIDDEN_FIELD,
}