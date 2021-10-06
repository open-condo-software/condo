const { Relationship } = require('@keystonejs/fields')

const ACQUIRING_CONTEXT_FIELD = {
    schemaDoc: 'Link to acquiring context',
    type: Relationship,
    ref: 'AcquiringIntegrationContext',
    isRequired: true,
    knexOptions: { isNotNullable: true }, // Required relationship only!
    kmigratorOptions: { null: false, on_delete: 'models.PROTECT' },
}

const ACQUIRING_INTEGRATION_FIELD = {
    schemaDoc: 'Link to acquiring integration',
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