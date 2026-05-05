const get = require('lodash/get')

const { getPaymentProviderRegistryEntry } = require('./paymentProviders')

class ProviderWebhookAdapterError extends Error {
    constructor (code, message, details = {}) {
        super(message)
        this.name = 'ProviderWebhookAdapterError'
        this.code = code
        Object.assign(this, details)
    }
}

function normalizeText (value) {
    if (value === null || value === undefined) return null

    const normalizedValue = String(value).trim()
    return normalizedValue ? normalizedValue : null
}

function normalizeWebhookHeaders (headers = {}) {
    if (!headers || typeof headers !== 'object') return {}

    return Object.entries(headers).reduce((result, [key, value]) => {
        const normalizedKey = normalizeText(key)

        if (!normalizedKey) return result

        result[normalizedKey.toLowerCase()] = value
        return result
    }, {})
}

function resolveProviderCode (request = {}) {
    return normalizeText(
        request.providerCode ||
        request.provider ||
        get(request, ['params', 'providerCode']) ||
        get(request, ['params', 'provider']) ||
        get(request, ['routeParams', 'providerCode']) ||
        get(request, ['routeParams', 'provider']) ||
        get(request, ['args', 'providerCode']) ||
        get(request, ['args', 'provider']) ||
        null
    )
}

function resolveParsedPayload (request = {}) {
    if (Object.prototype.hasOwnProperty.call(request, 'payload')) return request.payload
    if (Object.prototype.hasOwnProperty.call(request, 'parsedPayload')) return request.parsedPayload
    if (Object.prototype.hasOwnProperty.call(request, 'webhookPayload')) return request.webhookPayload

    return null
}

function resolveRawBody (request = {}, metadata = {}) {
    const candidates = [
        request.rawBody,
        metadata.rawBody,
        request.body,
        metadata.body,
    ]

    for (const candidate of candidates) {
        if (Buffer.isBuffer(candidate) || typeof candidate === 'string') return candidate
    }

    return null
}

function resolveEnvironmentFlags (request = {}, metadata = {}) {
    const normalizedMode = normalizeText(
        request.mode ||
        metadata.mode ||
        null
    )
    const normalizedEnvironment = normalizeText(
        request.environment ||
        metadata.environment ||
        normalizedMode ||
        null
    )
    const sandbox = request.sandbox === true ||
        metadata.sandbox === true ||
        normalizedMode === 'sandbox' ||
        normalizedEnvironment === 'sandbox'
    const testMode = request.testMode === true ||
        metadata.testMode === true ||
        normalizedMode === 'test' ||
        normalizedEnvironment === 'test'

    return {
        mode: normalizedMode || normalizedEnvironment,
        environment: normalizedEnvironment,
        sandbox,
        testMode,
    }
}

function adaptProviderWebhookRequest (request = {}) {
    const providerCode = resolveProviderCode(request)

    if (!providerCode) {
        throw new ProviderWebhookAdapterError(
            'PAYMENT_WEBHOOK_PROVIDER_REQUIRED',
            'Provider code is required for provider webhook handling'
        )
    }

    getPaymentProviderRegistryEntry(providerCode)

    const requestMetadata = request.metadata && typeof request.metadata === 'object' ? request.metadata : {}
    const headers = normalizeWebhookHeaders(request.headers || requestMetadata.headers || {})
    const rawBody = resolveRawBody(request, requestMetadata)
    const payload = resolveParsedPayload(request)
    const environmentFlags = resolveEnvironmentFlags(request, requestMetadata)

    return {
        ...request,
        providerCode,
        payload,
        environment: environmentFlags.environment,
        testMode: environmentFlags.testMode,
        sandbox: environmentFlags.sandbox,
        metadata: {
            ...requestMetadata,
            headers,
            rawBody,
            mode: environmentFlags.mode,
            environment: environmentFlags.environment,
            testMode: environmentFlags.testMode,
            sandbox: environmentFlags.sandbox,
            organization: request.organization || request.organisation || requestMetadata.organization || null,
            context: request.contextData || requestMetadata.context || null,
        },
    }
}

async function dispatchProviderWebhookRequest (context, request, handler) {
    if (!context) throw new Error('no context')
    if (!request) throw new Error('no data')
    if (typeof handler !== 'function') throw new Error('no handler')

    return handler(context, adaptProviderWebhookRequest(request))
}

module.exports = {
    adaptProviderWebhookRequest,
    dispatchProviderWebhookRequest,
    normalizeWebhookHeaders,
    ProviderWebhookAdapterError,
}
