const { CalendarDay, File } = require('@keystonejs/fields')

const { Json } = require('@open-condo/keystone/fields')

const { validatePeriod } = require('@condo/domains/billing/utils/validation.utils')
const FileAdapter = require('@condo/domains/common/utils/fileAdapter')

const BILLING_FILE_ADAPTER = new FileAdapter('BillingIntegrations')

const STATIC_FILE_FIELD = {
    type: File,
    isRequired: false,
    adapter: BILLING_FILE_ADAPTER,
}

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
    STATIC_FILE_FIELD,
    BILLING_FILE_ADAPTER,
    PERIOD_FIELD,
    RAW_DATA_FIELD,
}