const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

const { queryOrganizationEmployeeFor } = require('@condo/domains/organization/utils/accessSchema')

async function canReadTicketReportWidgetData ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin) return true

    return { organization: queryOrganizationEmployeeFor(user.id, 'canReadAnalytics') }
}

module.exports = {
    canReadTicketReportWidgetData,
}
