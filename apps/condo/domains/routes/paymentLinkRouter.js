const querystring = require('querystring')
const { isNil } = require('lodash')
const { getLogger } = require('@condo/keystone/logging')
const logger = getLogger('payment/linkHandler')
const { getSchemaCtx } = require('@condo/keystone/schema')
const {
    registerMultiPaymentForOneReceipt,
    registerMultiPaymentForVirtualReceipt,
} = require('@condo/domains/acquiring/utils/serverSchema')

const sender = { dv: 1, fingerprint: 'payment-link-handler' }

class PaymentLinkRouter {
    async init () {
        const { keystone: context } = await getSchemaCtx('MultiPayment')
        this.context = context
    }

    async createMultiPaymentByReceipt (params) {
        const { acquiringIntegrationContextId, billingReceiptId } = params

        return await registerMultiPaymentForOneReceipt(this.context, {
            sender,
            receipt: { id: billingReceiptId },
            acquiringIntegrationContext: { id: acquiringIntegrationContextId },
        })
    }

    async createMultiPaymentByVirtualReceipt (params) {
        const {
            acquiringIntegrationContextId,
            currencyCode,
            amount,
            period,
            bic,
            bankAccount,
            accountNumber,
        } = params

        return await registerMultiPaymentForVirtualReceipt(this.context, {
            sender,
            receipt: {
                currencyCode,
                amount,
                period,
                recipient: {
                    bic,
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
        // first step is determinate is this request for virtual receipt or for regular one
        const isVirtual = this.isVirtualReceipt(req)

        try {
            if (isVirtual) {
                const params = this.extractVirtualReceiptParams(req)
                return await this.handlePaymentLink(
                    res,
                    params,
                    this.virtualReceiptPaymentValidator.bind(this),
                    this.createMultiPaymentByVirtualReceipt.bind(this)
                )
            } else {
                const params = this.extractRegularReceiptParams(req)
                return await this.handlePaymentLink(
                    res,
                    params,
                    this.regularReceiptPaymentValidator.bind(this),
                    this.createMultiPaymentByReceipt.bind(this)
                )
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

    isVirtualReceipt (req) {
        const { billingReceiptId } = this.extractRegularReceiptParams(req)

        return isNil(billingReceiptId)
    }

    extractRegularReceiptParams (req) {
        const {
            aic: acquiringIntegrationContextId,
            br: billingReceiptId,
            su: successUrl,
            fu: failureUrl,
        } = req.query

        return {
            acquiringIntegrationContextId,
            billingReceiptId,
            successUrl,
            failureUrl,
        }
    }

    extractVirtualReceiptParams (req) {
        const {
            aic: acquiringIntegrationContextId,
            cc: currencyCode,
            a: amount,
            p: period,
            b: bic,
            ba: bankAccount,
            an: accountNumber,
            su: successUrl,
            fu: failureUrl,
        } = req.query

        return {
            acquiringIntegrationContextId,
            currencyCode,
            amount,
            period,
            bic,
            bankAccount,
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
            throw new Error('bad_request')
        }
    }

    regularReceiptPaymentValidator (params) {
        const { acquiringIntegrationContextId, billingReceiptId } = params

        // do some sort of minimal validations
        if (isNil(acquiringIntegrationContextId) || isNil(billingReceiptId)) {
            throw new Error('bad_request')
        }
    }

    virtualReceiptPaymentValidator (params) {
        const {
            acquiringIntegrationContextId,
            currencyCode,
            amount,
            period,
            bic,
            bankAccount,
            accountNumber,
        } = params

        // do some sort of minimal validations
        if (isNil(acquiringIntegrationContextId)
            || isNil(currencyCode)
            || isNil(amount)
            || isNil(period)
            || isNil(bic)
            || isNil(bankAccount)
            || isNil(accountNumber)) {
            throw new Error('bad_request')
        }
    }
}

module.exports = {
    PaymentLinkRouter,
}