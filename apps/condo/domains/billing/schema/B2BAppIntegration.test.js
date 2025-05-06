const {
    expectToThrowAccessDeniedErrorToResult, makeClient,
} = require('@open-condo/keystone/test.utils')

const { CONTEXT_FINISHED_STATUS: BILLING_CONTEXT_FINISHED_STATUS } = require('@condo/domains/billing/constants/constants')
const { registerBillingReceiptsByTestClient } = require('@condo/domains/billing/utils/testSchema')
const { createTestBillingIntegrationOrganizationContext } = require('@condo/domains/billing/utils/testSchema')
const {
    TestUtils,
    OrganizationTestMixin,
    BillingTestMixin,
    B2BAppTestMixin,
} = require('@condo/domains/billing/utils/testSchema/testUtils')
const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/miniapp/constants')
const { createTestB2BAppContext } = require('@condo/domains/miniapp/utils/testSchema')

const { registerBillingReceiptFileByTestClient } = require('../utils/testSchema')

describe('B2BAccess check with B2BAccessToken', () => {

    let connectedB2BAppEnv = new TestUtils([BillingTestMixin, B2BAppTestMixin])
    let separateOrganizationEnv = new TestUtils([OrganizationTestMixin])

    beforeAll(async () => {
        await connectedB2BAppEnv.init()
        await separateOrganizationEnv.init()
        const [billingContext] = await createTestBillingIntegrationOrganizationContext(connectedB2BAppEnv.clients.support, separateOrganizationEnv.organization, connectedB2BAppEnv.billingIntegration, { status: BILLING_CONTEXT_FINISHED_STATUS })
        const [b2bAppContext] = await createTestB2BAppContext(separateOrganizationEnv.clients.support, connectedB2BAppEnv.b2bApp, separateOrganizationEnv.organization, { status: CONTEXT_FINISHED_STATUS })
        separateOrganizationEnv.billingContext = billingContext
        separateOrganizationEnv.b2bAppContext = b2bAppContext
        const [{ token: token1 }] = await connectedB2BAppEnv.createScopedAccessToken(connectedB2BAppEnv.b2bAppContext.id)
        connectedB2BAppEnv.b2bAccessToken = token1
        const [{ token: token2 }] = await connectedB2BAppEnv.createScopedAccessToken(separateOrganizationEnv.b2bAppContext.id)
        separateOrganizationEnv.b2bAccessToken = token2
    })


    describe('RegisterBillingReceipts', () => {

        beforeEach(async () => {
            await connectedB2BAppEnv.updateBillingIntegration({ b2bApp: { connect: { id: connectedB2BAppEnv.b2bApp.id } } })
            await connectedB2BAppEnv.updateTokenRightSet({ canExecuteRegisterBillingReceipts: true })
        })


        test('Has access if B2BApp is connected to BillingIntegration', async () => {
            const [[receipt]] = await registerBillingReceiptsByTestClient(connectedB2BAppEnv.clients.b2bServiceUser, {
                context: { id: connectedB2BAppEnv.billingContext.id },
                receipts: [connectedB2BAppEnv.createJSONReceipt()],
            })
            expect(receipt).toHaveProperty('id')
        })

        test('DOES NOT have access if B2BApp is NOT connected to BillingIntegration', async () => {
            await connectedB2BAppEnv.updateBillingIntegration({ b2bApp: { disconnectAll: true } })
            await expectToThrowAccessDeniedErrorToResult(async () => {
                await registerBillingReceiptsByTestClient(connectedB2BAppEnv.clients.b2bServiceUser, {
                    context: { id: connectedB2BAppEnv.billingContext.id },
                    receipts: [connectedB2BAppEnv.createJSONReceipt()],
                })
            })
        })

        test('Has access with correct B2BAccessToken', async () => {
            const client1 = await makeClient()
            client1.setHeaders({ Authorization: `Bearer ${connectedB2BAppEnv.b2bAccessToken}` })
            const [[receipt1]] = await registerBillingReceiptsByTestClient(client1, {
                context: { id: connectedB2BAppEnv.billingContext.id },
                receipts: [connectedB2BAppEnv.createJSONReceipt()],
            })
            expect(receipt1).toHaveProperty('id')
            const client2 = await makeClient()
            client2.setHeaders({ Authorization: `Bearer ${separateOrganizationEnv.b2bAccessToken}` })
            const [[receipt2]] = await registerBillingReceiptsByTestClient(client2, {
                context: { id: separateOrganizationEnv.billingContext.id },
                receipts: [connectedB2BAppEnv.createJSONReceipt()],
            })
            expect(receipt2).toHaveProperty('id')
        })

        test('DOES NOT have access with wrong B2BAccessToken', async () => {
            const client = await makeClient()
            client.setHeaders({ Authorization: `Bearer ${separateOrganizationEnv.b2bAccessToken}` })
            await expectToThrowAccessDeniedErrorToResult(async () => {
                await registerBillingReceiptsByTestClient(client, {
                    context: { id: connectedB2BAppEnv.billingContext.id },
                    receipts: [connectedB2BAppEnv.createJSONReceipt()],
                })
            })
        })

        test('DOES NOT have access with correct B2BAccessToken but without canExecuteRegisterBillingReceipts flag', async () => {
            await connectedB2BAppEnv.updateTokenRightSet({ canExecuteRegisterBillingReceipts: false })
            const client = await makeClient()
            client.setHeaders({ Authorization: `Bearer ${connectedB2BAppEnv.b2bAccessToken}` })
            await expectToThrowAccessDeniedErrorToResult(async () => {
                await registerBillingReceiptsByTestClient(client, {
                    context: { id: connectedB2BAppEnv.billingContext.id },
                    receipts: [connectedB2BAppEnv.createJSONReceipt()],
                })
            })
        })

    })

    describe('RegisterBillingReceiptFile', () => {

        beforeEach(async () => {
            await connectedB2BAppEnv.updateBillingIntegration({ b2bApp: { connect: { id: connectedB2BAppEnv.b2bApp.id } } })
            await connectedB2BAppEnv.updateTokenRightSet({ canExecuteRegisterBillingReceiptFile: true })
        })

        test('Has access if B2BApp is connected to BillingIntegration', async () => {
            const [[receipt]] = await connectedB2BAppEnv.createReceipts()
            const payload = {
                context: { id: receipt.context.id },
                receipt: { id: receipt.id },
            }
            const [data] = await registerBillingReceiptFileByTestClient(connectedB2BAppEnv.clients.b2bServiceUser, payload)
            expect(data).toHaveProperty('id')
        })

        test('DOES NOT have access if B2BApp is NOT connected to BillingIntegration', async () => {
            await connectedB2BAppEnv.updateBillingIntegration({ b2bApp: { disconnectAll: true } })
            const [[receipt]] = await connectedB2BAppEnv.createReceipts()
            const payload = {
                context: { id: receipt.context.id },
                receipt: { id: receipt.id },
            }
            await expectToThrowAccessDeniedErrorToResult(async () => {
                await registerBillingReceiptFileByTestClient(connectedB2BAppEnv.clients.b2bServiceUser, payload)
            })
        })

        test('Has access with correct B2BAccessToken', async () => {
            const client1 = await makeClient()
            client1.setHeaders({ Authorization: `Bearer ${connectedB2BAppEnv.b2bAccessToken}` })
            const [[receipt]] = await connectedB2BAppEnv.createReceipts()
            const payload = {
                context: { id: receipt.context.id },
                receipt: { id: receipt.id },
            }
            const [data] = await registerBillingReceiptFileByTestClient(client1, payload)
            expect(data).toHaveProperty('id')
        })

        test('DOES NOT have access with wrong B2BAccessToken', async () => {
            const client = await makeClient()
            client.setHeaders({ Authorization: `Bearer ${separateOrganizationEnv.b2bAccessToken}` })
            const [[receipt]] = await connectedB2BAppEnv.createReceipts()
            const payload = {
                context: { id: receipt.context.id },
                receipt: { id: receipt.id },
            }
            await expectToThrowAccessDeniedErrorToResult(async () => {
                await registerBillingReceiptFileByTestClient(client, payload)
            })
        })

        test('DOES NOT have access with correct B2BAccessToken but without canExecuteRegisterBillingReceiptFile flag', async () => {
            await connectedB2BAppEnv.updateTokenRightSet({ canExecuteRegisterBillingReceiptFile: false })
            const client = await makeClient()
            client.setHeaders({ Authorization: `Bearer ${connectedB2BAppEnv.b2bAccessToken}` })
            const [[receipt]] = await connectedB2BAppEnv.createReceipts()
            const payload = {
                context: { id: receipt.context.id },
                receipt: { id: receipt.id },
            }
            await expectToThrowAccessDeniedErrorToResult(async () => {
                await registerBillingReceiptFileByTestClient(client, payload)
            })
        })
    })

})