const { GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')

const { NOT_FOUND } = require('@condo/domains/common/constants/errors')

const SEND_SCOPE_RESIDENTS_MESSAGE_ERRORS = {
    PROPERTY_IS_REQUIRED: {
        mutation: 'sendResidentMessage',
        variable: ['data', 'scopes'],
        code: BAD_USER_INPUT,
        type: NOT_FOUND,
        message: 'Please provide property id for each scope',
        messageForUser: 'api.resident.sendResidentMessage.PROPERTY_IS_REQUIRED',
    },
    SCOPES_IS_EMPTY: {
        mutation: 'sendResidentMessage',
        variable: ['data', 'scopes'],
        code: BAD_USER_INPUT,
        type: NOT_FOUND,
        message: 'Scopes could not be empty',
        messageForUser: 'api.resident.sendResidentMessage.SCOPES_IS_EMPTY',
    },
}

module.exports = {
    SEND_SCOPE_RESIDENTS_MESSAGE_ERRORS,
}