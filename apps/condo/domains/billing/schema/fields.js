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

module.exports = {
    INTEGRATION_CONTEXT_FIELD,
    IMPORT_ID_FIELD,
    RAW_DATA_FIELD,
    BILLING_PROPERTY_FIELD,
    BILLING_ACCOUNT_FIELD,
}
