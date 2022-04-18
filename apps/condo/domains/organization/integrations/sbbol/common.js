const Ajv = require('ajv')
const pino = require('pino')
const falsey = require('falsey')
// NOTE: same as keystone logger
const logger = pino({ name: 'sbbol', enabled: falsey(process.env.DISABLE_LOGGING) })

const SBBOL_IMPORT_NAME = 'sbbol'
const SBBOL_FINGERPRINT_NAME = 'import-sbbol'
const SBBOL_SESSION_KEY = 'sbbol'

const SbbolUserInfoSchema = {
    type: 'object',
    properties: {
        // Organization's field
        OrgName: { type: 'string' },
        HashOrgId: { type: 'string' },
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
    required: ['inn', 'OrgName', 'userGuid', 'phone_number', 'HashOrgId'],
    additionalProperties: true,
}

function getSbbolUserInfoErrors (userInfo) {
    const ajv = new Ajv()
    ajv.validate(SbbolUserInfoSchema, userInfo)
    return (ajv.errors) ? ajv.errors.map(x => x.message) : []
}

module.exports = {
    getSbbolUserInfoErrors,
    SBBOL_IMPORT_NAME,
    SBBOL_SESSION_KEY,
    SBBOL_FINGERPRINT_NAME,
    logger,
}