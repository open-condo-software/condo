const { Relationship } = require('@keystonejs/fields')

const ACQUIRING_CONTEXT_FIELD = {
    schemaDoc: 'Acquiring context, which used to link organization and acquiring integration and provide storage for organization-acquiring-specific settings / state',
    type: Relationship,
    ref: 'AcquiringIntegrationContext',
    isRequired: true,
    knexOptions: { isNotNullable: true }, // Required relationship only!
    kmigratorOptions: { null: false, on_delete: 'models.PROTECT' },
}

const ACQUIRING_INTEGRATION_FIELD = {
    schemaDoc: 'Acquiring integration. Determines way of user\'s payment',
    type: Relationship,
    ref: 'AcquiringIntegration',
    isRequired: true,
    knexOptions: { isNotNullable: true }, // Required relationship only!
    kmigratorOptions: { null: false, on_delete: 'models.PROTECT' },
}

module.exports = {
    ACQUIRING_CONTEXT_FIELD,
    ACQUIRING_INTEGRATION_FIELD,
}