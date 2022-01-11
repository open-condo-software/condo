const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const { USER_SCHEMA_NAME } = require('@condo/domains/common/constants/utils')
const { checkPermissionInUserOrganizationOrRelatedOrganization } = require('@condo/domains/organization/utils/accessSchema')
const { getByCondition } = require('@core/keystone/schema')

async function canShareTicket ({ args: { data }, authentication: { item, listKey } }) {
    if (!listKey || !item) return throwAuthenticationError()
    if (item.deletedAt) return false

    if (listKey === USER_SCHEMA_NAME) {
        if (item.isAdmin) return true
        const ticket = await getByCondition('Ticket', { id: data.ticketId, deletedAt: null })

        return await checkPermissionInUserOrganizationOrRelatedOrganization(item.id, ticket.organization, 'canShareTickets')
    }

    return false
}

module.exports = {
    canShareTicket,
}
