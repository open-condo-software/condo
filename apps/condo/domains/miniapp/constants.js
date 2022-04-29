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

const INTERCOM_CATEGORY = 'INTERCOM'
const OTHER_CATEGORY = 'OTHER'

const B2B_APP_CATEGORIES = [
    INTERCOM_CATEGORY,
    OTHER_CATEGORY,
]

const CONTEXT_IN_PROGRESS_STATUS = 'InProgress'
const CONTEXT_ERROR_STATUS = 'Error'
const CONTEXT_FINISHED_STATUS = 'Finished'

const CONTEXT_STATUSES = [
    CONTEXT_IN_PROGRESS_STATUS,
    CONTEXT_ERROR_STATUS,
    CONTEXT_FINISHED_STATUS,
]

const NO_INSTRUCTION_OR_MESSAGE_ERROR = '[integration:noInstructionOrMessage] If integration does not have appUrl, it must have instruction and connected message fields'
const NON_SERVICE_USER_ERROR = '[user] No user specified or it has non-service type'
const NO_CONTEXT_STATUS_ERROR = '[status] Status field cannot be set to null'


module.exports = {
    BILLING_APP_TYPE,
    ACQUIRING_APP_TYPE,
    B2B_APP_TYPE,
    APP_TYPES,
    INTERCOM_CATEGORY,
    OTHER_CATEGORY,
    B2B_APP_CATEGORIES,
    CONTEXT_IN_PROGRESS_STATUS,
    CONTEXT_FINISHED_STATUS,
    CONTEXT_ERROR_STATUS,
    CONTEXT_STATUSES,
    NON_SERVICE_USER_ERROR,
    NO_INSTRUCTION_OR_MESSAGE_ERROR,
    NO_CONTEXT_STATUS_ERROR,
}