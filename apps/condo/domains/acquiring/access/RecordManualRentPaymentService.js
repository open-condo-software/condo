const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

const { checkPermissionsInEmployedOrganizations } = require('@condo/domains/organization/utils/accessSchema')
const { canDirectlyExecuteService } = require('@condo/domains/user/utils/directAccess')

async function canRecordManualRentPayment ({ args: { data }, authentication: { item: user }, context, gqlName }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return true

    const hasDirectAccess = await canDirectlyExecuteService(user, gqlName)
    if (hasDirectAccess) return hasDirectAccess

    const organizationId = data && data.organization && data.organization.id
    if (!organizationId) return false

    return await checkPermissionsInEmployedOrganizations(context, user, organizationId, 'canReadPayments')
}

module.exports = {
    canRecordManualRentPayment,
    canReverseManualRentPayment: canRecordManualRentPayment,
}
