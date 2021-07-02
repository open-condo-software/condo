async function canReadTicketReportWidgetData ({ authentication: { item: user } }) {
    if (!user) return false

    if (user.isAdmin) {
        return {}
    }

    return { organization: { employees_some: { user: { id: user.id }, isBlocked: false } } }
}

module.exports = {
    canReadTicketReportWidgetData,
}
