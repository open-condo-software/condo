class PaymentProvider {
    constructor (options = {}) {
        this.options = options
    }

    async createPayment () {
        throw new Error('PaymentProvider.createPayment is not implemented')
    }

    async confirmPayment () {
        throw new Error('PaymentProvider.confirmPayment is not implemented')
    }

    async parseWebhook () {
        throw new Error('PaymentProvider.parseWebhook is not implemented')
    }
}

module.exports = {
    PaymentProvider,
}