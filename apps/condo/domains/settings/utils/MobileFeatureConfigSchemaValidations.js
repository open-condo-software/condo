const { GQLError } = require('@open-condo/keystone/errors')

const { normalizePhone } = require('@condo/domains/common/utils/phone')

const ticketSubmittingValidations = async (resolvedData, context, ERRORS) => {
    if (resolvedData.ticketSubmittingIsDisabled) {
        if (!resolvedData['commonPhone']) {
            throw new GQLError(ERRORS.TICKET_SUBMITTING_PHONES_NOT_CONFIGURED, context)
        }
        if (resolvedData['commonPhone'] && normalizePhone(resolvedData['commonPhone']) !== resolvedData['commonPhone']) {
            throw new GQLError(ERRORS.COMMON_PHONE_INVALID, context)
        }
    }
}

module.exports = {
    ticketSubmittingValidations,
}