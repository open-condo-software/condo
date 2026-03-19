const get = require('lodash/get')
const isNil = require('lodash/isNil')

const { getLogger } = require('@open-condo/keystone/logging')

const {
    RECURRENT_PAYMENT_PROCESS_ERROR_ACQUIRING_PAYMENT_PROCEED_FAILED_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_CARD_TOKEN_NOT_VALID_CODE,
} = require('@condo/domains/acquiring/constants/recurrentPayment')

const logger = getLogger('SubscriptionPaymentAdapter')

class SubscriptionPaymentAdapter {
    constructor ({ hostUrl, organizationId, multiPaymentId = null, directPaymentUrl = null, getCardTokensUrl = null }) {
        this._hostUrl = hostUrl
        this._organizationId = organizationId
        this._multiPaymentId = multiPaymentId
        this._directPaymentUrl = directPaymentUrl
        this._getCardTokensUrl = getCardTokensUrl
    }

    async deleteCardToken (cardTokenId) {
        try {
            const deleteUrl = `${this._hostUrl}/api/clients/${this._organizationId}/card-tokens/${cardTokenId}`
            
            const response = await fetch(deleteUrl, {
                method: 'DELETE',
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                const errorMessage = get(errorData, 'message') || `HTTP ${response.status}`
                logger.error({
                    msg: 'failed to delete card token',
                    data: { cardTokenId, organizationId: this._organizationId, statusCode: response.status, errorMessage },
                })
                throw new Error(errorMessage)
            }

            logger.info({ msg: 'card token deleted', data: { cardTokenId, organizationId: this._organizationId } })
            return true
        } catch (error) {
            const errorMessage = get(error, 'message') || 'Unknown error'
            logger.error({
                msg: 'failed to delete card token',
                err: error,
                data: { cardTokenId, organizationId: this._organizationId, errorMessage },
            })
            throw error
        }
    }

    async proceedPayment (cardId) {
        try {
            const url = new URL(this._directPaymentUrl)
            url.searchParams.append('cardTokenId', cardId)
            url.searchParams.append('successUrl', '')
            url.searchParams.append('failureUrl', '')

            const response = await fetch(url.toString())
            const data = await response.json()
            const { orderId, error, url: resultUrl } = data

            if (!response.ok || isNil(orderId)) {
                return {
                    paid: false,
                    errorCode: RECURRENT_PAYMENT_PROCESS_ERROR_ACQUIRING_PAYMENT_PROCEED_FAILED_CODE,
                    errorMessage: error,
                }
            } else if (!isNil(resultUrl) && resultUrl.toLowerCase().indexOf('/api/payment/success') > -1) {
                return { paid: true }
            } else {
                return {
                    paid: false,
                    errorCode: RECURRENT_PAYMENT_PROCESS_ERROR_CARD_TOKEN_NOT_VALID_CODE,
                    errorMessage: 'CardToken is not valid',
                }
            }
        } catch (error) {
            const errorMessage = get(error, 'errors[0].message') || get(error, 'message') || JSON.stringify(error)
            return {
                paid: false,
                errorCode: RECURRENT_PAYMENT_PROCESS_ERROR_ACQUIRING_PAYMENT_PROCEED_FAILED_CODE,
                errorMessage,
            }
        }
    }
}

module.exports = {
    SubscriptionPaymentAdapter,
}
