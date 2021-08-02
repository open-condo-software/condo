const { checkRelatedOrganizationPermission } = require('@condo/domains/organization/utils/accessSchema')
const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const { checkOrganizationPermission } = require('@condo/domains/organization/utils/accessSchema')
const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')

async function canShareTicket ({ args: { data }, authentication: { item: user }, context }) {
    if (!user) return throwAuthenticationError()
    if (user.isAdmin) return true
    const [ticket] = await Ticket.getAll(context, { id: data.ticketId })
    const canManageRelatedOrganizationTickets = await checkRelatedOrganizationPermission(context, user.id, ticket.organization.id, 'canManageTickets')
    if (canManageRelatedOrganizationTickets) {
        return true
    }
    const hasAccess = await checkOrganizationPermission(context, user.id, ticket.organization.id, 'canManageTickets')
    return hasAccess
}

module.exports = {
    canShareTicket,
}
