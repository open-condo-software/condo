const { Relationship } = require('@keystonejs/fields')

const INTEGRATION_CONTEXT_FIELD = {
    schemaDoc: 'Integration context',
    type: Relationship,
    ref: 'BillingIntegrationOrganizationContext',
    isRequired: true,
    knexOptions: { isNotNullable: true }, // Required relationship only!
    kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
    access: { update: false },
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

module.exports = {
    BILLING_ACCOUNT_FIELD,
    BILLING_PROPERTY_FIELD,
    BILLING_ORGANIZATION_FIELD,
    INTEGRATION_CONTEXT_FIELD,
}