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

module.exports = {
    INTEGRATION_CONTEXT_FIELD,
    IMPORT_ID_FIELD,
    RAW_DATA_FIELD,
}
