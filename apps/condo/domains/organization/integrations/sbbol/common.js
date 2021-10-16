const Ajv = require('ajv')
const conf = process.env
const dayjs = require('dayjs')

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

// eslint-disable-next-line no-shadow-restricted-names
const debugMessage = (...arguments) => {
    if (conf.SBBOL_DEBUG) {
        console.debug(dayjs().format('YYYY-MM-DD HH:mm:ssZ[Z]'))
        console.debug(...arguments)
    }
}

module.exports = {
    SbbolUserInfoJSONValidation,
    SBBOL_IMPORT_NAME,
    SBBOL_SESSION_KEY,
    debugMessage,
}