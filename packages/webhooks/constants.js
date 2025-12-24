const DEFAULT_MAX_PACK_SIZE = 100
// TODO(DOMA-4570) Correct this value based on received stats, when actual skip-send logic will be implemented
const DEFAULT_UNAVAILABILITY_THRESHOLD = 10

// Webhook payload sending statuses
const WEBHOOK_PAYLOAD_STATUS_PENDING = 'pending'
const WEBHOOK_PAYLOAD_STATUS_SENT = 'sent'
const WEBHOOK_PAYLOAD_STATUS_ERROR = 'error'
const WEBHOOK_PAYLOAD_STATUSES = [
    WEBHOOK_PAYLOAD_STATUS_PENDING,
    WEBHOOK_PAYLOAD_STATUS_SENT,
    WEBHOOK_PAYLOAD_STATUS_ERROR,
]

// How long to keep retrying webhook payload sending (in seconds)
const WEBHOOK_PAYLOAD_TTL_IN_SEC = 7 * 24 * 60 * 60 // 7 days

// Retry intervals in seconds (exponential backoff)
const WEBHOOK_PAYLOAD_RETRY_INTERVALS_IN_SEC = [
    0,              // Attempt 1: immediate
    60,             // Attempt 2: 1 minute
    5 * 60,         // Attempt 3: 5 minutes
    30 * 60,        // Attempt 4: 30 minutes
    2 * 60 * 60,    // Attempt 5: 2 hours
    6 * 60 * 60,    // Attempt 6: 6 hours
    24 * 60 * 60,   // Attempt 7+: 24 hours (daily)
]

// HTTP request timeout for webhook payload sending (in milliseconds)
const WEBHOOK_PAYLOAD_TIMEOUT_IN_MS = 10_000

// How long to keep webhook payload records before hard deletion (in seconds)
// Why 42? It's the Answer to the Ultimate Question of Life, the Universe, and Everything!
// (Also a reasonable retention period for debugging and compliance)
const WEBHOOK_PAYLOAD_RETENTION_IN_SEC = 42 * 24 * 60 * 60 // 42 days

// Maximum length of response body to store
const WEBHOOK_PAYLOAD_MAX_RESPONSE_LENGTH = 1000

module.exports = {
    DEFAULT_MAX_PACK_SIZE,
    DEFAULT_UNAVAILABILITY_THRESHOLD,
    WEBHOOK_PAYLOAD_STATUS_PENDING,
    WEBHOOK_PAYLOAD_STATUS_SENT,
    WEBHOOK_PAYLOAD_STATUS_ERROR,
    WEBHOOK_PAYLOAD_STATUSES,
    WEBHOOK_PAYLOAD_TTL_IN_SEC,
    WEBHOOK_PAYLOAD_RETRY_INTERVALS_IN_SEC,
    WEBHOOK_PAYLOAD_TIMEOUT_IN_MS,
    WEBHOOK_PAYLOAD_RETENTION_IN_SEC,
    WEBHOOK_PAYLOAD_MAX_RESPONSE_LENGTH,
}
