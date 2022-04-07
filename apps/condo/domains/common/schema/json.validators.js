const Ajv = require('ajv')
const { getValidator } = require('./json.utils')
const { RECIPIENT_FIELDS_DEFINITION } = require('./fields')

const ajv = new Ajv()

const RecipientSchema = {
    type: 'object',
    properties: Object.assign({},
        ...Object.keys(RECIPIENT_FIELDS_DEFINITION).map((field) => ({ [field]: { type: 'string' } })),
    ),
    required: Object.keys(RECIPIENT_FIELDS_DEFINITION).filter(fieldName => RECIPIENT_FIELDS_DEFINITION[fieldName].slice(-1) === '!'),
    additionalProperties: false,
}


const RECIPIENT_VALIDATE_HOOK = getValidator(ajv.compile(RecipientSchema))


module.exports = {
    RECIPIENT_VALIDATE_HOOK,
}