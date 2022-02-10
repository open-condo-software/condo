const { Text, Checkbox } = require('@keystonejs/fields')

const DETAILS_TITLE_FIELD = {
    schemaDoc: 'Title of confirmation/details page of integration',
    type: Text,
    isRequired: true,
}

const DETAILS_TEXT_FIELD = {
    schemaDoc: 'Text of confirmation/details page of integration written in markdown',
    type: Text,
    isRequired: false,
}

const SHORT_DESCRIPTION_FIELD = {
    schemaDoc: 'Short integration description, that would be shown on settings card',
    type: Text,
    isRequired: false,
}

const IS_HIDDEN_FIELD = {
    schemaDoc: 'Indicates whether the integration is hidden inside the CRM',
    type: Checkbox,
    defaultValue: false,
    isRequired: true,
}

module.exports = {
    DETAILS_TITLE_FIELD,
    DETAILS_TEXT_FIELD,
    SHORT_DESCRIPTION_FIELD,
    IS_HIDDEN_FIELD,
}