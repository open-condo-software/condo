const { validatePeriod } = require('@condo/domains/billing/utils/validation.utils')
const { CalendarDay } = require('@keystonejs/fields')
const { Json } = require('@open-condo/keystone/fields')

const PERIOD_FIELD = {
    schemaDoc: 'Period date: Generated on template <year>-<month>-01',
    type: CalendarDay,
    isRequired: true,
    hooks: {
        validateInput: validatePeriod,
    },
}

const RAW_DATA_FIELD = {
    schemaDoc: 'Raw non-structured data obtained from the `billing data source`. Used only for the internal needs of the `integration component`.',
    type: Json,
    isRequired: true,
}

module.exports = {
    PERIOD_FIELD,
    RAW_DATA_FIELD,
}