const { Text, Relationship, CalendarDay } = require('@keystonejs/fields')
const { Json } = require('@core/keystone/fields')

const INTEGRATION_CONTEXT_FIELD = {
    schemaDoc: 'Integration context',
    type: Relationship,
    ref: 'BillingIntegrationOrganizationContext',
    isRequired: true,
    knexOptions: { isNotNullable: true }, // Required relationship only!
    kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
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

const BILLING_ORGANIZATION_FIELD = {
    schemaDoc: 'Billing organization',
    type: Relationship,
    ref: 'BillingOrganization',
    isRequired: true,
    knexOptions: { isNotNullable: false }, // Relationship only!
    kmigratorOptions: { null: true, on_delete: 'models.CASCADE' },
}


const BILLING_PROPERTY_FIELD = {
    schemaDoc: 'Billing property',
    type: Relationship,
    ref: 'BillingProperty',
    isRequired: true,
    knexOptions: { isNotNullable: true }, // Relationship only!
    kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
}

const BILLING_ACCOUNT_FIELD = {
    schemaDoc: 'Billing account',
    type: Relationship,
    ref: 'BillingAccount',
    isRequired: true,
    knexOptions: { isNotNullable: true }, // Relationship only!
    kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
}

const BILLING_ACCOUNT_METER_FIELD = {
    schemaDoc: 'Billing account meter',
    type: Relationship,
    ref: 'BillingAccountMeter',
    isRequired: true,
    knexOptions: { isNotNullable: true }, // Relationship only!
    kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
}

const PERIOD_FIELD = {
    schemaDoc: 'Period date: Generated on template 01_<month>_<year>',
    type: CalendarDay,
    isRequired: true,
    // TODO(pahaz): validate it
}

module.exports = {
    INTEGRATION_CONTEXT_FIELD,
    IMPORT_ID_FIELD,
    RAW_DATA_FIELD,
    BILLING_PROPERTY_FIELD,
    BILLING_ACCOUNT_FIELD,
    BILLING_ACCOUNT_METER_FIELD,
    PERIOD_FIELD,
    BILLING_ORGANIZATION_FIELD,
}
