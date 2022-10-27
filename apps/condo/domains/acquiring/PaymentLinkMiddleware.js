const express = require('express')
const { PaymentLinkRouter } = require('@condo/domains/acquiring/routes/paymentLinkRouter')
const { PAYMENT_LINK_PATH } = require('@condo/domains/acquiring/constants/links')

class PaymentLinkMiddleware {
    async prepareMiddleware () {
        const app = express()

        const router = new PaymentLinkRouter()
        await router.init()
        app.get(PAYMENT_LINK_PATH, router.handleRequest.bind(router))

        return app
    }
}

module.exports = {
    PaymentLinkMiddleware,
}
