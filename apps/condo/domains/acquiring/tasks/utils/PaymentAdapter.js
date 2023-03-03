class PaymentAdapter {
    constructor ({ multiPaymentId, directPaymentUrl, getCardTokensUrl }) {
        this._multiPaymentId = multiPaymentId
        this._directPaymentUrl = directPaymentUrl
        this._getCardTokensUrl = getCardTokensUrl
    }

    async checkCardToken (cardId) {
        // TODO return true/false
    }

    async proceedPayment (cardId) {
        // TODO return: {paid, errorMessage, errorCode: from constants}
    }
}

module.exports = PaymentAdapter