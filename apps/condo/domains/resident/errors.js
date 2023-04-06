const { GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')

const { NOT_FOUND } = require('@condo/domains/common/constants/errors')

const SEND_RESIDENT_MESSAGE_ERRORS = {
    INVALID_CATEGORY_PROVIDED: {
        mutation: 'sendResidentMessage',
        variable: ['data', 'data', 'category'],
        code: BAD_USER_INPUT,
        type: NOT_FOUND,
        message: 'Please use one of allowed category values',
        messageForUser: 'api.resident.sendResidentMessage.INVALID_CATEGORY_PROVIDED',
    },
    INVALID_ORGANIZATION_PROVIDED: {
        mutation: 'sendResidentMessage',
        variable: ['data', 'organizationId'],
        code: BAD_USER_INPUT,
        type: NOT_FOUND,
        message: 'Please provide existing non-deleted organization id',
        messageForUser: 'api.resident.sendResidentMessage.INVALID_ORGANIZATION_PROVIDED',
    },
    PROPERTY_IS_REQUIRED: {
        mutation: 'sendResidentMessage',
        variable: ['data', 'propertyDetails'],
        code: BAD_USER_INPUT,
        type: NOT_FOUND,
        message: 'Please provide either property or billingProperty id for each details item',
        messageForUser: 'api.resident.sendResidentMessage.PROPERTY_IS_REQUIRED',
    },
    PROPERTY_DETAILS_IS_EMPTY: {
        mutation: 'sendResidentMessage',
        variable: ['data', 'propertyDetails'],
        code: BAD_USER_INPUT,
        type: NOT_FOUND,
        message: 'Property details could not be empty',
        messageForUser: 'api.resident.sendResidentMessage.PROPERTY_DETAILS_IS_EMPTY',
    },
    INVALID_NOTIFICATION_TYPE_PROVIDED: {
        mutation: 'sendResidentMessage',
        variable: ['data', 'type'],
        code: BAD_USER_INPUT,
        type: NOT_FOUND,
        message: 'Please use one of allowed notification types',
        messageForUser: 'api.resident.sendResidentMessage.INVALID_NOTIFICATION_TYPE_PROVIDED',
    },
}

module.exports = {
    SEND_RESIDENT_MESSAGE_ERRORS,
}