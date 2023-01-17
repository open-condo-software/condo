const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const { SbbolRequestApi } = require('./SbbolRequestApi')
const { getAccessTokenForUser } = require('./utils')

const SBBOL_FINTECH_CONFIG = conf.SBBOL_FINTECH_CONFIG ? JSON.parse(conf.SBBOL_FINTECH_CONFIG) : {}
const SBBOL_PFX = conf.SBBOL_PFX ? JSON.parse(conf.SBBOL_PFX) : {}

const logger = getLogger('sbbol/SbbolFintechApi')

/**
 * Error reponse from SBBOL Fintech API
 *
 * @typedef {Object} SbbolFintechApiError
 * @property {string} cause - error code string
 * @property {string} referenceId - UUID of error report from SBBOL
 * @property {string} message - textual description in russian
 * @property {Object[]} checks - actually, SBBOL does nt
 * @property {String[]} fieldNames - fields, caused error
 * @example
 * {
 *   cause: 'DATA_NOT_FOUND_EXCEPTION',
 *   referenceId: 'dc32b274-7943-4f2d-ab4c-dc75ea1272bc',
 *   message: 'Не найдено ни одного заранее данного акцепта за указанную дату'
 * }
 * @example
 * {
 *   cause: 'VALIDATION_FAULT',
 *   referenceId: '19c8f679-ef70-4194-bfa2-2eb9a29aad62',
 *   message: 'Объект PaymentRequestOut не соответствует модели',
 *   checks: [ [Object] ],
 *   fieldNames: [ 'operationCode' ]
 * },
 */

/**
 * @typedef SbbolFintechApiResponse
 * @property {Object|SbbolFintechApiError} data
 * @property {Number} statusCode - standard status code from HTTP (in practice, I've noticed 201, 400)
 */

/**
 * Advance acceptance record, returned by Fintech API
 *
 * @typedef AdvanceAcceptance
 * @property {String} payerInn
 * @property {String} payerAccount
 * @property {String} payerBankBic
 * @property {String} payerBankCorrAccount
 * @property {String} purpose
 * @property {String} payerOrgIdHash
 * @property {String} payerName
 * @property {String} sinceDate
 * @property {String} untilDate
 * @property {Boolean} active
 * @property bundles
 * @example
 * {"payerInn":"5034800639","payerAccount":"40702810840147579127","payerBankBic":"044525225","payerBankCorrAccount":"30101810400000000225","purpose":"оплата подпики за сервис по договору ХХХ от 22.22.2222","payerOrgIdHash":"340f51b2defe28355c0655febc03ac26b7f78b07f0be7704ec2ec1cdb5905e4c","payerName":"ООО \"ПАРТНЕР-626\"","sinceDate":"2021-10-07","untilDate":null,"active":true,"bundles":null}
 */

/**
 * Signature information, used to sign some requests to Fintech API
 *
 * @typedef Signature
 * @property {String} base64Encoded - Значение электронной подписи, закодированное в Base64
 * @property {String} certificateUuid - Уникальный идентификатор сертификата ключа проверки электронной подписи (UUID)
 */


class SbbolFintechApi extends SbbolRequestApi {

    get apiPrefix () {
        return '/fintech/api'
    }
}

/**
 * Obtains access token and creates instance of `SbbolFintechApi` with all the data, passed to it.
 * NOTE: Constructor of `SbbolFintechApi` cannot be used, because it must be async, which is not allowed by ES6
 * @return {null|SbbolFintechApi}
 */
const initSbbolFintechApi = async (userId) => {
    let accessToken
    try {
        // `service_organization_hashOrgId` is a `userInfo.HashOrgId` from SBBOL, that corresponds to our organization
        // as a partner of SBBOL
        accessToken = await getAccessTokenForUser(userId)
    } catch (error) {
        logger.error({
            msg: 'Failed to obtain organization access token from SBBOL',
            error,
            hashOrgId: SBBOL_FINTECH_CONFIG.service_organization_hashOrgId,
        })
        return null
    }

    const fintechApi = new SbbolFintechApi({
        accessToken,
        host: SBBOL_FINTECH_CONFIG.host,
        port: SBBOL_FINTECH_CONFIG.port,
        certificate: SBBOL_PFX.certificate,
        passphrase: SBBOL_PFX.passphrase,
    })

    return fintechApi
}

module.exports = {
    SbbolFintechApi,
    initSbbolFintechApi,
}