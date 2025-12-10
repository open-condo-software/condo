const { faker } = require('@faker-js/faker')

const mockWebhookPayload = {
    id: 'test-payload-id',
    url: 'https://example.com/webhook',
    payload: { eventType: 'test.event' },
    secret: 'test-secret',
    eventType: 'test.event',
}

const mockSendWebhookPayloadTask = {
    delay: jest.fn(),
}

jest.mock('../schema/utils/serverSchema', () => ({
    WebhookPayload: {
        create: jest.fn(() => Promise.resolve(mockWebhookPayload)),
    },
}))

jest.mock('../tasks', () => ({
    getWebhookTasks: jest.fn(() => ({
        sendWebhookPayload: mockSendWebhookPayloadTask,
    })),
}))

const { sendWebhookPayload } = require('./sendWebhookPayload')

const { WebhookPayload } = require('../schema/utils/serverSchema')
const { getWebhookTasks } = require('../tasks')


describe('sendWebhookPayload utility', () => {
    const mockContext = {}

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('successful webhook creation', () => {
        test('should create WebhookPayload and queue delivery task', async () => {
            const options = {
                url: 'https://example.com/webhook',
                payload: { eventType: 'test.event', data: { test: true } },
                secret: 'test-secret',
                eventType: 'test.event',
            }

            const result = await sendWebhookPayload(mockContext, options)

            expect(result).toEqual(mockWebhookPayload)
            expect(WebhookPayload.create).toHaveBeenCalledWith(
                mockContext,
                expect.objectContaining({
                    dv: 1,
                    url: options.url,
                    payload: JSON.stringify(options.payload), // payload is stringified for EncryptedText
                    secret: options.secret,
                    eventType: options.eventType,
                })
            )
            expect(mockSendWebhookPayloadTask.delay).toHaveBeenCalledWith(mockWebhookPayload.id)
        })

        test('should include modelName and itemId when provided', async () => {
            const options = {
                url: 'https://example.com/webhook',
                payload: { event: 'payment.status.changed' },
                secret: 'test-secret',
                eventType: 'payment.status.changed',
                modelName: 'Payment',
                itemId: faker.datatype.uuid(),
            }

            await sendWebhookPayload(mockContext, options)

            expect(WebhookPayload.create).toHaveBeenCalledWith(
                mockContext,
                expect.objectContaining({
                    modelName: options.modelName,
                    itemId: options.itemId,
                })
            )
        })

        test('should use custom sender when provided', async () => {
            const customSender = { dv: 1, fingerprint: 'Payment_webhookTrigger' }
            const options = {
                url: 'https://example.com/webhook',
                payload: { eventType: 'test.event' },
                secret: 'test-secret',
                eventType: 'test.event',
                sender: customSender,
            }

            await sendWebhookPayload(mockContext, options)

            expect(WebhookPayload.create).toHaveBeenCalledWith(
                mockContext,
                expect.objectContaining({
                    sender: customSender,
                })
            )
        })

        test('should use default sender when not provided', async () => {
            const options = {
                url: 'https://example.com/webhook',
                payload: { eventType: 'test.event' },
                secret: 'test-secret',
                eventType: 'test.event',
            }

            await sendWebhookPayload(mockContext, options)

            expect(WebhookPayload.create).toHaveBeenCalledWith(
                mockContext,
                expect.objectContaining({
                    sender: { dv: 1, fingerprint: 'webhooks-package' },
                })
            )
        })

        test('should set expiresAt and nextRetryAt timestamps', async () => {
            const options = {
                url: 'https://example.com/webhook',
                payload: { eventType: 'test.event' },
                secret: 'test-secret',
                eventType: 'test.event',
            }

            await sendWebhookPayload(mockContext, options)

            expect(WebhookPayload.create).toHaveBeenCalledWith(
                mockContext,
                expect.objectContaining({
                    expiresAt: expect.any(String),
                    nextRetryAt: expect.any(String),
                })
            )

            const createCall = WebhookPayload.create.mock.calls[0][1]
            const expiresAt = new Date(createCall.expiresAt)
            const nextRetryAt = new Date(createCall.nextRetryAt)
            const now = new Date()

            // nextRetryAt should be close to now
            expect(Math.abs(nextRetryAt - now)).toBeLessThan(5000)

            // expiresAt should be ~7 days from now (default TTL)
            const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
            expect(Math.abs(expiresAt - now - sevenDaysMs)).toBeLessThan(5000)
        })

        test('should use custom ttlDays when provided', async () => {
            const options = {
                url: 'https://example.com/webhook',
                payload: { eventType: 'test.event' },
                secret: 'test-secret',
                eventType: 'test.event',
                ttlDays: 14,
            }

            await sendWebhookPayload(mockContext, options)

            const createCall = WebhookPayload.create.mock.calls[0][1]
            const expiresAt = new Date(createCall.expiresAt)
            const now = new Date()

            // expiresAt should be ~14 days from now
            const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000
            expect(Math.abs(expiresAt - now - fourteenDaysMs)).toBeLessThan(5000)
        })
    })

    describe('parameter validation', () => {
        test('should throw error when url is missing', async () => {
            const options = {
                payload: { eventType: 'test.event' },
                secret: 'test-secret',
                eventType: 'test.event',
            }

            await expect(sendWebhookPayload(mockContext, options))
                .rejects.toThrow('Missing required parameters')
        })

        test('should throw error when payload is missing', async () => {
            const options = {
                url: 'https://example.com/webhook',
                secret: 'test-secret',
                eventType: 'test.event',
            }

            await expect(sendWebhookPayload(mockContext, options))
                .rejects.toThrow('Missing required parameters')
        })

        test('should throw error when secret is missing', async () => {
            const options = {
                url: 'https://example.com/webhook',
                payload: { eventType: 'test.event' },
                eventType: 'test.event',
            }

            await expect(sendWebhookPayload(mockContext, options))
                .rejects.toThrow('Missing required parameters')
        })

        test('should throw error when eventType is missing', async () => {
            const options = {
                url: 'https://example.com/webhook',
                payload: { eventType: 'test.event' },
                secret: 'test-secret',
            }

            await expect(sendWebhookPayload(mockContext, options))
                .rejects.toThrow('Missing required parameters')
        })
    })

    describe('optional parameters', () => {
        test('should set modelName to null when not provided', async () => {
            const options = {
                url: 'https://example.com/webhook',
                payload: { eventType: 'test.event' },
                secret: 'test-secret',
                eventType: 'test.event',
            }

            await sendWebhookPayload(mockContext, options)

            expect(WebhookPayload.create).toHaveBeenCalledWith(
                mockContext,
                expect.objectContaining({
                    modelName: null,
                    itemId: null,
                })
            )
        })
    })

    describe('task queuing', () => {
        test('should call getWebhookTasks to get the task', async () => {
            const options = {
                url: 'https://example.com/webhook',
                payload: { eventType: 'test.event' },
                secret: 'test-secret',
                eventType: 'test.event',
            }

            await sendWebhookPayload(mockContext, options)

            expect(getWebhookTasks).toHaveBeenCalled()
        })

        test('should queue task with created payload id', async () => {
            const options = {
                url: 'https://example.com/webhook',
                payload: { eventType: 'test.event' },
                secret: 'test-secret',
                eventType: 'test.event',
            }

            await sendWebhookPayload(mockContext, options)

            expect(mockSendWebhookPayloadTask.delay).toHaveBeenCalledWith(mockWebhookPayload.id)
        })
    })
})
