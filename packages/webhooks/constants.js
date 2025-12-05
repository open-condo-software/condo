const DEFAULT_MAX_PACK_SIZE = 100
// TODO(DOMA-4570) Correct this value based on received stats, when actual skip-send logic will be implemented
const DEFAULT_UNAVAILABILITY_THRESHOLD = 10

// Webhook payload delivery statuses
const WEBHOOK_PAYLOAD_STATUS_PENDING = 'pending'
const WEBHOOK_PAYLOAD_STATUS_SUCCESS = 'success'
const WEBHOOK_PAYLOAD_STATUS_FAILED = 'failed'
const WEBHOOK_PAYLOAD_STATUSES = [
    WEBHOOK_PAYLOAD_STATUS_PENDING,
    WEBHOOK_PAYLOAD_STATUS_SUCCESS,
    WEBHOOK_PAYLOAD_STATUS_FAILED,
]

// How long to keep retrying webhook payload delivery (in days)
const WEBHOOK_PAYLOAD_TTL_DAYS = 7

// Retry intervals in seconds (exponential backoff)
const WEBHOOK_PAYLOAD_RETRY_INTERVALS = [
    0,              // Attempt 1: immediate
    60,             // Attempt 2: 1 minute
    5 * 60,         // Attempt 3: 5 minutes
    30 * 60,        // Attempt 4: 30 minutes
    2 * 60 * 60,    // Attempt 5: 2 hours
    6 * 60 * 60,    // Attempt 6: 6 hours
    24 * 60 * 60,   // Attempt 7+: 24 hours (daily)
]

// HTTP request timeout for webhook payload delivery (in milliseconds)
const WEBHOOK_PAYLOAD_TIMEOUT_MS = 30000

// Maximum length of response body to store
const WEBHOOK_PAYLOAD_MAX_RESPONSE_LENGTH = 1000

module.exports = {
    DEFAULT_MAX_PACK_SIZE,
    DEFAULT_UNAVAILABILITY_THRESHOLD,
    // Webhook payload delivery constants
    WEBHOOK_PAYLOAD_STATUS_PENDING,
    WEBHOOK_PAYLOAD_STATUS_SUCCESS,
    WEBHOOK_PAYLOAD_STATUS_FAILED,
    WEBHOOK_PAYLOAD_STATUSES,
    WEBHOOK_PAYLOAD_TTL_DAYS,
    WEBHOOK_PAYLOAD_RETRY_INTERVALS,
    WEBHOOK_PAYLOAD_TIMEOUT_MS,
    WEBHOOK_PAYLOAD_MAX_RESPONSE_LENGTH,
}
