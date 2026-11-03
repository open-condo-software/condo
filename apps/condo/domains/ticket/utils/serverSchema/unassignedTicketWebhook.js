const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { find, getById, getSchemaCtx } = require('@open-condo/keystone/schema')
const { queueWebhookPayload } = require('@open-condo/webhooks/utils/queueWebhookPayload')

const { WEBHOOK_EVENT_TICKET_UNASSIGNED } = require('@condo/domains/common/constants/webhooks')
const { TICKET_SOURCE_IDS_BY_TYPE } = require('@condo/domains/ticket/constants/sources')
const { STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')

const logger = getLogger()

const RESIDENT_SOURCE_IDS = [
    TICKET_SOURCE_IDS_BY_TYPE.MOBILE_APP,
    TICKET_SOURCE_IDS_BY_TYPE.WEB_APP_RESIDENT,
    TICKET_SOURCE_IDS_BY_TYPE.MESSENGER,
]

/** Open resident ticket that still has no assignee or no executor */
function isUnassignedResidentTicket (ticket) {
    if (!ticket || ticket.deletedAt) return false

    return ticket.status === STATUS_IDS.OPEN
        && RESIDENT_SOURCE_IDS.includes(ticket.source)
        && (!ticket.assignee || !ticket.executor)
}

/**
 * Sent once a ticket becomes unassigned (see isUnassignedResidentTicket) in an organization
 * linked to TICKET_WEBHOOK_ORGANIZATION_ID
 */
async function queueUnassignedTicketWebhook (ticketId) {
    const url = conf['TICKET_WEBHOOK_URL']
    const secret = conf['TICKET_WEBHOOK_SECRET']
    const holdingId = conf['TICKET_WEBHOOK_ORGANIZATION_ID']
    if (!url || !secret || !holdingId) return null

    const ticket = await getById('Ticket', ticketId)
    if (!ticket || ticket.deletedAt) return null

    const links = await find('OrganizationLink', {
        from: { id: holdingId },
        to: { id: ticket.organization },
        deletedAt: null,
    })
    if (links.length === 0) {
        logger.info({ msg: 'ticket organization is not linked to webhook organization', entity: 'Ticket', entityId: ticket.id })
        return null
    }

    const organization = await getById('Organization', ticket.organization)
    const payload = {
        eventType: WEBHOOK_EVENT_TICKET_UNASSIGNED,
        ticket: {
            id: ticket.id,
            number: ticket.number,
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt,
            v: ticket.v,
            organization: { id: organization.id, name: organization.name },
        },
    }

    const { keystone: context } = getSchemaCtx('WebhookPayload')
    return await queueWebhookPayload(context, {
        url,
        secret,
        payload,
        eventType: WEBHOOK_EVENT_TICKET_UNASSIGNED,
        modelName: 'Ticket',
        itemId: ticket.id,
        sender: { dv: 1, fingerprint: 'unassigned-ticket-webhook' },
    })
}

module.exports = {
    isUnassignedResidentTicket,
    queueUnassignedTicketWebhook,
}
