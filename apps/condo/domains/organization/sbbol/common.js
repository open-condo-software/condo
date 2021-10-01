const Ajv = require('ajv')
const conf = process.env

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

const SBBOL_API_RESPONSE = {
    DATA_NOT_FOUND_EXCEPTION: 'DATA_NOT_FOUND_EXCEPTION',
}

const debugMessage = (...arguments) => {
    if (conf.SBBOL_DEBUG) {
        console.debug(...arguments)
    }
}

module.exports = {
    SbbolUserInfoJSONValidation,
    SBBOL_IMPORT_NAME,
    SBBOL_SESSION_KEY,
    SBBOL_API_RESPONSE,
    debugMessage,
}