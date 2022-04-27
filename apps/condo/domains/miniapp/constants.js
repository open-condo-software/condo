const BILLING_APP_TYPE = 'BILLING'
const ACQUIRING_APP_TYPE = 'ACQUIRING'
const B2B_APP_TYPE = 'B2B'

/**
 * List of app types available in CRM
 * type + id is used to get specific model from API
 * @type {(string)[]}
 */
const APP_TYPES = [
    BILLING_APP_TYPE,
    ACQUIRING_APP_TYPE,
    B2B_APP_TYPE,
]

const NO_INSTRUCTION_OR_MESSAGE_ERROR = '[integration:noInstructionOrMessage] If integration does not have appUrl, it must have instruction and connected message fields'

const INTERCOM_CATEGORY = 'INTERCOM'
const OTHER_CATEGORY = 'OTHER'

const B2B_APP_CATEGORIES = [
    INTERCOM_CATEGORY,
    OTHER_CATEGORY,
]

module.exports = {
    BILLING_APP_TYPE,
    ACQUIRING_APP_TYPE,
    B2B_APP_TYPE,
    APP_TYPES,
    INTERCOM_CATEGORY,
    OTHER_CATEGORY,
    B2B_APP_CATEGORIES,
    NO_INSTRUCTION_OR_MESSAGE_ERROR,
}