const crypto = require('crypto')

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const express = require('express')

const {
    makeLoggedInAdminClient,
    waitFor,
    initTestExpressApp,
    getTestExpressApp,
    setFakeClientMode,
} = require('@open-condo/keystone/test.utils')
const { WebhookPayload } = require('@open-condo/webhooks/schema/utils/serverSchema')
const { getWebhookRegularTasks } = require('@open-condo/webhooks/tasks')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { PAYMENT_DONE_STATUS } = require('@condo/domains/acquiring/constants/payment')
const {
    createTestAcquiringIntegration,
    createTestAcquiringIntegrationContext,
    createTestPaymentStatusChangeWebhookUrl,
    createTestPayment,
    updateTestPayment,
} = require('@condo/domains/acquiring/utils/testSchema')
const { createTestRecipient } = require('@condo/domains/billing/utils/testSchema')
const {
    createTestInvoice,
} = require('@condo/domains/marketplace/utils/testSchema')
const {
    createTestOrganization,
} = require('@condo/domains/organization/utils/testSchema')


// Mock fetch to allow self-signed certificates for HTTPS in tests
jest.mock('@open-condo/keystone/fetch', () => {
    const originalModule = jest.requireActual('@open-condo/keystone/fetch')
    const https = require('https')

    return {
        ...originalModule,
        fetch: jest.fn((url, options = {}) => {
            // For HTTPS URLs, add agent with rejectUnauthorized: false
            if (url.startsWith('https://')) {
                //nosemgrep: problem-based-packs.insecure-transport.js-node.bypass-tls-verification.bypass-tls-verification
                const agent = new https.Agent({ rejectUnauthorized: false })
                return originalModule.fetch(url, { ...options, agent })
            }

            return originalModule.fetch(url, options)
        }),
    }
})

const { keystone } = index

describe('Invoice', () => {
    setFakeClientMode(index)

    describe('Webhook signature verification', () => {
        let adminClient
        let dummyOrganization
        let dummyAcquiringIntegrationContext

        beforeAll(async () => {
            adminClient = await makeLoggedInAdminClient()

            // Create test organization
            const [organization] = await createTestOrganization(adminClient)
            dummyOrganization = organization

            // Create acquiring integration and context
            const [dummyAcquiringIntegration] = await createTestAcquiringIntegration(adminClient)
            // const [dummyRecipient] = await createTestRecipient(adminClient, organization)
            const [acquiringContext] = await createTestAcquiringIntegrationContext(adminClient, organization, dummyAcquiringIntegration, {
                status: CONTEXT_FINISHED_STATUS,
                recipient: createTestRecipient(), //{ connect: { id: dummyRecipient.id } },
                invoiceStatus: CONTEXT_FINISHED_STATUS,
                invoiceRecipient: createTestRecipient(),
            })
            dummyAcquiringIntegrationContext = acquiringContext
        })

        describe('webhook signature', () => {
            // Setup webhook test server at module level
            const webhookPath = `/webhook-${faker.random.alphaNumeric(16)}`
            const webhookRequests = []
            // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
            const webhookApp = express()
            webhookApp.use(express.json())
            webhookApp.post(webhookPath, (req, res) => {
                webhookRequests.push({
                    headers: req.headers,
                    body: req.body,
                })
                res.status(200).json({ received: true })
            })
            initTestExpressApp('InvoiceWebhookServer', webhookApp, 'https')

            test('webhook signature can be verified after invoice payment using real HTTP server', async () => {
                // Clear previous webhook requests
                webhookRequests.length = 0

                // Get the test server URL
                const testServer = getTestExpressApp('InvoiceWebhookServer')
                const callbackUrl = `${testServer.baseUrl}${webhookPath}`

                // Add URL to whitelist
                await createTestPaymentStatusChangeWebhookUrl(adminClient, {
                    url: callbackUrl,
                    isEnabled: true,
                })

                // Create invoice with whitelisted callback URL
                const [invoice] = await createTestInvoice(adminClient, dummyOrganization, {
                    paymentStatusChangeWebhookUrl: callbackUrl,
                })

                expect(invoice.paymentStatusChangeWebhookUrl).toBe(callbackUrl)
                expect(invoice.paymentStatusChangeWebhookSecret).toBeTruthy()
                // On creation, secret is returned as plain text (64 hex characters)
                expect(invoice.paymentStatusChangeWebhookSecret).toMatch(/^[0-9a-f]{64}$/)
                expect(invoice.paymentStatusChangeWebhookSecret).not.toContain(':condo_')
                const plainTextSecret = invoice.paymentStatusChangeWebhookSecret

                // Create a Payment for the invoice using the existing acquiring context
                const [payment] = await createTestPayment(adminClient, dummyOrganization, null, dummyAcquiringIntegrationContext, {
                    invoice,
                })

                // Mark payment as paid to trigger the webhook
                // The Payment afterChange hook will automatically call sendPaymentStatusChangeWebhook
                await updateTestPayment(adminClient, payment.id, {
                    status: PAYMENT_DONE_STATUS,
                    advancedAt: new Date().toISOString(),
                })

                // Wait for the webhook payload to be created by the afterChange hook
                let webhookPayload
                await waitFor(async () => {
                    webhookPayload = await WebhookPayload.getOne(keystone, {
                        modelName: 'Payment',
                        itemId: payment.id,
                    })
                    expect(webhookPayload).toBeTruthy()
                }, { timeout: 5000, interval: 100 })

                const sendWebhookPayloadTask = getWebhookRegularTasks().sendWebhookPayload
                await sendWebhookPayloadTask.delay.fn(webhookPayload.id)

                // Wait for webhook to be sent to our test server (with longer timeout for async task processing)
                await waitFor(async () => {
                    // return webhookRequests.length > 0
                    expect(webhookRequests.length).toBeGreaterThan(0)
                }, { timeout: 10000, interval: 500 }) // Wait up to 10 seconds, check every 500ms

                // Verify webhook was received
                expect(webhookRequests.length).toBeGreaterThan(0)
                expect(webhookRequests).toHaveLength(1)
                const webhookRequest = webhookRequests[0]

                // Verify webhook has signature header
                expect(webhookRequest.headers['x-webhook-signature']).toBeDefined()
                const receivedSignature = webhookRequest.headers['x-webhook-signature']

                // Verify signature using the plain text secret we saved on creation
                // This is what API consumers will do when they receive webhooks
                const payload = JSON.stringify(webhookRequest.body)
                const expectedSignature = crypto
                    .createHmac('sha256', plainTextSecret)
                    .update(payload)
                    .digest('hex')

                // The signature should match - proving the plain text secret can verify webhooks
                expect(receivedSignature).toBe(expectedSignature)

                // Verify webhook payload is a Payment object with invoice data
                expect(webhookRequest.body).toMatchObject({
                    __typename: 'Payment',
                    id: payment.id,
                    status: PAYMENT_DONE_STATUS,
                    invoice: {
                        __typename: 'Invoice',
                        id: invoice.id,
                        number: invoice.number,
                        toPay: invoice.toPay,
                    },
                })

                // Additional verification: wrong secret should produce different signature
                const wrongSecret = 'a'.repeat(64)
                const wrongSignature = crypto
                    .createHmac('sha256', wrongSecret)
                    .update(payload)
                    .digest('hex')

                expect(wrongSignature).not.toBe(receivedSignature)
            })
        })
    })
})
