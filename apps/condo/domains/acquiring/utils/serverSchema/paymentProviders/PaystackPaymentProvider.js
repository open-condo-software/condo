const { RENT_PAYMENT_PROVIDER_PAYSTACK } = require('@condo/domains/acquiring/constants/rentPayment')
const {
    PAYMENT_DONE_STATUS,
    PAYMENT_ERROR_STATUS,
    PAYMENT_INIT_STATUS,
    PAYMENT_PROCESSING_STATUS,
} = require('@condo/domains/acquiring/constants/payment')

const { PaymentProvider } = require('./PaymentProvider')

class PaymentProviderConfigurationError extends Error {
    constructor (provider, message = `${provider} provider is not configured`) {
        super(message)
        this.name = 'PaymentProviderConfigurationError'
        this.code = 'PAYMENT_PROVIDER_NOT_CONFIGURED'
        this.provider = provider
    }
}

class PaymentProviderValidationError extends Error {
    constructor (provider, field, message) {
        super(message)
        this.name = 'PaymentProviderValidationError'
        this.code = 'PAYMENT_PROVIDER_INVALID_PAYMENT_DATA'
        this.provider = provider
        this.field = field
    }
}

class PaystackPaymentProvider extends PaymentProvider {
    get provider () {
        return RENT_PAYMENT_PROVIDER_PAYSTACK
    }

    getStatusMap () {
        return {
            ...super.getStatusMap(),
            abandoned: PAYMENT_PROCESSING_STATUS,
            charge_success: PAYMENT_DONE_STATUS,
            ongoing: PAYMENT_PROCESSING_STATUS,
        }
    }

    getVerificationOutcome (providerStatus) {
        const statusKey = providerStatus ? String(providerStatus).trim().toLowerCase() : ''

        if (statusKey === 'success' || statusKey === 'charge_success') {
            return {
                internalStatus: 'confirmed',
                status: PAYMENT_DONE_STATUS,
                confirmed: true,
                rationale: null,
            }
        }

        if (statusKey === 'failed') {
            return {
                internalStatus: 'failed',
                status: PAYMENT_ERROR_STATUS,
                confirmed: false,
                rationale: null,
            }
        }

        if (['abandoned', 'ongoing', 'pending'].includes(statusKey)) {
            return {
                internalStatus: 'pending',
                status: PAYMENT_PROCESSING_STATUS,
                confirmed: false,
                rationale: null,
            }
        }

        return {
            internalStatus: 'pending',
            status: PAYMENT_PROCESSING_STATUS,
            confirmed: false,
            rationale: statusKey
                ? `Unknown Paystack status "${statusKey}" is treated as pending in stub mode`
                : 'Missing Paystack status is treated as pending in stub mode',
        }
    }

    resolveProviderStatus (payload = {}) {
        const nestedPayload = payload && payload.data && typeof payload.data === 'object' ? payload.data : null
        const event = payload && payload.event ? String(payload.event).trim().toLowerCase() : null
        const providerStatus = payload.providerStatus ||
            payload.status ||
            (nestedPayload && nestedPayload.status)

        if (providerStatus) return String(providerStatus)
        if (event === 'charge.success') return 'success'

        return null
    }

    mapProviderReference (payload = {}) {
        const nestedPayload = payload && payload.data && typeof payload.data === 'object' ? payload.data : null
        const paystackReference = payload.reference ||
            (nestedPayload && (nestedPayload.reference || nestedPayload.gateway_response))

        return paystackReference ? String(paystackReference) : super.mapProviderReference(payload)
    }

    getSecretKey () {
        return this.options.secretKey ||
            this.options.paystackSecretKey ||
            (this.options.credentials && this.options.credentials.secretKey) ||
            process.env.PAYSTACK_SECRET_KEY ||
            null
    }

    validatePaymentData (paymentData = {}) {
        const amount = paymentData.amount
        const currency = paymentData.currency || paymentData.currencyCode
        const payer = paymentData.payer && typeof paymentData.payer === 'object' ? paymentData.payer : {}
        const payerEmail = payer.email || paymentData.payerEmail || paymentData.email
        const payerPhone = payer.phone || paymentData.payerPhone || paymentData.phone
        const organization = paymentData.organization
        const payment = paymentData.payment
        const context = paymentData.context
        const hasOrganization = Boolean(
            organization && (organization.id || typeof organization === 'string')
        )
        const hasPaymentContext = Boolean(
            (payment && (payment.id || typeof payment === 'string')) ||
            (context && (context.id || typeof context === 'string'))
        )

        if (amount === null || amount === undefined || String(amount).trim() === '') {
            throw new PaymentProviderValidationError(this.provider, 'amount', 'Paystack payment initialization requires amount')
        }
        if (!currency || !String(currency).trim()) {
            throw new PaymentProviderValidationError(this.provider, 'currency', 'Paystack payment initialization requires currency')
        }
        if (!payerEmail && !payerPhone) {
            throw new PaymentProviderValidationError(this.provider, 'payer', 'Paystack payment initialization requires payer email or phone')
        }
        if (!hasOrganization && !hasPaymentContext) {
            throw new PaymentProviderValidationError(this.provider, 'context', 'Paystack payment initialization requires organization or payment context')
        }
    }

    async initializePayment (paymentData = {}) {
        if (!this.getSecretKey()) {
            throw new PaymentProviderConfigurationError(this.provider)
        }

        this.validatePaymentData(paymentData)

        return {
            provider: this.provider,
            status: PAYMENT_INIT_STATUS,
            providerStatus: 'initialized',
            paymentUrl: null,
            externalTransactionId: this.mapProviderReference(paymentData),
            paymentData,
            metadata: {
                stub: true,
            },
        }
    }

    async verifyPayment (paymentData = {}) {
        if (!this.getSecretKey()) {
            throw new PaymentProviderConfigurationError(this.provider)
        }

        const providerStatus = this.resolveProviderStatus(paymentData)
        const outcome = this.getVerificationOutcome(providerStatus)

        return {
            provider: this.provider,
            confirmed: outcome.confirmed,
            confirmedAt: outcome.confirmed ? (paymentData.confirmedAt || new Date().toISOString()) : null,
            status: outcome.status,
            internalStatus: outcome.internalStatus,
            providerStatus,
            paymentMethod: paymentData.paymentMethod,
            externalTransactionId: this.mapProviderReference(paymentData),
            paymentData,
            metadata: {
                stub: true,
                ...(outcome.rationale ? { rationale: outcome.rationale } : {}),
            },
        }
    }

    async handleWebhook (payload) {
        const providerStatus = this.resolveProviderStatus(payload)
        const outcome = this.getVerificationOutcome(providerStatus)

        return this.buildWebhookResponse({
            acknowledged: true,
            processed: false,
            payload,
            providerStatus,
            status: outcome.status,
            metadata: {
                event: payload && payload.event ? payload.event : null,
                internalStatus: outcome.internalStatus,
                ...(outcome.rationale ? { rationale: outcome.rationale } : {}),
                signatureVerified: false,
                stub: true,
            },
        })
    }
}

module.exports = {
    PaymentProviderConfigurationError,
    PaymentProviderValidationError,
    PaystackPaymentProvider,
}
