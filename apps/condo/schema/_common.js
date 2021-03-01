const { Relationship, Integer } = require('@keystonejs/fields')
const { Json } = require('@core/keystone/fields')

const { hasValidJsonStructure } = require('../utils/validation.utils')

const DV_FIELD = {
    factory: () => 1,
    type: Integer,
    schemaDoc: 'Data structure Version',
    isRequired: true,
    kmigratorOptions: { null: false },
}

const SENDER_FIELD_CONSTRAINS = {
    fingerprint: {
        presence: true,
        format: /^[a-zA-Z0-9!#$%()*+-;=,:[\]/.?@^_`{|}~]{5,32}$/,
        length: { maximum: 32, minimum: 5 },
    },
}

const SENDER_FIELD = {
    factory: () => JSON.stringify({ dv: '1', fingerprint: 'VaxSw2aXZa', userId: 'pL7dnHUPGX1KpRsOXun' }),
    type: Json,
    schemaDoc: 'Client-side devise identification used for the anti-fraud detection. ' +
        'Example `{ dv: \'1\', fingerprint: \'VaxSw2aXZa\'}`. ' +
        'Where the `fingerprint` should be the same for the same devices and it\'s not linked to the user ID. ' +
        'It\'s the device ID like browser / mobile application / remote system',
    isRequired: true,
    kmigratorOptions: { null: false },
    hooks: {
        validateInput: (args) => {
            if (!hasValidJsonStructure(args, true, 1, SENDER_FIELD_CONSTRAINS)) return
        },
    },
}

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
    DV_FIELD,
    SENDER_FIELD,
    ORGANIZATION_OWNED_FIELD,
    COMMON_AND_ORGANIZATION_OWNED_FIELD,
}
