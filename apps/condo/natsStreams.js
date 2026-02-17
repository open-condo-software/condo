const { streamRegistry } = require('@open-condo/nats')

const { getEmployedOrRelatedOrganizationsByPermissions } = require('@condo/domains/organization/utils/accessSchema')
const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')

streamRegistry.register('ticket-changes', {
    ttl: 3600,
    subjects: ['ticket-changes.>'],
    access: {
        read: async ({ authentication, context, organizationId, subject }) => {
            try {
                const { item: user } = authentication
                if (!user || user.deletedAt) return false

                const permittedOrganizations = await getEmployedOrRelatedOrganizationsByPermissions(context, user, ['canReadTickets'])
                if (!permittedOrganizations.includes(organizationId)) return false

                const ticketId = subject.split('.')[2]
                if (!ticketId) return true

                const ticket = await Ticket.getOne(context, {
                    id: ticketId,
                    organization: { id: organizationId },
                })

                return !!ticket
            } catch (error) {
                console.error('[NATS] Error in ticket-changes access check:', error)
                return false
            }
        },
    },
})

streamRegistry.register('property-changes', {
    ttl: 3600,
    subjects: ['property-changes.>'],
    access: {
        read: 'canManageProperties',
    },
})

streamRegistry.register('contact-changes', {
    ttl: 3600,
    subjects: ['contact-changes.>'],
    access: {
        read: 'canManageContacts',
    },
})

streamRegistry.register('billing-events', {
    ttl: 7200,
    subjects: ['billing-events.>'],
    access: {
        read: 'canReadBillingReceipts',
    },
})

streamRegistry.register('notification-events', {
    ttl: 1800,
    subjects: ['notification-events.>'],
    access: {
        read: true,
    },
})

module.exports = { streamRegistry }
