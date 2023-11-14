const querystring = require('querystring')

const { has, isNil } = require('lodash')

const conf = require('@open-condo/config')
const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, getById } = require('@open-condo/keystone/schema')

const {
    PAYMENT_LINK_QP: {
        acquiringIntegrationContextQp,
        successUrlQp,
        failureUrlQp,
        billingReceiptQp,
        invoiceQp,
        currencyCodeQp,
        amountQp,
        periodQp,
        accountNumberQp,
    },
} = require('@condo/domains/acquiring/constants/links')
const {
    PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS,
} = require('@condo/domains/acquiring/constants/payment')
const {
    registerMultiPayment,
    registerMultiPaymentForOneReceipt,
    registerMultiPaymentForVirtualReceipt,
    Payment,
} = require('@condo/domains/acquiring/utils/serverSchema')
const { PAYMENT_LINK } = require('@condo/domains/common/constants/featureflags')
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')

const logger = getLogger('payment/linkHandler')

const PAYMENT_LINK_WINDOW_SIZE = 60 // seconds
const MAX_PAYMENT_LINK_REQUEST_BY_WINDOW = 5

const sender = { dv: 1, fingerprint: 'payment-link-handler' }
const redisGuard = new RedisGuard()

class PaymentLinkRouter {
    async init () {
        const { keystone: context } = await getSchemaCtx('MultiPayment')
        this.context = context
    }

    async checkReceiptAlreadyPaid ({ billingReceiptId }) {
        const payments = await Payment.getAll(this.context, {
            receipt: { id: billingReceiptId },
            status_in: [PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS],
            deletedAt: null,
        })

        return payments.length > 0
    }

    async checkInvoiceAlreadyPaid ({ invoiceId }) {
        const payments = await Payment.getAll(this.context, {
            invoice: { id: invoiceId },
            status_in: [PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS],
            deletedAt: null,
        })

        return payments.length > 0
    }

    async createMultiPaymentByReceipt (params) {
        const { acquiringIntegrationContextId, billingReceiptId } = params

        return await registerMultiPaymentForOneReceipt(this.context, {
            sender,
            receipt: { id: billingReceiptId },
            acquiringIntegrationContext: { id: acquiringIntegrationContextId },
        })
    }

    async createMultiPaymentByInvoice (params) {
        const { invoiceId } = params

        return await registerMultiPayment(this.context, {
            sender,
            invoices: [{ id: invoiceId }],
        })
    }

    async createMultiPaymentByVirtualReceipt (params) {
        const {
            acquiringIntegrationContextId,
            currencyCode,
            amount,
            period,
            accountNumber,
        } = params

        // the first step is to extract bic/bankAccount from the acquiringIntegrationContext.recipient
        const acquiringContext = await getById('AcquiringIntegrationContext', acquiringIntegrationContextId)

        // validate that recipient exists
        if (isNil(acquiringContext.recipient)) {
            throw new Error('AcquiringIntegrationContext.recipient is empty')
        }

        // validate that recipient data filled up properly
        const { bic, bankAccount } = acquiringContext.recipient
        if (isNil(bic) || isNil(bankAccount)) {
            throw new Error('AcquiringIntegrationContext.recipient is filled with empty bic/bankAccount')
        }

        return await registerMultiPaymentForVirtualReceipt(this.context, {
            sender,
            receipt: {
                currencyCode,
                amount,
                period,
                recipient: {
                    routingNumber: bic,
                    bankAccount,
                    accountNumber,
                },
            },
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

        // first step is determinate is this request for virtual receipt or for regular one
        const isVirtual = this.isVirtualReceipt(req)

        try {
            await this.checkLimits(req)

            if (isVirtual) {
                const params = this.extractVirtualReceiptParams(req)
                return await this.handlePaymentLink(
                    res,
                    params,
                    this.virtualReceiptPaymentValidator.bind(this),
                    this.createMultiPaymentByVirtualReceipt.bind(this)
                )
            } else {
                if (this.isReceipt(req)) {
                    const params = this.extractRegularReceiptParams(req)

                    // for regular receipts we can check if billing receipt
                    // is already paid
                    await this.redirectIfAlreadyPaid(res, params, this.checkReceiptAlreadyPaid.bind(this))

                    return await this.handlePaymentLink(
                        res,
                        params,
                        this.regularReceiptPaymentValidator.bind(this),
                        this.createMultiPaymentByReceipt.bind(this)
                    )
                } else if (this.isInvoice(req)) {
                    const params = this.extractInvoiceParams(req)
                    await this.redirectIfAlreadyPaid(res, params, this.checkInvoiceAlreadyPaid.bind(this))

                    return await this.handlePaymentLink(
                        res,
                        params,
                        this.invoicePaymentValidator.bind(this),
                        this.createMultiPaymentByInvoice.bind(this)
                    )
                }
            }
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

    isVirtualReceipt (req) {
        const { billingReceiptId } = this.extractRegularReceiptParams(req)

        return isNil(billingReceiptId)
    }

    isReceipt (req) {
        return has(req, ['query', billingReceiptQp])
    }

    isInvoice (req) {
        return has(req, ['query', invoiceQp])
    }

    async redirectIfAlreadyPaid (res, params, alreadyPaidChecker) {
        const isAlreadyPaid = await alreadyPaidChecker(params)
        if (isAlreadyPaid) {
            const { failureUrl } = params
            const errorPageUrl = `${conf.SERVER_URL}/500-error.html`
            const redirectUrl = new URL(failureUrl || errorPageUrl)

            // set common QP
            redirectUrl.searchParams.set('alreadyPaid', 'true')

            // redirect
            return res.redirect(redirectUrl.toString())
        }
    }

    extractRegularReceiptParams (req) {
        const {
            [acquiringIntegrationContextQp]: acquiringIntegrationContextId,
            [billingReceiptQp]: billingReceiptId,
            [successUrlQp]: successUrl,
            [failureUrlQp]: failureUrl,
        } = req.query

        return {
            acquiringIntegrationContextId,
            billingReceiptId,
            successUrl,
            failureUrl,
        }
    }

    extractInvoiceParams (req) {
        const {
            [invoiceQp]: invoiceId,
            [successUrlQp]: successUrl,
            [failureUrlQp]: failureUrl,
        } = req.query

        return {
            invoiceId,
            successUrl,
            failureUrl,
        }
    }

    extractVirtualReceiptParams (req) {
        const {
            [acquiringIntegrationContextQp]: acquiringIntegrationContextId,
            [currencyCodeQp]: currencyCode,
            [amountQp]: amount,
            [periodQp]: period,
            [accountNumberQp]: accountNumber,
            [successUrlQp]: successUrl,
            [failureUrlQp]: failureUrl,
        } = req.query

        return {
            acquiringIntegrationContextId,
            currencyCode,
            amount,
            period,
            accountNumber,
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

    regularReceiptPaymentValidator (params) {
        const { acquiringIntegrationContextId, billingReceiptId } = params

        // do some sort of minimal validations
        if (isNil(acquiringIntegrationContextId) || isNil(billingReceiptId)) {
            throw new Error('Missing QP: acquiringIntegrationContextId/billingReceiptId')
        }
    }

    invoicePaymentValidator (params) {
        const { invoiceId } = params

        if (isNil(invoiceId)) {
            throw new Error('Missing QP: invoiceId')
        }
    }

    virtualReceiptPaymentValidator (params) {
        const {
            acquiringIntegrationContextId,
            currencyCode,
            amount,
            period,
            accountNumber,
        } = params

        // do some sort of minimal validations
        if (isNil(acquiringIntegrationContextId)
            || isNil(currencyCode)
            || isNil(amount)
            || isNil(period)
            || isNil(accountNumber)) {
            throw new Error('Missing QP: acquiringIntegrationContextId/currencyCode/amount/period/accountNumber')
        }
    }
}

module.exports = {
    PaymentLinkRouter,
}
