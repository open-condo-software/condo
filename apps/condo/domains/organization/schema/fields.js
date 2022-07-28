const { Relationship } = require('@keystonejs/fields')

const ORGANIZATION_OWNED_FIELD = {
    schemaDoc: 'Ref to the organization. The object will be deleted if the organization ceases to exist',
    type: Relationship,
    ref: 'Organization',
    isRequired: true,
    knexOptions: { isNotNullable: true }, // Relationship only!
    kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
    // TODO(pahaz): check access to organization!
    access: {
        read: true,
        create: true,
        update: false,
    },
}

const COMMON_AND_ORGANIZATION_OWNED_FIELD = {
    schemaDoc: 'Ref to the organization. If this ref is null the object is common for all organizations',
    type: Relationship,
    ref: 'Organization',
    isRequired: true,
    kmigratorOptions: { null: true, on_delete: 'models.CASCADE' },
    // TODO(pahaz): check access to organization (can't create without organization)!
    access: {
        read: true,
        create: true,
        update: true,
    },
}

module.exports = {
    ORGANIZATION_OWNED_FIELD,
    COMMON_AND_ORGANIZATION_OWNED_FIELD,
}
