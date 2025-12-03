/**
 * Payment Webhook Delivery constants
 */

// Webhook delivery statuses
const PAYMENT_WEBHOOK_DELIVERY_STATUS_PENDING = 'pending'
const PAYMENT_WEBHOOK_DELIVERY_STATUS_SUCCESS = 'success'
const PAYMENT_WEBHOOK_DELIVERY_STATUS_FAILED = 'failed'
const PAYMENT_WEBHOOK_DELIVERY_STATUSES = [
    PAYMENT_WEBHOOK_DELIVERY_STATUS_PENDING,
    PAYMENT_WEBHOOK_DELIVERY_STATUS_SUCCESS,
    PAYMENT_WEBHOOK_DELIVERY_STATUS_FAILED,
]

// How long to keep retrying webhook delivery (in days)
const PAYMENT_WEBHOOK_DELIVERY_TTL_DAYS = 7

// Retry intervals in seconds (exponential backoff)
const PAYMENT_WEBHOOK_RETRY_INTERVALS = [
    0,              // Attempt 1: immediate
    60,             // Attempt 2: 1 minute
    5 * 60,         // Attempt 3: 5 minutes
    30 * 60,        // Attempt 4: 30 minutes
    2 * 60 * 60,    // Attempt 5: 2 hours
    6 * 60 * 60,    // Attempt 6: 6 hours
    24 * 60 * 60,   // Attempt 7+: 24 hours (daily)
]

// HTTP request timeout for webhook delivery (in milliseconds)
const PAYMENT_WEBHOOK_TIMEOUT_MS = 30000

// Maximum length of response body to store
const PAYMENT_WEBHOOK_MAX_RESPONSE_LENGTH = 1000

module.exports = {
    PAYMENT_WEBHOOK_DELIVERY_STATUS_PENDING,
    PAYMENT_WEBHOOK_DELIVERY_STATUS_SUCCESS,
    PAYMENT_WEBHOOK_DELIVERY_STATUS_FAILED,
    PAYMENT_WEBHOOK_DELIVERY_STATUSES,
    PAYMENT_WEBHOOK_DELIVERY_TTL_DAYS,
    PAYMENT_WEBHOOK_RETRY_INTERVALS,
    PAYMENT_WEBHOOK_TIMEOUT_MS,
    PAYMENT_WEBHOOK_MAX_RESPONSE_LENGTH,
}
