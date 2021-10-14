const qs = require('qs')
const { get } = require('lodash')
const { SbbolRequestApi } = require('./SbbolRequestApi')
const { SBBOL_API_RESPONSE } = require('./common')
const { buildDigestFrom } = require('./utils/buildDigestFrom')

/**
 * Error reponse from Fintech API
 * @typedef {Object} FintechErrorResponse
 * @property {string} cause
 * @property {string} referenceId
 * @property {string} message
 * @example
 * {"cause":"DATA_NOT_FOUND_EXCEPTION","referenceId":"dc32b274-7943-4f2d-ab4c-dc75ea1272bc","message":"Не найдено ни одного заранее данного акцепта за указанную дату"}
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
 * Vat information for payment
 * @readonly
 * @enum {String}
 */
const VAT_TYPE = {
    INCLUDED: 'INCLUDED',
    NO_VAT: 'NO_VAT',
    MANUAL: 'MANUAL',
}

/**
 * @typedef PaymentRequestOutVat
 * @property {Number} amount - Сумма НДС
 * @property {String} rate - Ставка НДС,
 * @property {String} type - Способ расчета НДС
 * @property
 */

/**
 * @typedef PaymentRequestOut
 * @property {String} acceptanceTerm - Срок для акцепта (поле 36). Указывается количество дней для получения акцепта плательщика,
 * @property {Number} amount - Сумма платежа
 * @ignore @property {String} bankComment - Банковский комментарий к статусу документа (documentation in SBBOL is wrong, this field is filled by bank)
 * @ignore @property {String} bankStatus - Статус документа (documentation in SBBOL is wrong, this field is filled by bank)
 * @property {String} [crucialFieldsHash] - Hash от ключевых полей документа
 * @property {String} date - Дата составления документа
 * @property {String} deliveryKind - Вид платежа
 * @property {Signature[]} digestSignatures - Электронные подписи по дайджесту документа
 * @property {String} externalId - Идентификатор документа, присвоенный партнёром (UUID)
 * @property {String} [number] - Номер документа
 * @property {String} operationCode - Код операции
 * @property {String} payeeAccount - Счёт получателя платежа
 * @property {String} payeeBankBic - БИК получателя платежа
 * @property {String} payeeBankCorrAccount - Корсчёт банка получателя платежа
 * @property {String} payeeInn - ИНН получателя платежа
 * @property {String} payeeName - Полное наименование получателя платежа
 * @property {String} payerAccount - Счёт плательщика
 * @property {String} payerBankBic - БИК банка плательщика
 * @property {String} payerBankCorrAccount - Корсчёт банка плательщика
 * @property {String} payerInn - ИНН плательщика
 * @property {String} payerName - Полное наименование плательщика
 * @property {String} paymentCondition - Условие оплаты (поле 35). Указывается цифра "1" - заранее данный акцепт плательщика или цифра "2" - требуется получение акцепта плательщика
 * @property {String} priority - Очерёдность платежа
 * @property {String} purpose - Назначение платежа
 * @property {VAT_TYPE} vat - Данные НДС
 * @property voCode - Код вида валютной операции
 */

/**
 * Offers access to only some set of methods
 * Requires separate `clientId` and secret (differs from authentication)
 */
class SbbolFintechApi extends SbbolRequestApi {

    /**
     * Fetches changes in subscription for given date.
     * According to official comments from Fintech API representatives, `/v1/partner-info/advance-acceptances` method returns data **changes** only for current day.
     * It does not just returns all subscriptions for services of our organization, It's even not possible ;)
     * If active subscriptions are present in response, then it means, that offer was accepted at given date.
     * If not active subscriptions are present, then it means, that offer was declined at given date.
     *
     * @param date
     * @param clientId
     * @return {Promise<AdvanceAcceptance[]|FintechErrorResponse>}
     */
    async fetchAdvanceAcceptances ({ date, clientId }) {
        const jsonResultString = await this.request({
            method: 'GET',
            path: this.advanceAcceptancesPath,
            body: { clientId, date },
        })
        const result = JSON.parse(jsonResultString)
        if (get(result, 'cause') === SBBOL_API_RESPONSE.DATA_NOT_FOUND_EXCEPTION) {
            return []
        }
        if (!Array.isArray(result)) {
            console.error('Cannot parse advanceAcceptances')
            return []
        }
        return result
    }

    /**
     * Posts unsigned payment request to SBBOL without `crucialFieldsHash`
     * TODO(antonal): sign payment request with signature, obtained from SBBOL representatives
     * TODO(antonal): calculate hash for digested data
     * TODO(antonal): recognize error response
     * @param {PaymentRequestOut} data
     * @return {Promise<unknown>}
     */
    async postPaymentRequest(body) {
        const response = this.request({
            method: 'POST',
            path: this.postPaymentRequestPath,
            body,
            headers: {
                'Content-Type': 'application/json',
            },
        })
        const parsedResponse = JSON.parse(response)
        return parsedResponse
    }

    get advanceAcceptancesPath () {
        return `${this.apiPrefix}/v1/partner-info/advance-acceptances`
    }

    get postPaymentRequestPath() {
        return `${this.apiPrefix}/v1/payment-requests/outgoing`
    }

    get apiPrefix () {
        return '/fintech/api'
    }
}

module.exports = {
    SbbolFintechApi,
}