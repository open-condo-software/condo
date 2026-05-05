const crypto = require('crypto')

const { RENT_PAYMENT_PROVIDER_PAYSTACK } = require('@condo/domains/acquiring/constants/rentPayment')
const {
    PAYMENT_DONE_STATUS,
    PAYMENT_INIT_STATUS,
    PAYMENT_PROCESSING_STATUS,
} = require('@condo/domains/acquiring/constants/payment')

const { PaymentProvider } = require('./PaymentProvider')
const {
    convertMajorAmountToPaystackSubunits,
    createPaystackVerificationClient,
    getVerificationOutcome,
    normalizeCurrencyCode,
} = require('./PaystackVerificationClient')
const {
    PaymentProviderConfigurationError,
    PaymentProviderValidationError,
} = require('./paymentProviderErrors')

class PaystackPaymentProvider extends PaymentProvider {
    get provider () {
        return RENT_PAYMENT_PROVIDER_PAYSTACK
    }

    isConfigured () {
        return Boolean(this.getSecretKey())
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
        return getVerificationOutcome(providerStatus)
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

    getWebhookSignatureHeader (requestMetadata = {}) {
        if (!requestMetadata || typeof requestMetadata !== 'object') return null

        const headers = requestMetadata.headers && typeof requestMetadata.headers === 'object'
            ? requestMetadata.headers
            : requestMetadata

        return headers['x-paystack-signature'] ||
            headers['X-Paystack-Signature'] ||
            null
    }

    getWebhookRawBody (payload, requestMetadata = {}) {
        if (requestMetadata && Buffer.isBuffer(requestMetadata.rawBody)) return requestMetadata.rawBody
        if (requestMetadata && typeof requestMetadata.rawBody === 'string') return requestMetadata.rawBody
        if (requestMetadata && Buffer.isBuffer(requestMetadata.body)) return requestMetadata.body
        if (requestMetadata && typeof requestMetadata.body === 'string') return requestMetadata.body
        if (typeof payload === 'string' || Buffer.isBuffer(payload)) return payload

        return null
    }

    async verifyWebhookSignature (payload, requestMetadata = {}) {
        const secretKey = this.getSecretKey()
        const signature = this.getWebhookSignatureHeader(requestMetadata)
        const rawBody = this.getWebhookRawBody(payload, requestMetadata)

        if (!secretKey) {
            return {
                signatureVerified: false,
                signatureVerificationRequired: true,
                signatureVerificationReason: 'Paystack webhook signature verification secret is not configured',
            }
        }

        if (!signature) {
            return {
                signatureVerified: false,
                signatureVerificationRequired: true,
                signatureVerificationReason: 'Paystack signature header is missing',
            }
        }

        if (!rawBody) {
            return {
                signatureVerified: false,
                signatureVerificationRequired: true,
                signatureVerificationReason: 'Paystack webhook raw body is unavailable for signature verification',
            }
        }

        const digest = crypto
            .createHmac('sha512', secretKey)
            .update(rawBody)
            .digest('hex')
        const normalizedSignature = String(signature).trim().toLowerCase()

        if (digest.length !== normalizedSignature.length) {
            return {
                signatureVerified: false,
                signatureVerificationRequired: true,
                signatureVerificationReason: 'Paystack signature does not match the webhook payload',
            }
        }

        const matches = crypto.timingSafeEqual(
            Buffer.from(digest, 'utf8'),
            Buffer.from(normalizedSignature, 'utf8')
        )

        return {
            signatureVerified: matches,
            signatureVerificationRequired: true,
            signatureVerificationReason: matches
                ? 'Paystack signature verified successfully'
                : 'Paystack signature does not match the webhook payload',
        }
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
            authorizationUrl: null,
            paymentUrl: null,
            externalTransactionId: this.mapProviderReference(paymentData),
            paymentData,
            metadata: {
                amountConvention: {
                    internal: {
                        amount: String(paymentData.amount),
                        unit: 'major',
                    },
                    provider: {
                        amount: convertMajorAmountToPaystackSubunits(paymentData.amount, paymentData.currency || paymentData.currencyCode),
                        unit: 'subunit',
                    },
                },
                stub: true,
            },
        }
    }

    async verifyPayment (paymentData = {}) {
        const client = createPaystackVerificationClient(this.options)
        const providerReference = paymentData.providerReference || this.mapProviderReference(paymentData)

        return client.verifyTransaction({
            providerReference,
            secretKey: this.getSecretKey(),
            paymentMethod: paymentData.paymentMethod,
            confirmedAt: paymentData.confirmedAt,
            paymentData,
        })
    }

    async handleWebhook (payload, requestMetadata = {}) {
        const providerStatus = this.resolveProviderStatus(payload)
        const outcome = this.getVerificationOutcome(providerStatus)
        const signatureMetadata = await this.resolveWebhookSignatureMetadata(payload, requestMetadata)

        return this.buildWebhookResponse({
            acknowledged: true,
            processed: false,
            payload,
            providerStatus,
            status: outcome.status,
            internalStatus: outcome.internalStatus,
            metadata: {
                event: payload && payload.event ? payload.event : null,
                internalStatus: outcome.internalStatus,
                ...(outcome.rationale ? { rationale: outcome.rationale } : {}),
                amountConvention: {
                    internalUnit: 'major',
                    providerUnit: 'subunit',
                    providerCurrency: normalizeCurrencyCode(
                        payload && payload.data && payload.data.currency
                            ? payload.data.currency
                            : payload && payload.data && payload.data.currencyCode
                                ? payload.data.currencyCode
                                : null
                    ),
                },
                stub: true,
                ...signatureMetadata,
            },
        })
    }
}

module.exports = {
    PaymentProviderConfigurationError,
    PaymentProviderValidationError,
    PaystackPaymentProvider,
}
