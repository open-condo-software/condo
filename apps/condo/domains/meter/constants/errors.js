const VALUE_LESS_THAN_PREVIOUS_ERROR = '[value:lessThanPrevious:'
const EXISTING_METER_NUMBER_IN_SAME_ORGANIZATION = '[unique:alreadyExists:number]'
const EXISTING_METER_ACCOUNT_NUMBER_IN_OTHER_UNIT = '[unique:alreadyExists:accountNumber]'
const AUTOMATIC_METER_NO_MASTER_APP = '[isAutomatic:b2bApp:null] Automatic meter must have b2b app master-system'

module.exports = {
    VALUE_LESS_THAN_PREVIOUS_ERROR,
    EXISTING_METER_NUMBER_IN_SAME_ORGANIZATION,
    EXISTING_METER_ACCOUNT_NUMBER_IN_OTHER_UNIT,
    AUTOMATIC_METER_NO_MASTER_APP,
}