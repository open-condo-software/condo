const { GQLError } = require('@open-condo/keystone/errors')

const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { SERVICE_PROVIDER_TYPE } = require('@condo/domains/organization/constants/common')
const { Organization } = require('@condo/domains/organization/utils/serverSchema')

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
    if (newItem.ticketSubmittingWithoutPhoneIsDisabled) {
        const [organization] = await Organization.getAll(context, {
            id: newItem.organization,
        })
        if (organization.type !== SERVICE_PROVIDER_TYPE) {
            throw new GQLError(ERRORS.ONLY_SERVICE_PROVIDER_ORGANIZATION_TYPE_IS_ALLOWED, context)
        }
    }
}

module.exports = {
    ticketSubmittingValidations,
}