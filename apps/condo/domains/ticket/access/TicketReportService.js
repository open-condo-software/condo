const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')

async function canReadTicketReportWidgetData ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.isAdmin) return true

    return { organization: { employees_some: { user: { id: user.id }, isBlocked: false, deletedAt: null } } }
}

module.exports = {
    canReadTicketReportWidgetData,
}
