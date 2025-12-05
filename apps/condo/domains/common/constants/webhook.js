/**
 * Webhook Delivery constants
 */

// Webhook delivery statuses
const WEBHOOK_DELIVERY_STATUS_PENDING = 'pending'
const WEBHOOK_DELIVERY_STATUS_SUCCESS = 'success'
const WEBHOOK_DELIVERY_STATUS_FAILED = 'failed'
const WEBHOOK_DELIVERY_STATUSES = [
    WEBHOOK_DELIVERY_STATUS_PENDING,
    WEBHOOK_DELIVERY_STATUS_SUCCESS,
    WEBHOOK_DELIVERY_STATUS_FAILED,
]

// How long to keep retrying webhook delivery (in days)
const WEBHOOK_DELIVERY_TTL_DAYS = 7

// Retry intervals in seconds (exponential backoff)
const WEBHOOK_RETRY_INTERVALS = [
    0,              // Attempt 1: immediate
    60,             // Attempt 2: 1 minute
    5 * 60,         // Attempt 3: 5 minutes
    30 * 60,        // Attempt 4: 30 minutes
    2 * 60 * 60,    // Attempt 5: 2 hours
    6 * 60 * 60,    // Attempt 6: 6 hours
    24 * 60 * 60,   // Attempt 7+: 24 hours (daily)
]

// HTTP request timeout for webhook delivery (in milliseconds)
const WEBHOOK_TIMEOUT_MS = 30000

// Maximum length of response body to store
const WEBHOOK_MAX_RESPONSE_LENGTH = 1000

module.exports = {
    WEBHOOK_DELIVERY_STATUS_PENDING,
    WEBHOOK_DELIVERY_STATUS_SUCCESS,
    WEBHOOK_DELIVERY_STATUS_FAILED,
    WEBHOOK_DELIVERY_STATUSES,
    WEBHOOK_DELIVERY_TTL_DAYS,
    WEBHOOK_RETRY_INTERVALS,
    WEBHOOK_TIMEOUT_MS,
    WEBHOOK_MAX_RESPONSE_LENGTH,
}
