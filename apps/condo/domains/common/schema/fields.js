const { hasValidJsonStructure } = require('@condo/domains/common/utils/validation.utils')
const { Integer } = require('@keystonejs/fields')
const { Json } = require('@core/keystone/fields')

const DV_FIELD = {
    type: Integer,
    schemaDoc: 'Data structure Version',
    isRequired: true,
    kmigratorOptions: { null: false },
}

const SENDER_FIELD = {
    type: Json,
    schemaDoc: 'Client-side devise identification used for the anti-fraud detection. ' +
        'Example `{ dv: 1, fingerprint: \'VaxSw2aXZa\'}`. ' +
        'Where the `fingerprint` should be the same for the same devices and it\'s not linked to the user ID. ' +
        'It\'s the device ID like browser / mobile application / remote system',
    isRequired: true,
    kmigratorOptions: { null: false },
    hooks: {
        validateInput: (args) => {
            if (!hasValidJsonStructure(args, true, 1, {
                fingerprint: {
                    type: 'string',
                    presence: true,
                    length: { minimum: 5, maximum: 40 },
                },
            })) return
        },
    },
}

module.exports = {
    DV_FIELD,
    SENDER_FIELD,
}
