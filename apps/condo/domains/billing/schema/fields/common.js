const { validatePeriod } = require('../../utils/validation.utils')
const { Text, CalendarDay } = require('@keystonejs/fields')
const { Json } = require('@core/keystone/fields')

const PERIOD_FIELD = {
    schemaDoc: 'Period date: Generated on template <year>-<month>-01',
    type: CalendarDay,
    isRequired: true,
    hooks: {
        validateInput: validatePeriod,
    },
}

// TODO(pahaz): add constrains with this field! + context
const IMPORT_ID_FIELD = {
    schemaDoc: '`billing data source` local object ID. Used only for the internal needs of the `integration component`',
    type: Text,
    isRequired: false,
}

const RAW_DATA_FIELD = {
    schemaDoc: 'Raw non-structured data obtained from the `billing data source`. Used only for the internal needs of the `integration component`.',
    type: Json,
    isRequired: true,
}

module.exports = {
    PERIOD_FIELD,
    IMPORT_ID_FIELD,
    RAW_DATA_FIELD,
}