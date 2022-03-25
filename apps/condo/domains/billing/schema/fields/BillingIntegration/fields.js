const { Text, Checkbox } = require('@keystonejs/fields')

const DETAILS_TITLE_FIELD = {
    schemaDoc: 'Title of confirmation/details page of integration',
    type: Text,
    isRequired: true,
}

const IS_HIDDEN_FIELD = {
    schemaDoc: 'Indicates whether the integration is hidden inside the CRM',
    type: Checkbox,
    defaultValue: false,
    isRequired: true,
}

module.exports = {
    DETAILS_TITLE_FIELD,
    IS_HIDDEN_FIELD,
}