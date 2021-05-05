const { Relationship } = require('@keystonejs/fields')

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
    COMMON_AND_ORGANIZATION_OWNED_FIELD,
}
