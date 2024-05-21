const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

const {
    checkUserEmploymentInOrganizations,
} = require('@condo/domains/organization/utils/accessSchema')

async function canReadTicketReportWidgetData ({ authentication: { item: user }, args: { data: { userOrganizationId } } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin) return true

    return await checkUserEmploymentInOrganizations(user, userOrganizationId)
}

module.exports = {
    canReadTicketReportWidgetData,
}
