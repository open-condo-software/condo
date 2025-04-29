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

    let environment1 = new TestUtils([BillingTestMixin, B2BAppTestMixin])
    let environment2 = new TestUtils([OrganizationTestMixin])

    beforeAll(async () => {
        await environment1.init()
        await environment2.init()
        const [billingContext] = await createTestBillingIntegrationOrganizationContext(environment1.clients.support, environment2.organization, environment1.billingIntegration, { status: BILLING_CONTEXT_FINISHED_STATUS })
        const [b2bAppContext] = await createTestB2BAppContext(environment2.clients.support, environment1.b2bApp, environment2.organization, { status: CONTEXT_FINISHED_STATUS })
        environment2.billingContext = billingContext
        environment2.b2bAppContext = b2bAppContext
        const [{ token: token1 }] = await environment1.createScopedAccessToken(environment1.b2bAppContext.id)
        environment1.b2bAccessToken = token1
        const [{ token: token2 }] = await environment1.createScopedAccessToken(environment2.b2bAppContext.id)
        environment2.b2bAccessToken = token2
    })


    describe('RegisterBillingReceipts', () => {

        beforeEach(async () => {
            await environment1.updateBillingIntegration({ b2bApp: { connect: { id: environment1.b2bApp.id } } })
            await environment1.updateTokenRightSet({ canExecuteRegisterBillingReceipts: true })
        })


        test('Has access if B2BApp is connected to BillingIntegration', async () => {
            const [[receipt]] = await registerBillingReceiptsByTestClient(environment1.clients.b2bServiceUser, {
                context: { id: environment1.billingContext.id },
                receipts: [environment1.createJSONReceipt()],
            })
            expect(receipt).toHaveProperty('id')
        })

        test('DO NOT has access if B2BApp is NOT connected to BillingIntegration', async () => {
            await environment1.updateBillingIntegration({ b2bApp: { disconnectAll: true } })
            await expectToThrowAccessDeniedErrorToResult(async () => {
                await registerBillingReceiptsByTestClient(environment1.clients.b2bServiceUser, {
                    context: { id: environment1.billingContext.id },
                    receipts: [environment1.createJSONReceipt()],
                })
            })
        })

        test('Has access with correct B2BAccessToken', async () => {
            const client1 = await makeClient()
            client1.setHeaders({ Authorization: `Bearer ${environment1.b2bAccessToken}` })
            const [[receipt1]] = await registerBillingReceiptsByTestClient(client1, {
                context: { id: environment1.billingContext.id },
                receipts: [environment1.createJSONReceipt()],
            })
            expect(receipt1).toHaveProperty('id')
            const client2 = await makeClient()
            client2.setHeaders({ Authorization: `Bearer ${environment2.b2bAccessToken}` })
            const [[receipt2]] = await registerBillingReceiptsByTestClient(client2, {
                context: { id: environment2.billingContext.id },
                receipts: [environment1.createJSONReceipt()],
            })
            expect(receipt2).toHaveProperty('id')
        })

        test('Has NO access with wrong B2BAccessToken', async () => {
            const client = await makeClient()
            client.setHeaders({ Authorization: `Bearer ${environment2.b2bAccessToken}` })
            await expectToThrowAccessDeniedErrorToResult(async () => {
                await registerBillingReceiptsByTestClient(client, {
                    context: { id: environment1.billingContext.id },
                    receipts: [environment1.createJSONReceipt()],
                })
            })
        })

        test('Has NO access with correct B2BAccessToken but without canExecuteRegisterBillingReceipts flag', async () => {
            await environment1.updateTokenRightSet({ canExecuteRegisterBillingReceipts: false })
            const client = await makeClient()
            client.setHeaders({ Authorization: `Bearer ${environment1.b2bAccessToken}` })
            await expectToThrowAccessDeniedErrorToResult(async () => {
                await registerBillingReceiptsByTestClient(client, {
                    context: { id: environment1.billingContext.id },
                    receipts: [environment1.createJSONReceipt()],
                })
            })
        })

    })

    describe('RegisterBillingReceiptFile', () => {

        beforeEach(async () => {
            await environment1.updateBillingIntegration({ b2bApp: { connect: { id: environment1.b2bApp.id } } })
            await environment1.updateTokenRightSet({ canExecuteRegisterBillingReceiptFile: true })
        })

        test('Has access if B2BApp is connected to BillingIntegration', async () => {
            const [[receipt]] = await environment1.createReceipts()
            const payload = {
                context: { id: receipt.context.id },
                receipt: { id: receipt.id },
            }
            const [data] = await registerBillingReceiptFileByTestClient(environment1.clients.b2bServiceUser, payload)
            expect(data).toHaveProperty('id')
        })

        test('DO NOT has access if B2BApp is NOT connected to BillingIntegration', async () => {
            await environment1.updateBillingIntegration({ b2bApp: { disconnectAll: true } })
            const [[receipt]] = await environment1.createReceipts()
            const payload = {
                context: { id: receipt.context.id },
                receipt: { id: receipt.id },
            }
            await expectToThrowAccessDeniedErrorToResult(async () => {
                await registerBillingReceiptFileByTestClient(environment1.clients.b2bServiceUser, payload)
            })
        })

        test('Has access with correct B2BAccessToken', async () => {
            const client1 = await makeClient()
            client1.setHeaders({ Authorization: `Bearer ${environment1.b2bAccessToken}` })
            const [[receipt]] = await environment1.createReceipts()
            const payload = {
                context: { id: receipt.context.id },
                receipt: { id: receipt.id },
            }
            const [data] = await registerBillingReceiptFileByTestClient(client1, payload)
            expect(data).toHaveProperty('id')
        })

        test('Has NO access with wrong B2BAccessToken', async () => {
            const client = await makeClient()
            client.setHeaders({ Authorization: `Bearer ${environment2.b2bAccessToken}` })
            const [[receipt]] = await environment1.createReceipts()
            const payload = {
                context: { id: receipt.context.id },
                receipt: { id: receipt.id },
            }
            await expectToThrowAccessDeniedErrorToResult(async () => {
                await registerBillingReceiptFileByTestClient(client, payload)
            })
        })

        test('Has NO access with correct B2BAccessToken but without canExecuteRegisterBillingReceiptFile flag', async () => {
            await environment1.updateTokenRightSet({ canExecuteRegisterBillingReceiptFile: false })
            const client = await makeClient()
            client.setHeaders({ Authorization: `Bearer ${environment1.b2bAccessToken}` })
            const [[receipt]] = await environment1.createReceipts()
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