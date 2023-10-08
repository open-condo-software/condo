const SUBSCRIPTION_TRIAL_PERIOD_DAYS = 15
const SUBSCRIPTION_SBBOL_PERIOD_DAYS = 365

const SUBSCRIPTION_TYPE = {
    DEFAULT: 'default',
    SBBOL: 'sbbol',
}

/**
 * Reduced set of statuses from a set of statuses in external system, that contains much more of them.
 * Based on this status a system will filter payment request for subsequent fetching of statuses from remote system.
 */
const SUBSCRIPTION_PAYMENT_STATUS = {
    // Payment was just created in our system and its status in remote system in unknown yet
    CREATED: 'created',
    // Work in payment is in progress (on remote system the payment can have many stages of processing, that are mapped to this one for simplicity)
    PROCESSING: 'processing',
    DONE: 'done',
    ERROR: 'error',
    // Payment is stuck somewhere during processing, for example, because of lack of information, but everything else was correct.
    // Payments with "stopped" status should not be polled from remote system, further status update should be performed manually.
    STOPPED: 'stopped',
    // Client has refused to pay
    CANCELLED: 'cancelled',
}

const SUBSCRIPTION_PAYMENT_STATUS_TRANSITIONS = {
    [SUBSCRIPTION_PAYMENT_STATUS.CREATED]: [
        SUBSCRIPTION_PAYMENT_STATUS.PROCESSING,
        SUBSCRIPTION_PAYMENT_STATUS.DONE,
        SUBSCRIPTION_PAYMENT_STATUS.ERROR,
        SUBSCRIPTION_PAYMENT_STATUS.STOPPED,
        SUBSCRIPTION_PAYMENT_STATUS.CANCELLED,
    ],
    [SUBSCRIPTION_PAYMENT_STATUS.PROCESSING]: [
        SUBSCRIPTION_PAYMENT_STATUS.DONE,
        SUBSCRIPTION_PAYMENT_STATUS.ERROR,
        SUBSCRIPTION_PAYMENT_STATUS.STOPPED,
        SUBSCRIPTION_PAYMENT_STATUS.CANCELLED,
    ],
    [SUBSCRIPTION_PAYMENT_STATUS.DONE]: [],
    [SUBSCRIPTION_PAYMENT_STATUS.ERROR]: [],
    [SUBSCRIPTION_PAYMENT_STATUS.STOPPED]: [
        SUBSCRIPTION_PAYMENT_STATUS.PROCESSING,
        SUBSCRIPTION_PAYMENT_STATUS.DONE,
        SUBSCRIPTION_PAYMENT_STATUS.ERROR,
        SUBSCRIPTION_PAYMENT_STATUS.CANCELLED,
    ],
    [SUBSCRIPTION_PAYMENT_STATUS.CANCELLED]: [],
}

const SUBSCRIPTION_PAYMENT_CURRENCY = {
    RUB: 'RUB',
}

const SBBOL_YEARLY_SUBSCRIPTION_PRICE = 1.0

module.exports = {
    SUBSCRIPTION_TYPE,
    SUBSCRIPTION_TRIAL_PERIOD_DAYS,
    SUBSCRIPTION_SBBOL_PERIOD_DAYS,
    SUBSCRIPTION_PAYMENT_STATUS,
    SUBSCRIPTION_PAYMENT_STATUS_TRANSITIONS,
    SUBSCRIPTION_PAYMENT_CURRENCY,
    SBBOL_YEARLY_SUBSCRIPTION_PRICE,
}