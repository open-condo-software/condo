/**
 * Generated by `createservice ticket.PredictTicketClassificationService --type queries`
 */

const { makeClient } = require('@open-condo/keystone/test.utils')
const { expectToThrowAuthenticationError } = require('@open-condo/keystone/test.utils')

const { predictTicketClassificationByTestClient } = require('@condo/domains/ticket/utils/testSchema')
 
describe('PredictTicketClassificationService', () => {
    test('anonymous: execute', async () => {
        const client = await makeClient()
        await expectToThrowAuthenticationError(async () => {
            await predictTicketClassificationByTestClient(client)
        }, 'obj')
    })
})