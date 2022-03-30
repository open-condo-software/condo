const BILLING_APP_TYPE = 'BILLING'
const ACQUIRING_APP_TYPE = 'ACQUIRING'

const APP_TYPES = [
    BILLING_APP_TYPE,
    ACQUIRING_APP_TYPE,
]

const NO_INSTRUCTION_OR_MESSAGE_ERROR = '[integration:noInstructionOrMessage] If integration does not have appUrl, it must have instruction and connected message fields'

module.exports = {
    BILLING_APP_TYPE,
    ACQUIRING_APP_TYPE,
    APP_TYPES,
    NO_INSTRUCTION_OR_MESSAGE_ERROR,
}