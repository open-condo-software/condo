const Ajv = require('ajv')
const addFormats = require('ajv-formats')
const { padStart } = require('lodash')

const { getLogger } = require('@open-condo/keystone/logging')

const ajv = new Ajv()
addFormats(ajv)

const BUILD_BICRYPT_ID_CRYPTO_INFO_SCHEMA = {
    type: 'object',
    properties: {
        certCenterCode: { type: 'string', format: 'regex', pattern:  '^(?:[0-9A-Z]{4}|[0-9A-Z]{6})$' },
        certCenterNum: { type: 'string', format: 'regex', pattern: '^[0-9A-Z]{2}$' },
        firstName: { type: 'string', minLength: 1 },
        lastName: { type: 'string', minLength: 1 },
        patronymic: { type: 'string', minLength: 1 },

    },
    required: ['certCenterCode', 'certCenterNum', 'firstName', 'lastName', 'patronymic'],
}

const formatValidator = ajv.compile(BUILD_BICRYPT_ID_CRYPTO_INFO_SCHEMA)

const logger = getLogger()

/**
 * Builds bicryptId string in format, required by SBBOL API
 *
 * @param certCenterCode 4- or 6-digit code
 * @param certCenterNum 2-digit index with values in set `00`…`09`…`0A`…`0Z`…`ZZ`
 * @param firstName of certificate owner
 * @param lastName of certificate owner
 * @param patronymic of certificate owner
 * @return {String}
 */
function buildBicryptId (cryptoInfo) {
    const { certCenterCode, certCenterNum, firstName, lastName, patronymic } = cryptoInfo
    if (!formatValidator(cryptoInfo)) {
        const errors = formatValidator.errors.map(({ message, instancePath }) => ({
            instancePath,
            message,
        }))
        logger.error({ msg: 'wrong format of arguments', data: { cryptoInfo, errors } })
        throw new Error('Wrong format of arguments, passed to `buildBicryptId` function')
    }
    const paddedCertCenterNum = certCenterCode.length === 4
        ? padStart(certCenterNum, 4, '0')
        : certCenterNum
    const result = certCenterCode + paddedCertCenterNum + 's' + lastName + firstName[0] + patronymic[0]
    return result
}

module.exports = {
    buildBicryptId,
}
