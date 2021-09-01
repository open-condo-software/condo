const { AddressMetaDataFields } = require('./addressMetaGql')

const AddressMetaJSONSchema = {
    'type': 'object',
    'properties': {
        'value': {
            'type': 'string',
        },
        'unrestricted_value': {
            'type': 'string',
        },
        'dv': {
            'type': 'integer',
        },
        'data': {
            'type': 'object',
            'properties': Object.assign({},
                ...Object.keys(AddressMetaDataFields).map((x) => ({ [x]: { 'type': ['string', 'null'] } })),
                { history_values: { type: ['array', 'null'], items: { type: 'string' } } }
            ),
            'additionalProperties': true,
            'required': Object.keys(AddressMetaDataFields),
        },
    },
    'additionalProperties': true,
    'required': [
        'value',
        'unrestricted_value',
        'data',
        'dv',
    ],
}

module.exports = {
    AddressMetaJSONSchema,
    AddressMetaDataFields,
}