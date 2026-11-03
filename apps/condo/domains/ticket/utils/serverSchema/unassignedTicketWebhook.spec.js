const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')
const { WebhookPayload } = require('@open-condo/webhooks/schema/utils/testSchema')
const { encryptionManager } = require('@open-condo/webhooks/utils/encryption')

const { WEBHOOK_EVENT_TICKET_UNASSIGNED } = require('@condo/domains/common/constants/webhooks')
const { HOLDING_TYPE } = require('@condo/domains/organization/constants/common')
const { createTestOrganization, createTestOrganizationLink } = require('@condo/domains/organization/utils/testSchema')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { TICKET_SOURCE_IDS_BY_TYPE } = require('@condo/domains/ticket/constants/sources')
const { STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')
const { createTestTicket } = require('@condo/domains/ticket/utils/testSchema')

const { isUnassignedResidentTicket, queueUnassignedTicketWebhook } = require('./unassignedTicketWebhook')

const WEBHOOK_ENV = {
    TICKET_WEBHOOK_URL: 'https://ticket-webhook.example.com/webhook',
    TICKET_WEBHOOK_SECRET: 'ticket-webhook-secret',
}

describe('unassignedTicketWebhook', () => {
    setFakeClientMode(index)

    let admin, linkedOrganization, linkedTicket, notLinkedTicket
    const previousEnv = {}

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()

        const [holding] = await createTestOrganization(admin, { type: HOLDING_TYPE })
        const [organization] = await createTestOrganization(admin)
        linkedOrganization = organization
        await createTestOrganizationLink(admin, holding, linkedOrganization)
        const [linkedProperty] = await createTestProperty(admin, linkedOrganization)
        const [ticket] = await createTestTicket(admin, linkedOrganization, linkedProperty, {
            source: { connect: { id: TICKET_SOURCE_IDS_BY_TYPE.MOBILE_APP } },
        })
        linkedTicket = ticket

        const [notLinkedOrganization] = await createTestOrganization(admin)
        const [notLinkedProperty] = await createTestProperty(admin, notLinkedOrganization)
        const [otherTicket] = await createTestTicket(admin, notLinkedOrganization, notLinkedProperty, {
            source: { connect: { id: TICKET_SOURCE_IDS_BY_TYPE.MOBILE_APP } },
        })
        notLinkedTicket = otherTicket

        // set after tickets are created, so Ticket.afterChange does not queue the task for the worker
        const env = { ...WEBHOOK_ENV, TICKET_WEBHOOK_ORGANIZATION_ID: holding.id }
        for (const [key, value] of Object.entries(env)) {
            previousEnv[key] = process.env[key]
            process.env[key] = value
        }
    })

    afterAll(() => {
        for (const [key, value] of Object.entries(previousEnv)) {
            if (value === undefined) delete process.env[key]
            else process.env[key] = value
        }
    })

    describe('isUnassignedResidentTicket', () => {
        const ticket = {
            status: STATUS_IDS.OPEN,
            source: TICKET_SOURCE_IDS_BY_TYPE.MOBILE_APP,
            assignee: null,
            executor: null,
            deletedAt: null,
        }

        test('open resident ticket without assignee or executor is unassigned', () => {
            expect(isUnassignedResidentTicket(ticket)).toBe(true)
            expect(isUnassignedResidentTicket({ ...ticket, assignee: faker.datatype.uuid() })).toBe(true)
            expect(isUnassignedResidentTicket({ ...ticket, executor: faker.datatype.uuid() })).toBe(true)
        })

        test('ticket with assignee and executor is not unassigned', () => {
            expect(isUnassignedResidentTicket({ ...ticket, assignee: faker.datatype.uuid(), executor: faker.datatype.uuid() })).toBe(false)
        })

        test('ticket in other status, from other source or deleted is not unassigned', () => {
            expect(isUnassignedResidentTicket({ ...ticket, status: STATUS_IDS.IN_PROGRESS })).toBe(false)
            expect(isUnassignedResidentTicket({ ...ticket, source: TICKET_SOURCE_IDS_BY_TYPE.CALL })).toBe(false)
            expect(isUnassignedResidentTicket({ ...ticket, deletedAt: new Date().toISOString() })).toBe(false)
        })
    })

    test('queues webhook payload for ticket of organization linked to webhook organization', async () => {
        const queuedPayload = await queueUnassignedTicketWebhook(linkedTicket.id)

        const webhookPayload = await WebhookPayload.getOne(admin, { id: queuedPayload.id })
        expect(webhookPayload.url).toBe(WEBHOOK_ENV.TICKET_WEBHOOK_URL)
        expect(webhookPayload.eventType).toBe(WEBHOOK_EVENT_TICKET_UNASSIGNED)
        expect(webhookPayload.modelName).toBe('Ticket')
        expect(webhookPayload.itemId).toBe(linkedTicket.id)

        const payload = JSON.parse(encryptionManager.decrypt(webhookPayload.payload))
        expect(payload).toEqual({
            eventType: WEBHOOK_EVENT_TICKET_UNASSIGNED,
            ticket: {
                id: linkedTicket.id,
                number: linkedTicket.number,
                createdAt: linkedTicket.createdAt,
                updatedAt: linkedTicket.updatedAt,
                v: linkedTicket.v,
                organization: { id: linkedOrganization.id, name: linkedOrganization.name },
            },
        })
    })

    test('does not queue webhook payload for ticket of organization not linked to webhook organization', async () => {
        const queuedPayload = await queueUnassignedTicketWebhook(notLinkedTicket.id)

        expect(queuedPayload).toBeNull()
        const webhookPayloads = await WebhookPayload.getAll(admin, { itemId: notLinkedTicket.id })
        expect(webhookPayloads).toHaveLength(0)
    })
})
