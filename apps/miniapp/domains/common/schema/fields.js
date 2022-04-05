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
    schemaDoc: 'Client-side device identification used for the anti-fraud detection. ' +
        'Example `{ dv: 1, fingerprint: \'VaxSw2aXZa\'}`. ' +
        'Where the `fingerprint` should be the same for the same devices and it\'s not linked to the user ID. ' +
        'It\'s the device ID like browser / mobile application / remote system',
    graphQLInputType: 'SenderFieldInput',
    graphQLReturnType: 'SenderField',
    graphQLAdminFragment: '{ dv fingerprint }',
    extendGraphQLTypes: [
        'type SenderField { dv: Int!, fingerprint: String! }',
        'input SenderFieldInput { dv: Int!, fingerprint: String! }',
    ],
    isRequired: true,
    kmigratorOptions: { null: false },
    hooks: {
        validateInput: (args) => {
            if (!hasValidJsonStructure(args, true, 1, {
                fingerprint: {
                    presence: true,
                    format: /^[a-zA-Z0-9!#$%()*+-;=,:[\]/.?@^_`{|}~]{5,42}$/,
                    length: { minimum: 5, maximum: 42 },
                },
            })) return
        },
    },
}

module.exports = {
    DV_FIELD,
    SENDER_FIELD,
}
