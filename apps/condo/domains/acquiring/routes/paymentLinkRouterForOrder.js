const querystring = require('querystring')

const { isNil } = require('lodash')

const conf = require('@open-condo/config')
const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const {
    PAYMENT_LINK_QP: {
        acquiringIntegrationContextQp,
        successUrlQp,
        failureUrlQp,
        orderQp,
    },
} = require('@condo/domains/acquiring/constants/links')
const {
    PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS,
} = require('@condo/domains/acquiring/constants/payment')
const { Payment, registerMultiPaymentForOrder } = require('@condo/domains/acquiring/utils/serverSchema')
const { PAYMENT_LINK } = require('@condo/domains/common/constants/featureflags')
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')

const logger = getLogger('payment/linkHandler')

const PAYMENT_LINK_WINDOW_SIZE = 60 // seconds
const MAX_PAYMENT_LINK_REQUEST_BY_WINDOW = 5

const sender = { dv: 1, fingerprint: 'payment-link-handler' }
const redisGuard = new RedisGuard()

class PaymentLinkRouterForOrder {
    async init () {
        const { keystone: context } = await getSchemaCtx('MultiPayment')
        this.context = context
    }

    async checkOrderAlreadyPaid ({ orderId }) {
        const payments = await Payment.getAll(this.context, {
            order: { id: orderId },
            status_in: [PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS],
            deletedAt: null,
        })

        return payments.length > 0
    }

    async createMultiPaymentByOrder (params) {
        const { acquiringIntegrationContextId, orderId } = params

        return await registerMultiPaymentForOrder(this.context, {
            sender,
            order: { id: orderId },
            acquiringIntegrationContext: { id: acquiringIntegrationContextId },
        })
    }

    async handlePaymentLink (res, params, validatorFn, multiPaymentCreatorFn) {
        // validation of common params and multi payment type specific
        this.commonParamsValidator(params)
        validatorFn(params)

        // create multi payment
        const multiPayment = await multiPaymentCreatorFn(params)

        // redirect end user to acquiring service
        const { anonymousPaymentUrl } = multiPayment
        const { successUrl, failureUrl } = params
        const paramsString = querystring.stringify({ successUrl, failureUrl })
        return res.redirect(`${anonymousPaymentUrl}?${paramsString}`)
    }

    async handleRequest (req, res) {
        const isEnabled = await featureToggleManager.isFeatureEnabled(this.context, PAYMENT_LINK)

        if (!isEnabled) {
            return res.redirect('/404')
        }

        try {
            await this.checkLimits(req)

            const params = this.extractOrderParams(req)

            // we can check if order is already paid
            const isAlreadyPaid = await this.checkOrderAlreadyPaid(params)
            if (isAlreadyPaid) {
                const { failureUrl } = params
                const errorPageUrl = `${conf.SERVER_URL}/500-error.html`
                const redirectUrl = new URL(failureUrl || errorPageUrl)

                // set common QP
                redirectUrl.searchParams.set('alreadyPaid', 'true')

                // redirect
                return res.redirect(redirectUrl.toString())
            }

            return await this.handlePaymentLink(
                res,
                params,
                this.orderPaymentValidator.bind(this),
                this.createMultiPaymentByOrder.bind(this)
            )
        } catch (error) {
            // print error log
            logger.error({
                msg: error.message,
                params: req.query,
                error,
            })

            // in case if any exception appears, we have to redirect to some sort of error page
            return res.redirect('/500-error.html')
        }
    }

    async checkLimits (req) {
        const ip = req.ip.split(':').pop()
        await redisGuard.checkCustomLimitCounters(
            ip,
            PAYMENT_LINK_WINDOW_SIZE,
            MAX_PAYMENT_LINK_REQUEST_BY_WINDOW,
        )
    }

    extractOrderParams (req) {
        const {
            [acquiringIntegrationContextQp]: acquiringIntegrationContextId,
            [orderQp]: orderId,
            [successUrlQp]: successUrl,
            [failureUrlQp]: failureUrl,
        } = req.query

        return {
            acquiringIntegrationContextId,
            orderId,
            successUrl,
            failureUrl,
        }
    }

    commonParamsValidator (params) {
        const {
            successUrl,
            failureUrl,
        } = params

        // do some sort of minimal validations
        if (isNil(successUrl) || isNil(failureUrl)) {
            throw new Error('Missing QP: successUrl/failureUrl')
        }
    }

    orderPaymentValidator (params) {
        const { acquiringIntegrationContextId, orderId } = params

        // do some sort of minimal validations
        if (isNil(acquiringIntegrationContextId) || isNil(orderId)) {
            throw new Error('Missing QP: acquiringIntegrationContextId/orderId')
        }
    }

}

module.exports = {
    PaymentLinkRouterForOrder,
}
