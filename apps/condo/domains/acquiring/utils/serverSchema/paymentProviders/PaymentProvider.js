const {
    PAYMENT_DONE_STATUS,
    PAYMENT_ERROR_STATUS,
    PAYMENT_INIT_STATUS,
    PAYMENT_PROCESSING_STATUS,
    PAYMENT_REVERSED_STATUS,
    PAYMENT_WITHDRAWN_STATUS,
} = require('@condo/domains/acquiring/constants/payment')

const PROVIDER_CONTRACT_METHODS = [
    'initializePayment',
    'verifyPayment',
    'verifyWebhookSignature',
    'handleWebhook',
    'normaliseProviderStatus',
    'mapProviderReference',
]

const DEFAULT_STATUS_MAP = {
    created: PAYMENT_INIT_STATUS,
    initialized: PAYMENT_INIT_STATUS,
    pending: PAYMENT_PROCESSING_STATUS,
    processing: PAYMENT_PROCESSING_STATUS,
    success: PAYMENT_DONE_STATUS,
    succeeded: PAYMENT_DONE_STATUS,
    done: PAYMENT_DONE_STATUS,
    failed: PAYMENT_ERROR_STATUS,
    error: PAYMENT_ERROR_STATUS,
    cancelled: PAYMENT_WITHDRAWN_STATUS,
    abandoned: PAYMENT_WITHDRAWN_STATUS,
    withdrawn: PAYMENT_WITHDRAWN_STATUS,
    reversed: PAYMENT_REVERSED_STATUS,
}

class PaymentProviderUnsupportedOperationError extends Error {
    constructor (provider, operation) {
        super(`${provider} provider does not support ${operation}`)
        this.name = 'PaymentProviderUnsupportedOperationError'
        this.code = 'PAYMENT_PROVIDER_OPERATION_NOT_SUPPORTED'
        this.provider = provider
        this.operation = operation
    }
}

function ensurePaymentProviderContract (provider) {
    for (const methodName of PROVIDER_CONTRACT_METHODS) {
        if (typeof provider[methodName] !== 'function') {
            throw new Error(`Payment provider contract requires method "${methodName}"`)
        }
    }

    return true
}

class PaymentProvider {
    constructor (options = {}) {
        this.options = options
        ensurePaymentProviderContract(this)
    }

    get provider () {
        return this.options.provider || 'unknown'
    }

    unsupportedOperation (operation) {
        throw new PaymentProviderUnsupportedOperationError(this.provider, operation)
    }

    isConfigured () {
        return true
    }

    getCapabilities () {
        return {
            canInitializePayment: true,
            canVerifyPayment: true,
            canHandleWebhook: true,
            isManual: false,
        }
    }

    getStatusMap () {
        return DEFAULT_STATUS_MAP
    }

    normaliseProviderStatus (providerStatus) {
        if (!providerStatus) return null

        const statusKey = String(providerStatus).trim().toLowerCase()
        return this.getStatusMap()[statusKey] || null
    }

    mapProviderReference (payload = {}) {
        if (!payload) return null
        if (typeof payload === 'string') return payload

        const nestedPayload = payload.data && typeof payload.data === 'object' ? payload.data : null
        const reference = payload.reference ||
            payload.externalTransactionId ||
            payload.transactionId ||
            payload.id ||
            (nestedPayload && (
                nestedPayload.reference ||
                nestedPayload.externalTransactionId ||
                nestedPayload.transactionId ||
                nestedPayload.id
            ))

        return reference ? String(reference) : null
    }

    buildWebhookResponse ({
        acknowledged = true,
        processed = false,
        payload = null,
        providerStatus = null,
        status = null,
        internalStatus = null,
        externalTransactionId = null,
        metadata = null,
        error = null,
    } = {}) {
        return {
            provider: this.provider,
            acknowledged,
            processed,
            providerStatus,
            status: status || this.normaliseProviderStatus(providerStatus),
            internalStatus,
            externalTransactionId: externalTransactionId || this.mapProviderReference(payload),
            payload,
            metadata,
            error,
        }
    }

    async initializePayment () {
        this.unsupportedOperation('initializePayment')
    }

    async verifyPayment () {
        this.unsupportedOperation('verifyPayment')
    }

    async verifyWebhookSignature () {
        return {
            signatureVerified: false,
            signatureVerificationRequired: false,
            signatureVerificationReason: 'Signature verification is not implemented for this provider',
        }
    }

    async resolveWebhookSignatureMetadata (payload, requestMetadata = {}) {
        const signatureVerification = requestMetadata && requestMetadata.signatureVerification
            ? requestMetadata.signatureVerification
            : await this.verifyWebhookSignature(payload, requestMetadata)

        return {
            signatureVerified: signatureVerification.signatureVerified === true,
            signatureVerificationRequired: signatureVerification.signatureVerificationRequired === true,
            signatureVerificationReason: signatureVerification.signatureVerificationReason || null,
        }
    }

    async handleWebhook (payload, requestMetadata = {}) {
        const signatureMetadata = await this.resolveWebhookSignatureMetadata(payload, requestMetadata)

        return this.buildWebhookResponse({
            acknowledged: true,
            processed: false,
            payload,
            metadata: {
                unsupported: true,
                ...signatureMetadata,
            },
        })
    }

    async createPayment (paymentData) {
        return this.initializePayment(paymentData)
    }

    async confirmPayment (paymentData) {
        return this.verifyPayment(paymentData)
    }

    async parseWebhook (payload) {
        return this.handleWebhook(payload)
    }
}

module.exports = {
    PaymentProvider,
    PaymentProviderUnsupportedOperationError,
    PROVIDER_CONTRACT_METHODS,
    ensurePaymentProviderContract,
}
