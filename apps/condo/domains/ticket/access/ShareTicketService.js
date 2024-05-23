const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { getByCondition } = require('@open-condo/keystone/schema')

const { checkPermissionsInEmployedOrRelatedOrganizations } = require('@condo/domains/organization/utils/accessSchema')

async function canShareTicket ({ args: { data }, authentication: { item: user }, context }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin) return true

    const ticket = await getByCondition('Ticket', { id: data.ticketId, deletedAt: null })

    if (!ticket || !ticket.organization) return false

    return await checkPermissionsInEmployedOrRelatedOrganizations(context, user, ticket.organization, 'canShareTickets')
}

module.exports = {
    canShareTicket,
}
