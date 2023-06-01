const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

const { queryOrganizationEmployeeFor } = require('@condo/domains/organization/utils/accessSchema')
const { checkUserBelongsToOrganization } = require('@condo/domains/organization/utils/accessSchema')

async function canReadTicketReportWidgetData ({ authentication: { item: user }, args: { data: { userOrganizationId } } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin) return true

    const userBelongsToOrganization = await checkUserBelongsToOrganization(user.id, userOrganizationId)
    if (!userBelongsToOrganization) return false

    return { organization: queryOrganizationEmployeeFor(user.id) }
}

module.exports = {
    canReadTicketReportWidgetData,
}
