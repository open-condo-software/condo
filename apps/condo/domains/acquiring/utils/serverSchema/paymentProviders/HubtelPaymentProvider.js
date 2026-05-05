const { RENT_PAYMENT_PROVIDER_HUBTEL } = require('@condo/domains/acquiring/constants/rentPayment')
const {
    PAYMENT_DONE_STATUS,
    PAYMENT_ERROR_STATUS,
    PAYMENT_INIT_STATUS,
    PAYMENT_PROCESSING_STATUS,
} = require('@condo/domains/acquiring/constants/payment')

const { PaymentProvider } = require('./PaymentProvider')
const {
    PaymentProviderConfigurationError,
    PaymentProviderValidationError,
} = require('./PaystackPaymentProvider')

class HubtelPaymentProvider extends PaymentProvider {
    get provider () {
        return RENT_PAYMENT_PROVIDER_HUBTEL
    }

    getStatusMap () {
        return {
            ...super.getStatusMap(),
            completed: PAYMENT_DONE_STATUS,
            ongoing: PAYMENT_PROCESSING_STATUS,
            paid: PAYMENT_DONE_STATUS,
            queued: PAYMENT_PROCESSING_STATUS,
            successful: PAYMENT_DONE_STATUS,
        }
    }

    getVerificationOutcome (providerStatus) {
        const statusKey = providerStatus ? String(providerStatus).trim().toLowerCase() : ''

        if (['success', 'successful', 'completed', 'paid'].includes(statusKey)) {
            return {
                internalStatus: 'confirmed',
                status: PAYMENT_DONE_STATUS,
                confirmed: true,
                rationale: null,
            }
        }

        if (['failed', 'error', 'rejected'].includes(statusKey)) {
            return {
                internalStatus: 'failed',
                status: PAYMENT_ERROR_STATUS,
                confirmed: false,
                rationale: null,
            }
        }

        if ([
            'abandoned',
            'cancelled',
            'canceled',
            'expired',
            'initiated',
            'ongoing',
            'open',
            'pending',
            'processing',
            'queued',
        ].includes(statusKey)) {
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
                ? `Unknown Hubtel status "${statusKey}" is treated as pending in stub mode`
                : 'Missing Hubtel status is treated as pending in stub mode',
        }
    }

    resolveProviderStatus (payload = {}) {
        const nestedPayload = payload && payload.data && typeof payload.data === 'object' ? payload.data : null
        const providerStatus = payload.providerStatus ||
            payload.status ||
            payload.transactionStatus ||
            (nestedPayload && (
                nestedPayload.status ||
                nestedPayload.transactionStatus
            ))

        return providerStatus ? String(providerStatus) : null
    }

    mapProviderReference (payload = {}) {
        const nestedPayload = payload && payload.data && typeof payload.data === 'object' ? payload.data : null
        const hubtelReference = payload.clientReference ||
            payload.checkoutId ||
            (nestedPayload && (nestedPayload.clientReference || nestedPayload.checkoutId))

        return hubtelReference ? String(hubtelReference) : super.mapProviderReference(payload)
    }

    getSecretKey () {
        return this.options.secretKey ||
            this.options.hubtelSecretKey ||
            this.options.apiKey ||
            (this.options.credentials && (
                this.options.credentials.secretKey ||
                this.options.credentials.hubtelSecretKey ||
                this.options.credentials.apiKey
            )) ||
            process.env.HUBTEL_SECRET_KEY ||
            process.env.HUBTEL_API_KEY ||
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
            throw new PaymentProviderValidationError(this.provider, 'amount', 'Hubtel payment initialization requires amount')
        }
        if (!currency || !String(currency).trim()) {
            throw new PaymentProviderValidationError(this.provider, 'currency', 'Hubtel payment initialization requires currency')
        }
        if (!payerEmail && !payerPhone) {
            throw new PaymentProviderValidationError(this.provider, 'payer', 'Hubtel payment initialization requires payer email or phone')
        }
        if (!hasOrganization && !hasPaymentContext) {
            throw new PaymentProviderValidationError(this.provider, 'context', 'Hubtel payment initialization requires organization or payment context')
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
                internalStatus: outcome.internalStatus,
                signatureVerified: false,
                stub: true,
                ...(outcome.rationale ? { rationale: outcome.rationale } : {}),
            },
        })
    }
}

module.exports = {
    HubtelPaymentProvider,
}
