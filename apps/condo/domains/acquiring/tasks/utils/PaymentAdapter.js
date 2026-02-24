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
            const { status, data } = await this.doCall(this._getCardTokensUrl)
            const cardTokens = data?.cardTokens

            if (status !== 200 || !Array.isArray(cardTokens)) {
                return false
            }

            return cardTokens.some(token => token.id === cardId)
        } catch (err) {
            logger.error({
                msg: 'failed to obtain user cards',
                err,
            })
            return false
        }
    }

    async proceedPayment (cardId) {
        try {
            const params = { cardTokenId: cardId, successUrl: '', failureUrl: '' }
            const { status, data } = await this.doCall(this._directPaymentUrl, params)

            const { orderId, error, url } = data || {}

            if (status !== 200 || orderId === null || orderId === undefined) {
                return {
                    paid: false,
                    errorCode: RECURRENT_PAYMENT_PROCESS_ERROR_ACQUIRING_PAYMENT_PROCEED_FAILED_CODE,
                    errorMessage: error,
                }
            } else if (url && typeof url === 'string' && url.toLowerCase().includes('/api/payment/success')) {
                return { paid: true }
            } else {
                return {
                    paid: false,
                    errorCode: RECURRENT_PAYMENT_PROCESS_ERROR_CARD_TOKEN_NOT_VALID_CODE,
                    errorMessage: 'CardToken is not valid',
                }
            }
        } catch (error) {
            const errorMessage = error?.errors?.[0]?.message || error?.message || JSON.stringify(error)
            return {
                paid: false,
                errorCode: RECURRENT_PAYMENT_PROCESS_ERROR_ACQUIRING_PAYMENT_PROCEED_FAILED_CODE,
                errorMessage,
            }
        }
    }

    async doCall (url, params = {}) {
        const query = new URLSearchParams(params).toString()
        const fullUrl = query ? `${url}?${query}` : url

        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch from ${fullUrl}: ${response.statusText}`)
        }

        const data = await response.json()

        return {
            status: response.status,
            data,
        }
    }
}

module.exports = {
    PaymentAdapter,
}