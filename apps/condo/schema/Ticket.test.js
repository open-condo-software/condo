/**
 * @jest-environment node
 * @test-style 3
 */

const { setFakeClientMode } = require('@core/keystone/test.utils')
const conf = require('@core/config')
if (conf.TESTS_FAKE_CLIENT_MODE) setFakeClientMode(require.resolve('../index'))
const faker = require('faker')
const { NUMBER_RE, UUID_RE, DATETIME_RE } = require('@core/keystone/test.utils')
const { makeLoggedInClient } = require('@core/keystone/test.utils')

const { Ticket } = require('./Ticket.gql')

Ticket.OPEN_STATUS_ID = '6ef3abc4-022f-481b-90fb-8430345ebfc2'
Ticket.UNKNOWN_CLASSIFIER_ID = '4f4b43d5-0951-425c-9428-945dc6193361'
Ticket.OTHER_SOURCE_ID = '7da1e3be-06ba-4c9e-bba6-f97f278ac6e4'
Ticket.DEFAULT_ORGANIZATION_ID = '1'
Ticket.DEFAULT_PROPERTY_ID = '5c7df4a7-6064-454e-bde2-eac3006cc09b'

test('create ticket by minimal fields (dv, organization, sender, source, classifier, status, details)', async () => {
    const client = await makeLoggedInClient()
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }
    const details = faker.random.alphaNumeric(10)
    const obj = await Ticket.create(client, {
        dv: 1,
        sender,
        details,
        organization: { connect: { id: Ticket.DEFAULT_ORGANIZATION_ID } },
        status: { connect: { id: Ticket.OPEN_STATUS_ID } },
        classifier: { connect: { id: Ticket.UNKNOWN_CLASSIFIER_ID } },
        source: { connect: { id: Ticket.OTHER_SOURCE_ID } },
        property: { connect: { id: Ticket.DEFAULT_PROPERTY_ID } },
    })
    expect(obj.id).toMatch(UUID_RE)
    expect(String(obj.number)).toMatch(NUMBER_RE)
    expect(obj.dv).toEqual(1)
    expect(obj.sender).toStrictEqual(sender)
    expect(obj.source).toEqual(expect.objectContaining({ id: Ticket.OTHER_SOURCE_ID }))
    expect(obj.sourceMeta).toEqual(null)
    expect(obj.classifier).toEqual(expect.objectContaining({ id: Ticket.UNKNOWN_CLASSIFIER_ID }))
    expect(obj.property).toEqual(expect.objectContaining({ id: Ticket.DEFAULT_PROPERTY_ID }))
    expect(obj.status).toEqual(expect.objectContaining({ id: Ticket.OPEN_STATUS_ID }))
    expect(obj.statusReopenedCounter).toEqual(0)
    expect(obj.statusReason).toEqual(null)
    expect(obj.details).toEqual(details)
    expect(obj.meta).toEqual(null)
    expect(obj.organization).toEqual(expect.objectContaining({ id: Ticket.DEFAULT_ORGANIZATION_ID }))
    expect(obj.client).toEqual(null)
    expect(obj.operator).toEqual(null)
    expect(obj.assignees).toEqual([])
    expect(obj.executors).toEqual([])
    expect(obj.v).toEqual(1)
    expect(obj.newId).toEqual(null)
    expect(obj.deletedAt).toEqual(null)
    expect(obj.createdBy).toEqual(expect.objectContaining({ id: client.user.id }))
    expect(obj.updatedBy).toEqual(expect.objectContaining({ id: client.user.id }))
    expect(obj.createdAt).toMatch(DATETIME_RE)
    expect(obj.updatedAt).toMatch(DATETIME_RE)
})
