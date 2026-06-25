const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')

const { validatePeriod } = require('@condo/domains/billing/utils/validation.utils')

const BILLING_FILE_ADAPTER = new FileAdapter('BillingIntegrations')

const STATIC_FILE_FIELD = {
    type: 'File',
    isRequired: false,
    adapter: BILLING_FILE_ADAPTER,
}

const PERIOD_FIELD = {
    schemaDoc: 'Period date: Generated on template <year>-<month>-01',
    type: 'CalendarDay',
    isRequired: true,
    hooks: {
        validateInput: validatePeriod,
    },
}

const RAW_DATA_FIELD = {
    schemaDoc: 'Raw non-structured data obtained from the `billing data source`. Used only for the internal needs of the `integration component`.',
    type: 'Json',
    sensitive: true,
    isRequired: false,
}


const DISPLAY_PRIORITY_FIELD = {
    schemaDoc: 'The number used to determine the position of the integration among the others. ',
    type: 'Integer',
    isRequired: true,
    defaultValue: 1,
}

module.exports = {
    STATIC_FILE_FIELD,
    BILLING_FILE_ADAPTER,
    PERIOD_FIELD,
    RAW_DATA_FIELD,
    DISPLAY_PRIORITY_FIELD,
}
