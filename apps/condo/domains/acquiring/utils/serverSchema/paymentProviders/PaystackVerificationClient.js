const Big = require('big.js')

const { RENT_PAYMENT_PROVIDER_PAYSTACK } = require('@condo/domains/acquiring/constants/rentPayment')
const {
    PAYMENT_DONE_STATUS,
    PAYMENT_ERROR_STATUS,
    PAYMENT_PROCESSING_STATUS,
} = require('@condo/domains/acquiring/constants/payment')
const { getCurrencyDecimalPlaces } = require('@condo/domains/common/utils/currencies')

const {
    PaymentProviderConfigurationError,
    PaymentProviderRequestError,
    PaymentProviderResponseError,
    PaymentProviderValidationError,
} = require('./paymentProviderErrors')

const DEFAULT_PAYSTACK_API_URL = 'https://api.paystack.co'
const PAYSTACK_AMOUNT_CONVERSION_LOCALE = 'en-US'
const VERIFY_TRANSACTION_OPERATION = 'verifyTransaction'

function normalizeCurrencyCode (currencyCode) {
    if (!currencyCode || !String(currencyCode).trim()) return null

    return String(currencyCode).trim().toUpperCase()
}

function convertPaystackSubunitsToMajorAmount (amount, currencyCode = null) {
    if (amount === null || amount === undefined || String(amount).trim() === '') return null

    const normalizedCurrencyCode = normalizeCurrencyCode(currencyCode)
    const decimalPlaces = getCurrencyDecimalPlaces(PAYSTACK_AMOUNT_CONVERSION_LOCALE, normalizedCurrencyCode || 'USD')
    const divisor = Big(10).pow(decimalPlaces)

    return Big(String(amount)).div(divisor).toFixed(decimalPlaces)
}

function convertMajorAmountToPaystackSubunits (amount, currencyCode = null) {
    if (amount === null || amount === undefined || String(amount).trim() === '') return null

    const normalizedCurrencyCode = normalizeCurrencyCode(currencyCode)
    const decimalPlaces = getCurrencyDecimalPlaces(PAYSTACK_AMOUNT_CONVERSION_LOCALE, normalizedCurrencyCode || 'USD')
    const multiplier = Big(10).pow(decimalPlaces)

    return Big(String(amount)).times(multiplier).round(0, Big.roundHalfUp).toFixed(0)
}

function getVerificationOutcome (providerStatus) {
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

function resolveConfirmedAt (providerStatus, confirmedAt, providerPayload = {}) {
    if (!providerStatus) return null

    const normalizedStatus = String(providerStatus).trim().toLowerCase()
    if (!['success', 'charge_success'].includes(normalizedStatus)) return null

    return confirmedAt ||
        providerPayload.paid_at ||
        providerPayload.paidAt ||
        providerPayload.transaction_date ||
        providerPayload.transactionDate ||
        new Date().toISOString()
}

function normalizePaystackVerificationResult ({
    providerReference,
    paymentMethod = null,
    confirmedAt = null,
    paymentData = {},
    responseData,
}) {
    if (!responseData || typeof responseData !== 'object' || Array.isArray(responseData)) {
        throw new PaymentProviderResponseError(
            RENT_PAYMENT_PROVIDER_PAYSTACK,
            VERIFY_TRANSACTION_OPERATION,
            'Paystack verification response is malformed: missing data payload'
        )
    }

    const providerStatus = responseData.status ? String(responseData.status) : null
    const outcome = getVerificationOutcome(providerStatus)

    return {
        provider: RENT_PAYMENT_PROVIDER_PAYSTACK,
        confirmed: outcome.confirmed,
        confirmedAt: resolveConfirmedAt(providerStatus, confirmedAt, responseData),
        amount: convertPaystackSubunitsToMajorAmount(
            responseData.amount,
            responseData.currency || responseData.currencyCode || null
        ),
        currencyCode: normalizeCurrencyCode(responseData.currency || responseData.currencyCode || null),
        status: outcome.status,
        internalStatus: outcome.internalStatus,
        providerStatus,
        paymentMethod,
        externalTransactionId: providerReference,
        paymentData,
        metadata: {
            verification: {
                endpoint: '/transaction/verify/:reference',
            },
            ...(outcome.rationale ? { rationale: outcome.rationale } : {}),
        },
    }
}

function resolveFetch (fetchImpl) {
    if (typeof fetchImpl === 'function') return fetchImpl
    if (typeof global.fetch === 'function') return global.fetch.bind(global)

    throw new PaymentProviderConfigurationError(
        RENT_PAYMENT_PROVIDER_PAYSTACK,
        'paystack verification requires a fetch implementation'
    )
}

function createPaystackVerificationClient (options = {}) {
    const {
        baseUrl = DEFAULT_PAYSTACK_API_URL,
        fetch: fetchImpl,
    } = options

    const request = resolveFetch(fetchImpl)

    return {
        async verifyTransaction ({
            providerReference,
            secretKey,
            paymentMethod = null,
            confirmedAt = null,
            paymentData = {},
        } = {}) {
            if (!providerReference || !String(providerReference).trim()) {
                throw new PaymentProviderValidationError(
                    RENT_PAYMENT_PROVIDER_PAYSTACK,
                    'providerReference',
                    'Paystack transaction verification requires providerReference'
                )
            }

            if (!secretKey || !String(secretKey).trim()) {
                throw new PaymentProviderConfigurationError(
                    RENT_PAYMENT_PROVIDER_PAYSTACK,
                    'paystack verification secret key is not configured'
                )
            }

            const normalizedReference = String(providerReference).trim()
            const url = `${String(baseUrl).replace(/\/$/, '')}/transaction/verify/${encodeURIComponent(normalizedReference)}`

            let response
            try {
                response = await request(url, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${String(secretKey).trim()}`,
                        Accept: 'application/json',
                    },
                })
            } catch (error) {
                throw new PaymentProviderRequestError(
                    RENT_PAYMENT_PROVIDER_PAYSTACK,
                    VERIFY_TRANSACTION_OPERATION,
                    'Paystack verification request failed',
                    { cause: error }
                )
            }

            let payload
            try {
                payload = await response.json()
            } catch (error) {
                throw new PaymentProviderResponseError(
                    RENT_PAYMENT_PROVIDER_PAYSTACK,
                    VERIFY_TRANSACTION_OPERATION,
                    'Paystack verification response is malformed: invalid JSON'
                )
            }

            if (!response.ok) {
                throw new PaymentProviderRequestError(
                    RENT_PAYMENT_PROVIDER_PAYSTACK,
                    VERIFY_TRANSACTION_OPERATION,
                    `Paystack verification request failed with status ${response.status}`
                )
            }

            if (!payload || typeof payload !== 'object' || Array.isArray(payload) || !payload.data || typeof payload.data !== 'object') {
                throw new PaymentProviderResponseError(
                    RENT_PAYMENT_PROVIDER_PAYSTACK,
                    VERIFY_TRANSACTION_OPERATION,
                    'Paystack verification response is malformed: missing data payload'
                )
            }

            return normalizePaystackVerificationResult({
                providerReference: normalizedReference,
                paymentMethod,
                confirmedAt,
                paymentData,
                responseData: payload.data,
            })
        },
    }
}

module.exports = {
    convertMajorAmountToPaystackSubunits,
    convertPaystackSubunitsToMajorAmount,
    createPaystackVerificationClient,
    DEFAULT_PAYSTACK_API_URL,
    getVerificationOutcome,
    normalizeCurrencyCode,
    normalizePaystackVerificationResult,
    PAYSTACK_AMOUNT_CONVERSION_LOCALE,
    VERIFY_TRANSACTION_OPERATION,
}
