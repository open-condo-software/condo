const { Integer } = require('@keystonejs/fields')
const { Json } = require('@open-condo/keystone/fields')

const DV_FIELD = {
    type: Integer,
    schemaDoc: 'Data structure Version',
    isRequired: true,
    kmigratorOptions: { null: false },
}

const SENDER_FIELD = {
    type: Json,
    schemaDoc: 'Client-side devise identification used for the anti-fraud detection. ' +
        'Example `{ dv: \'1\', fingerprint: \'VaxSw2aXZa\'}`. ' +
        'Where the `fingerprint` should be the same for the same devices and it\'s not linked to the user ID. ' +
        'It\'s the device ID like browser / mobile application / remote system',
    isRequired: true,
    kmigratorOptions: { null: false },
}

module.exports = {
    DV_FIELD,
    SENDER_FIELD,
}
