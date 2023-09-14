const express = require('express')

const { PAYMENT_LINK_PATH } = require('@condo/domains/acquiring/constants/links')
const { PaymentLinkRouter } = require('@condo/domains/acquiring/routes/paymentLinkRouter')
const { PaymentLinkRouterForOrder } = require('@condo/domains/acquiring/routes/paymentLinkRouterForOrder')

class PaymentLinkMiddleware {
    async prepareMiddleware () {
        // this route can not be used for csrf attack (because no cookies and tokens are used in a public route)
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()

        const receiptRouter = new PaymentLinkRouter()
        await receiptRouter.init()
        app.get(PAYMENT_LINK_PATH, receiptRouter.handleRequest.bind(receiptRouter))

        const orderRouter = new PaymentLinkRouterForOrder()
        await orderRouter.init()
        app.get(PAYMENT_LINK_PATH, orderRouter.handleRequest.bind(orderRouter))

        return app
    }
}

module.exports = {
    PaymentLinkMiddleware,
}
