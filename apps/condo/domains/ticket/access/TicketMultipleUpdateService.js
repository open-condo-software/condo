/**
 * Generated by `createservice ticket.TicketMultipleUpdateService --type mutations`
 */
const get = require('lodash/get')

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { getById } = require('@open-condo/keystone/schema')

const { checkPermissionInUserOrganizationOrRelatedOrganization } = require('@condo/domains/organization/utils/accessSchema')

async function canTicketMultipleUpdate (data) {
    const { authentication: { item: user } } = data

    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return true

    const ticketId = get(data, 'args.data.id')
    if (!ticketId) return false

    const ticket = await getById('Ticket', ticketId)

    return await checkPermissionInUserOrganizationOrRelatedOrganization(user.id, ticket.organization, 'canManageTickets')
}

/*
  Rules are logical functions that used for list access, and may return a boolean (meaning
  all or no items are available) or a set of filters that limit the available items.
*/
module.exports = {
    canTicketMultipleUpdate,
}