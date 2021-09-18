const Ajv = require('ajv')
const SBBOL_IMPORT_NAME = 'sbbol'
const SBBOL_SESSION_KEY = 'sbbol'

const SbbolUserInfoSchema = {
    type: 'object',
    properties: {
        // Organization's field
        OrgName: { type: 'string' },
        orgOgrn: { type: 'string' },
        orgLawFormShort: { type: 'string' },
        // Organization's meta fields
        inn: { type: 'string' },
        orgKpp: { type: 'string' },
        orgJuridicalAddress: { type: 'string' },
        orgFullName: { type: 'string' },
        terBank: { type: 'string' },
        // Organization's admin user fields
        userGuid: { type: 'string' },
        email: { type: 'string' },
        phone_number: { type: 'string' },
    },
    required: ['inn', 'OrgName', 'orgJuridicalAddress', 'email', 'userGuid', 'phone_number'],
    additionalProperties: true,
}

const SbbolUserInfoJSONValidation = new Ajv().compile(SbbolUserInfoSchema)

module.exports = {
    SbbolUserInfoJSONValidation,
    SBBOL_IMPORT_NAME,
    SBBOL_SESSION_KEY,
}