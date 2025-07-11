const get = require('lodash/get')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const { SbbolRequestApi } = require('./SbbolRequestApi')
const { getAccessTokenForUser } = require('./utils')

const SBBOL_FINTECH_CONFIG = conf.SBBOL_FINTECH_CONFIG ? JSON.parse(conf.SBBOL_FINTECH_CONFIG) : {}
const SBBOL_PFX = conf.SBBOL_PFX ? JSON.parse(conf.SBBOL_PFX) : {}

const logger = getLogger('sbbol-fintech-api')

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


/**
 * @typedef SbbolAccount
 * @property {string} bic (string, optional)    БИК банка, где открыт счет
 * @property {string[]} blockedQueuesInfo (AccountBlockInfo[], optional)    Приостановления операций по счету выше очередности (блокировки по очередности)
 * @property {string[]} blockedSumQueuesInfo (AccountBlockInfo[], optional)    Приостановления операций по счету выше очередности на сумму
 * @property {string[]} blockedSums (AccountBlockInfo[], optional)    Заблокированные (арестованные) суммы на счете
 * @property {boolean} business (boolean, optional)    Признак бизнес-счета
 * @property {boolean} businessNewType (boolean, optional)    Признак бизнес-счета 'нового' типа
 * @property {number} cdiAcptDocQnt (integer, optional)    Содержит информацию о расчетных документах, ожидающих акцепта. Количество документов
 * @property {number} cdiAcptDocSum (number, optional)    Содержит информацию о расчетных документах, ожидающих акцепта. Сумма документов
 * @property {number} cdiCart2DocQnt (integer, optional)    Содержит информацию о расчетных документах, помещенных в картотеку к счету 90902 (картотека 2). Количество документов
 * @property {number} cdiCart2DocSum (number, optional)    Содержит информацию о расчетных документах, помещенных в картотеку к счету 90902 (картотека 2). Сумма документов
 * @property {number} cdiPermDocQnt (integer, optional)    Содержит информацию о расчетных документах, ожидающих разрешения на проведение операции. Количество документов
 * @property {number} cdiPermDocSum (number, optional)    Содержит информацию о расчетных документах, ожидающих разрешения на проведение операции. Сумма документов
 * @property {string} closeDate (string, optional)    Дата закрытия счета
 * @property {string} comment (string, optional)    Примечание
 * @property {boolean} creditBlocked (boolean, optional)    Признак полной блокировки счета по кредиту
 * @property {string} creditBlockedBeginDate (string, optional)    Дата начала действия ограничения
 * @property {string} creditBlockedCause (string, optional)    Основание ареста
 * @property {string} creditBlockedEndDate (string, optional)    Дата снятия ограничения
 * @property {string} creditBlockedInitiator (string, optional)    Наименование органа, наложившего арест
 * @property {string} creditBlockedTaxAuthorityCode (string, optional)    Код налогового органа, наложившего арест
 * @property {string} currencyCode (string, optional)    Цифровой код валюты счета
 * @property {boolean} dbo (boolean, optional)    Признак обслуживания в ДБО
 * @property {boolean} debitBlocked (boolean, optional)    Признак полной блокировки счета по дебету
 * @property {string} debitBlockedBeginDate (string, optional)    Дата начала действия ограничения
 * @property {string} debitBlockedCause (string, optional)    Основание ареста
 * @property {string} debitBlockedEndDate (string, optional)    Дата снятия ограничения
 * @property {string} debitBlockedInitiator (string, optional)    Наименование органа, наложившего арест
 * @property {string} debitBlockedTaxAuthorityCode (string, optional)    Код налогового органа, наложившего арест
 * @property {number} minBalance (number, optional)    Минимальный поддерживаемый (неснижаемый) остаток на счете
 * @property {string} mode (string, optional)    Режим работы счета = [STANDART, FORBIDDEN_RECEIVING, ONLY_RECEIVING]
 * @property {string} name (string, optional)    Наименование счета
 * @property {boolean} notDelay (boolean, optional)    Признак возможности проведения неотложных платежей
 * @property {string} number (string, optional)    Номер счета (20 сиволов)
 * @property {string} openDate (string, optional)    Дата открытия счета
 * @property {number} overdraft (number, optional)    Сумма общего лимита овердрафта в валюте счета
 * @property {boolean} passive (boolean, optional)    Признак пассивности счета
 * @property {string} state (string, optional)    Состояние счета = [OPEN, BLOCKED, CLOSED]
 * @property {string} type (string, optional)    Тип счета = [assuranceRegistration, calculated, transit, specialTransit, budget, loan, deposit]
 * @property {boolean} urgent (boolean, optional)    Признак возможности проведения срочных платежей
 */

/**
 * @typedef SbbolClientInfo
 * @property {string} shortName (string, optional)	Сокращенное наименование организации
 * @property {string} fullName (string, optional)	Полное наименование организации
 * @property {string} ogrn (string, optional)	ОГРН
 * @property {string} inn (string, optional)	ИНН / КИО
 * @property {string} orgForm (string, optional)	Организационно-правовая форма организации клиента
 * @property {Address[]} addresses (Address[], optional)	Адреса (все заведенные для клиента)
 * @property {SbbolAccount[]} accounts (SbbolAccount[], optional)	Счета организации клиента, доступные партнеру
 * (если клиент выбрал счет при заключении оферты)
 * @property {string[]} kpps (string[], optional)	КПП (все заведенные для организации клиента)
 * @description There are more fields that can only be obtained by expanding the request scope,
 * so for a complete list of what you can get, you need to go to the SberBusiness documentation
 */

/**
 * SBBOL format response parser
 *
 * @param {{data: Object, statusCode: Number}} response SBBOL formatted response
 * @param {Number} statusCode successful response code
 * @return {{error: any, statusCode: Number}|{data: any}}
 */
function parseSbbolResponse (response, statusCode) {
    try {
        const jsonData = JSON.parse(get(response, 'data'))

        if (response.statusCode === statusCode) {
            return { data: jsonData }
        } else {
            return { error: jsonData, statusCode: response.statusCode }
        }
    } catch (err) {
        return logger.error({ msg: 'error parsing response from SBBOL', err, data: { response } })
    }
}

/**
 * Offers access to only some set of methods
 * Requires separate `clientId` and secret (differs from authentication)
 */
class SbbolFintechApi extends SbbolRequestApi {

    get apiPrefix () {
        return '/fintech/api'
    }

    /**
     * Get extended client info request, posted with `getClientInfoRequest`
     *
     * @return {Promise<{error: any}|{data: SbbolClientInfo}>}
     */
    async getClientInfo () {
        const { data, statusCode } = await this.request({
            method: 'GET',
            path: this.clientInfoRequestPath,
        })

        return parseSbbolResponse({ data, statusCode }, 200)
    }

    get clientInfoRequestPath () {
        return `${this.apiPrefix}/v1/client-info`
    }

    /**
     * Get transactions request, posted with `getStatementTransactionsRequest`
     * @typedef StatementTransactions
     * @property {accountNumber} SbbolAccount number
     * @property {statementDate} Date - optional
     * @property {page} page - optional
     * @return {Promise<{error: any}|{data: StatementTransactions}>}
     */
    async getStatementTransactions (accountNumber, statementDate, page = 1, curFormat) {
        const { data, statusCode } = await this.request({
            method: 'GET',
            path: this.statementTransactionsRequestPath,
            body: {
                accountNumber,
                statementDate,
                page,
                curFormat,
            },
        })
        return parseSbbolResponse({ data, statusCode }, 200)
    }

    /**
     * Get balance statement request, posted with `getStatementSummary`
     * @typedef StatementSummary
     * @property {accountNumber} SbbolAccount number
     * @property {statementDate} Date - optional
     * @property {page} page - optional
     * @return {Promise<{error: any}|{data: StatementSummary}>}
     */
    async getStatementSummary (accountNumber, statementDate, page = 1) {
        const { data, statusCode } = await this.request({
            method: 'GET',
            path: this.getStatementSummaryRequestPath,
            body: {
                accountNumber,
                statementDate,
                page,
            },
        })
        return parseSbbolResponse({ data, statusCode }, 200)
    }

    get statementTransactionsRequestPath () {
        return `${this.apiPrefix}/v2/statement/transactions`
    }

    get getStatementSummaryRequestPath () {
        return `${this.apiPrefix}/v2/statement/summary`
    }
}

/**
 * Obtains access token and creates instance of `SbbolFintechApi` with all the data, passed to it.
 * NOTE: Constructor of `SbbolFintechApi` cannot be used, because it must be async, which is not allowed by ES6
 * @return {null|SbbolFintechApi}
 */
const initSbbolFintechApi = async (userId, organizationId, useExtendedConfig) => {
    let accessToken
    try {
        // `service_organization_hashOrgId` is a `userInfo.HashOrgId` from SBBOL, that corresponds to our organization
        // as a partner of SBBOL
        ({ accessToken } = await getAccessTokenForUser(userId, organizationId, useExtendedConfig))
    } catch (err) {
        logger.error({
            msg: 'Failed to obtain organization access token from SBBOL',
            err,
            data: { hashOrgId: SBBOL_FINTECH_CONFIG.service_organization_hashOrgId },
        })
        return null
    }
    return new SbbolFintechApi({
        accessToken,
        host: SBBOL_FINTECH_CONFIG.host,
        port: SBBOL_FINTECH_CONFIG.port,
        certificate: SBBOL_PFX.certificate,
        passphrase: SBBOL_PFX.passphrase,
    })
}

const initSbbolClientWithToken = (accessToken, useExtendedConfig) => {
    return new SbbolFintechApi({
        accessToken,
        host: SBBOL_FINTECH_CONFIG.host,
        port: SBBOL_FINTECH_CONFIG.port,
        certificate: SBBOL_PFX.certificate,
        passphrase: SBBOL_PFX.passphrase,
    })
}

module.exports = {
    SbbolFintechApi,
    initSbbolFintechApi,
    initSbbolClientWithToken,
}