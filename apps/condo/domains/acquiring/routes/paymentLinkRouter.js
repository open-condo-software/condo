const querystring = require('querystring')

const { get, has, isNil } = require('lodash')

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
        invoicesQp,
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
    registerMultiPaymentForOneReceipt,
    registerMultiPaymentForVirtualReceipt,
    registerMultiPaymentForInvoices,
    Payment,
} = require('@condo/domains/acquiring/utils/serverSchema')
const { PAYMENT_LINK } = require('@condo/domains/common/constants/featureflags')
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')

const logger = getLogger()

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
        const paymentsCount = await Payment.count(this.context, {
            receipt: { id: billingReceiptId },
            status_in: [PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS],
            deletedAt: null,
        })

        return paymentsCount > 0
    }

    async checkInvoicesAlreadyPaid ({ invoicesIdsStr }) {
        const paymentsCount = await Payment.count(this.context, {
            invoice: { id_in: invoicesIdsStr.split(',') },
            status_in: [PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS],
            deletedAt: null,
        })

        return paymentsCount > 0
    }

    async createMultiPaymentByReceipt (params) {
        const { acquiringIntegrationContextId, billingReceiptId } = params

        return await registerMultiPaymentForOneReceipt(this.context, {
            sender,
            receipt: { id: billingReceiptId },
            acquiringIntegrationContext: { id: acquiringIntegrationContextId },
        })
    }

    async createMultiPaymentByInvoices (params) {
        const { invoicesIdsStr } = params

        return await registerMultiPaymentForInvoices(this.context, {
            sender,
            invoices: invoicesIdsStr.split(',').map((id) => ({ id })),
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

    async handlePaymentLink (res, params, validatorFn, multiPaymentCreatorFn, includePaymentIdInUrl) {
        // validation of common params and multi payment type specific
        this.commonParamsValidator(params)
        validatorFn(params)

        // create multi payment
        const multiPayment = await multiPaymentCreatorFn(params)

        // redirect end user to acquiring service
        const { anonymousPaymentUrl } = multiPayment
        const { successUrl: successUrlFromParams, failureUrl } = params

        let successUrl
        if (includePaymentIdInUrl) {
            const multiPaymentId = get(multiPayment, 'multiPaymentId')
            const url = new URL(successUrlFromParams)
            url.searchParams.set('multiPaymentId', multiPaymentId)

            successUrl = url.toString()
        } else {
            successUrl = successUrlFromParams
        }

        const paramsString = querystring.stringify({ successUrl, failureUrl })
        return res.redirect(`${anonymousPaymentUrl}?${paramsString}`)
    }

    async handleRequest (req, res) {
        const isEnabled = await featureToggleManager.isFeatureEnabled({ req }, PAYMENT_LINK)

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
                    this.createMultiPaymentByVirtualReceipt.bind(this),
                )
            } else if (this.isReceipt(req)) {
                const params = this.extractRegularReceiptParams(req)

                // for regular receipts we can check if billing receipt
                // is already paid
                const isAlreadyPaid = await this.checkReceiptAlreadyPaid(params)
                if (isAlreadyPaid) {
                    return this.redirectIfAlreadyPaid(res, params)
                }

                return await this.handlePaymentLink(
                    res,
                    params,
                    this.regularReceiptPaymentValidator.bind(this),
                    this.createMultiPaymentByReceipt.bind(this),
                )
            } else if (this.isInvoices(req)) {
                const params = this.extractInvoicesParams(req)
                const isAlreadyPaid = await this.checkInvoicesAlreadyPaid(params)
                if (isAlreadyPaid) {
                    return this.redirectIfAlreadyPaid(res, params)
                }

                try {
                    return await this.handlePaymentLink(
                        res,
                        params,
                        this.invoicesPaymentValidator.bind(this),
                        this.createMultiPaymentByInvoices.bind(this),
                        true,
                    )
                } catch (err) {
                    logger.error({
                        msg: 'handleRequest invoice error', 
                        err,
                        req,
                    })

                    const { failureUrl } = params
                    const errorPageUrl = `${conf.SERVER_URL}/500`
                    const redirectUrl = new URL(failureUrl || errorPageUrl)

                    redirectUrl.searchParams.set('linkNotActual', 'true')

                    return res.redirect(redirectUrl.toString())
                }
            } else {
                logger.warn({ msg: 'no handler for payment link', reqId: get(req, 'id'), url: get(req, 'url') })
                return res.redirect('/404-paymentLinkNoHandler.html')
            }
        } catch (err) {
            // print error log
            logger.error({
                msg: 'handleRequest error',
                req,
                err,
            })

            // in case if any exception appears, we have to redirect to some sort of error page
            return res.redirect('/500')
        }
    }

    async checkLimits (req) {
        const ip = req.ip.split(':').pop()
        await redisGuard.checkCustomLimitCounters(
            ip,
            PAYMENT_LINK_WINDOW_SIZE,
            MAX_PAYMENT_LINK_REQUEST_BY_WINDOW,
            { req },
        )
    }

    isVirtualReceipt (req) {
        const { billingReceiptId } = this.extractRegularReceiptParams(req)
        const { invoicesIdsStr } = this.extractInvoicesParams(req)

        return isNil(billingReceiptId) && isNil(invoicesIdsStr)
    }

    isReceipt (req) {
        return has(req, ['query', billingReceiptQp])
    }

    isInvoices (req) {
        return has(req, ['query', invoicesQp])
    }

    async redirectIfAlreadyPaid (res, params) {
        const { failureUrl } = params
        const errorPageUrl = `${conf.SERVER_URL}/500`
        const redirectUrl = new URL(failureUrl || errorPageUrl)

        // set common QP
        redirectUrl.searchParams.set('alreadyPaid', 'true')

        // redirect
        return res.redirect(redirectUrl.toString())
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

    extractInvoicesParams (req) {
        const {
            [invoicesQp]: invoicesIdsStr,
            [successUrlQp]: successUrl,
            [failureUrlQp]: failureUrl,
        } = req.query

        return {
            invoicesIdsStr,
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

    invoicesPaymentValidator (params) {
        const { invoicesIdsStr } = params

        if (isNil(invoicesIdsStr)) {
            throw new Error('Missing QP: invoicesIdsStr')
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
