const { GQLError } = require('@open-condo/keystone/errors')

const { normalizePhone } = require('@condo/domains/common/utils/phone')

const ticketSubmittingValidations = async (resolvedData, context, existingItem, ERRORS) => {
    const newItem = { ...existingItem, ...resolvedData }
    if (newItem.ticketSubmittingIsDisabled) {
        if (!newItem['commonPhone']) {
            throw new GQLError(ERRORS.TICKET_SUBMITTING_PHONES_NOT_CONFIGURED, context)
        }
        if (newItem['commonPhone'] && normalizePhone(newItem['commonPhone'], true) !== newItem['commonPhone']) {
            throw new GQLError(ERRORS.COMMON_PHONE_INVALID, context)
        }
    }
}

module.exports = {
    ticketSubmittingValidations,
}