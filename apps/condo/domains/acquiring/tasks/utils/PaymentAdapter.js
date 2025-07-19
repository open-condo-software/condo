const axios = require('axios').default
const { isNil, get } = require('lodash')

const { getLogger } = require('@open-condo/keystone/logging')

const {
    RECURRENT_PAYMENT_PROCESS_ERROR_ACQUIRING_PAYMENT_PROCEED_FAILED_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_CARD_TOKEN_NOT_VALID_CODE,
} = require('@condo/domains/acquiring/constants/recurrentPayment')

const logger = getLogger()

class PaymentAdapter {
    constructor ({ multiPaymentId, directPaymentUrl, getCardTokensUrl }) {
        this._multiPaymentId = multiPaymentId
        this._directPaymentUrl = directPaymentUrl
        this._getCardTokensUrl = getCardTokensUrl
    }

    async checkCardToken (cardId) {
        try {
            const { status, data: { cardTokens } } = await this.doCall(this._getCardTokensUrl)

            if (status !== 200) {
                return false
            }

            return !isNil(cardTokens.find(token => token.id === cardId))
        } catch (err) {
            logger.error({
                msg: 'failed to obtain user cards',
                err,
            })
        }
    }

    async proceedPayment (cardId) {
        try {
            const params = { cardTokenId: cardId, successUrl: '', failureUrl: '' }
            const { status, data } = await this.doCall(this._directPaymentUrl, params)
            const { orderId, error, url } = data

            if (status !== 200 || isNil(orderId)) {
                return {
                    paid: false,
                    errorCode: RECURRENT_PAYMENT_PROCESS_ERROR_ACQUIRING_PAYMENT_PROCEED_FAILED_CODE,
                    errorMessage: error,
                }
            } else if (!isNil(url) && url.toLowerCase().indexOf('/api/payment/success') > -1) {
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

    async doCall (url, params = {}) {
        return await axios.get(url, { params })
    }
}

module.exports = {
    PaymentAdapter,
}