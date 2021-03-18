const faker = require('faker')
const { makeClientWithProperty } = require('../Property/Property.test')
const { NUMBER_RE, UUID_RE, DATETIME_RE } = require('@core/keystone/test.utils')
const OPEN_STATUS_ID ='6ef3abc4-022f-481b-90fb-8430345ebfc2'

const { Ticket } = require('../../gql/Ticket')

const UNKNOWN_CLASSIFIER_ID = '4f4b43d5-0951-425c-9428-945dc6193361'
const OTHER_SOURCE_ID = '7da1e3be-06ba-4c9e-bba6-f97f278ac6e4'

async function createTicket (client, organization, property, extraAttrs = {}) {
    if (!client) throw new Error('no client')
    if (!organization || !organization.id) throw new Error('no organization.id')
    if (!property || !property.id) throw new Error('no property.id')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }
    const details = faker.random.alphaNumeric(10)

    const attrs = {
        dv: 1,
        sender,
        details,
        organization: { connect: { id: organization.id } },
        property: { connect: { id: property.id } },
        status: { connect: { id: OPEN_STATUS_ID } },
        classifier: { connect: { id: UNKNOWN_CLASSIFIER_ID } },
        source: { connect: { id: OTHER_SOURCE_ID } },
        ...extraAttrs,
    }
    const obj = await Ticket.create(client, attrs)
    return [obj, attrs]
}

// async function updateTicket (client, ticket, values) {
//     const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }
//
//     return await Ticket.update(client, ticket.id, { ...values, dv: 1, sender })
// }

test('user: createTicket()', async () => {
    const client = await makeClientWithProperty()
    const [ticket, attrs] = await createTicket(client, client.organization, client.property)
    expect(ticket.id).toMatch(UUID_RE)
    expect(String(ticket.number)).toMatch(NUMBER_RE)
    expect(ticket.dv).toEqual(1)
    expect(ticket.sender).toEqual(attrs.sender)
    expect(ticket.source).toEqual(expect.objectContaining({ id: OTHER_SOURCE_ID }))
    expect(ticket.sourceMeta).toEqual(null)
    expect(ticket.classifier).toEqual(expect.objectContaining({ id: UNKNOWN_CLASSIFIER_ID }))
    expect(ticket.property).toEqual(expect.objectContaining({ id: client.property.id }))
    expect(ticket.status).toEqual(expect.objectContaining({ id: OPEN_STATUS_ID }))
    expect(ticket.statusReopenedCounter).toEqual(0)
    expect(ticket.statusReason).toEqual(null)
    expect(ticket.statusUpdatedAt).toBeNull()
    expect(ticket.details).toEqual(attrs.details)
    expect(ticket.meta).toEqual(null)
    expect(ticket.organization).toEqual(expect.objectContaining({ id: client.organization.id }))
    expect(ticket.client).toEqual(null)
    expect(ticket.operator).toEqual(null)
    expect(ticket.assignee).toEqual(null)
    expect(ticket.isPaid).toEqual(false)
    expect(ticket.isEmergency).toEqual(false)
    expect(ticket.executor).toEqual(null)
    expect(ticket.watchers).toEqual([])
    expect(ticket.v).toEqual(1)
    expect(ticket.newId).toEqual(null)
    expect(ticket.deletedAt).toEqual(null)
    expect(ticket.createdBy).toEqual(expect.objectContaining({ id: client.user.id }))
    expect(ticket.updatedBy).toEqual(expect.objectContaining({ id: client.user.id }))
    expect(ticket.createdAt).toMatch(DATETIME_RE)
    expect(ticket.updatedAt).toMatch(DATETIME_RE)
})
//
// test('should correctly update ticket status without ticket number increment', async () => {
//     const client = await makeClientWithProperty()
//     const [ticket] = await createTicket(client, client.organization, client.property)
//     const prevTicketNmber = ticket.number
//     const obj = await updateTicket(client, ticket, { status: { connect: { id: 'f0fa0093-8d86-4e69-ae1a-70a2914da82f' } } })
//
//     expect(obj.number).toEqual(prevTicketNmber)
// })