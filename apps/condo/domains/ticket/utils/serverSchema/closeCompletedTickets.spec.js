const { makeClientWithProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestTicket } = require('@condo/domains/ticket/utils/testSchema')
const { STATUS_IDS } = require('../../constants/statusTransitions')
const dayjs = require('dayjs')
const { Ticket } = require('../testSchema')
const closeCompletedTickets = require('@condo/domains/ticket/utils/serverSchema/closeCompletedTickets')
const { setFakeClientMode, prepareKeystoneExpressApp } = require('@core/keystone/test.utils')

let keystone

describe('closeCompletedTickets', () => {
    setFakeClientMode(require.resolve('../../../../index'))

    beforeAll(async () => {
        const result = await prepareKeystoneExpressApp(require.resolve('../../../../index'))
        keystone = result.keystone
    })

    test('close completed tickets which created 7 days ago', async () => {
        const client = await makeClientWithProperty()

        const [completed7DaysAgoTicket] = await createTestTicket(client, client.organization, client.property, {
            status: { connect: { id: STATUS_IDS.COMPLETED } },
            statusUpdatedAt: dayjs().startOf('day').subtract(1, 'week').toISOString(),
        })

        const [completed6DaysAgoTicket] = await createTestTicket(client, client.organization, client.property, {
            status: { connect: { id: STATUS_IDS.COMPLETED } },
            statusUpdatedAt: dayjs().startOf('day').subtract(6, 'days').toISOString(),
        })

        const [notCompletedTicket] = await createTestTicket(client, client.organization, client.property, {
            status: { connect: { id: STATUS_IDS.IN_PROGRESS } },
            statusUpdatedAt: dayjs().startOf('day').subtract(1, 'week').toISOString(),
        })

        const adminContext = await keystone.createContext({ skipAccessControl: true })
        await closeCompletedTickets(adminContext)

        const [closedTicket] = await Ticket.getAll(client, { id: completed7DaysAgoTicket.id })
        const [completedTicket] = await Ticket.getAll(client, { id: completed6DaysAgoTicket.id })
        const [readNotCompletedTicket] = await Ticket.getAll(client, { id: notCompletedTicket.id })

        expect(closedTicket.status.id).toEqual(STATUS_IDS.CLOSED)
        expect(completedTicket.status.id).toEqual(STATUS_IDS.COMPLETED)
        expect(readNotCompletedTicket.status.id).toEqual(STATUS_IDS.IN_PROGRESS)
    })
})