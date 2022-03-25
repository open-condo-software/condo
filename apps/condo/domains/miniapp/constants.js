const BILLING_APP_TYPE = 'BILLING'
const ACQUIRING_APP_TYPE = 'ACQUIRING'

const APP_TYPES = [
    BILLING_APP_TYPE,
    ACQUIRING_APP_TYPE,
]

const WRONG_AMOUNT_OF_BLOCK_ERROR = '[descriptionBlock:integrations:amount] You must connect block to exactly on of this fields:'
const NO_INSTRUCTION_ERROR = '[integration:noInstruction] If integration does not have appUrl, it should have instruction'

module.exports = {
    BILLING_APP_TYPE,
    ACQUIRING_APP_TYPE,
    APP_TYPES,
    WRONG_AMOUNT_OF_BLOCK_ERROR,
    NO_INSTRUCTION_ERROR,
}