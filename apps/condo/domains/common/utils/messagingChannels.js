const { getLogger } = require('@open-condo/keystone/logging')
const { channelRegistry, buildTopic } = require('@open-condo/messaging')

const { getEmployedOrRelatedOrganizationsByPermissions } = require('@condo/domains/organization/utils/accessSchema')
const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')

const logger = getLogger()

function registerMessagingChannels () {
    channelRegistry.register('ticket-changes', {
        ttl: 3600,
        topics: [buildTopic('ticket-changes', '>')],
        access: {
            read: async ({ authentication, context, organizationId, topic }) => {
                try {
                    const { item: user } = authentication
                    if (!user || user.deletedAt) return false

                    const permittedOrganizations = await getEmployedOrRelatedOrganizationsByPermissions(context, user, ['canReadTickets'])
                    if (!permittedOrganizations.includes(organizationId)) return false

                    const ticketId = topic.split('.')[2]
                    if (!ticketId) return true

                    const ticket = await Ticket.getOne(context, {
                        id: ticketId,
                        organization: { id: organizationId },
                    })

                    return !!ticket
                } catch (error) {
                    logger.error({ msg: 'Error in ticket-changes access check', err: error })
                    return false
                }
            },
        },
    })
}

module.exports = { registerMessagingChannels }
