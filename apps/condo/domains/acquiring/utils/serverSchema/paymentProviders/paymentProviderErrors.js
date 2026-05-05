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

class PaymentProviderRequestError extends Error {
    constructor (provider, operation, message, options = {}) {
        super(message)
        this.name = 'PaymentProviderRequestError'
        this.code = 'PAYMENT_PROVIDER_REQUEST_FAILED'
        this.provider = provider
        this.operation = operation

        if (options.cause) {
            this.causeName = options.cause.name || 'Error'
        }
    }
}

class PaymentProviderResponseError extends Error {
    constructor (provider, operation, message) {
        super(message)
        this.name = 'PaymentProviderResponseError'
        this.code = 'PAYMENT_PROVIDER_MALFORMED_RESPONSE'
        this.provider = provider
        this.operation = operation
    }
}

module.exports = {
    PaymentProviderConfigurationError,
    PaymentProviderRequestError,
    PaymentProviderResponseError,
    PaymentProviderValidationError,
}
