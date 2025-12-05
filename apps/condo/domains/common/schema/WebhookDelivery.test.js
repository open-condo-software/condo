/**
 * @jest-environment node
 */

const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const {
    makeLoggedInAdminClient,
    makeClient,
    UUID_RE,
    expectToThrowAccessDeniedErrorToObj,
    expectToThrowAccessDeniedErrorToObjects,
    expectToThrowAuthenticationErrorToObj,
    expectToThrowAuthenticationErrorToObjects,
} = require('@open-condo/keystone/test.utils')

const {
    WEBHOOK_DELIVERY_STATUS_PENDING,
    WEBHOOK_DELIVERY_STATUS_SUCCESS,
    WEBHOOK_DELIVERY_STATUS_FAILED,
} = require('@condo/domains/common/constants/webhook')
const {
    WebhookDelivery,
    createTestWebhookDelivery,
    updateTestWebhookDelivery,
} = require('@condo/domains/common/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')


describe('WebhookDelivery', () => {
    let adminClient

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
    })

    describe('CRUD', () => {
        describe('Create', () => {
            test('admin: can create WebhookDelivery', async () => {
                const [delivery] = await createTestWebhookDelivery(adminClient)

                expect(delivery.id).toMatch(UUID_RE)
                expect(delivery.status).toBe(WEBHOOK_DELIVERY_STATUS_PENDING)
                expect(delivery.attempt).toBe(0)
                expect(delivery.payload).toBeDefined()
                expect(delivery.url).toBe('https://example.com/webhook')
                expect(delivery.eventType).toBe('test.event')
            })

            test('admin: can create WebhookDelivery with custom payload', async () => {
                const customPayload = {
                    event: 'payment.status.changed',
                    data: {
                        paymentId: faker.datatype.uuid(),
                        previousStatus: 'CREATED',
                        newStatus: 'PROCESSING',
                    },
                }

                const [delivery] = await createTestWebhookDelivery(adminClient, {
                    payload: customPayload,
                    eventType: 'payment.status.changed',
                })

                expect(delivery.payload).toEqual(customPayload)
                expect(delivery.eventType).toBe('payment.status.changed')
            })

            test('admin: can create WebhookDelivery with modelName and itemId', async () => {
                const itemId = faker.datatype.uuid()

                const [delivery] = await createTestWebhookDelivery(adminClient, {
                    modelName: 'Payment',
                    itemId,
                })

                expect(delivery.modelName).toBe('Payment')
                expect(delivery.itemId).toBe(itemId)
            })

            test('anonymous: cannot create WebhookDelivery', async () => {
                const anonymousClient = await makeClient()

                await expectToThrowAuthenticationErrorToObj(async () => {
                    await createTestWebhookDelivery(anonymousClient)
                })
            })

            test('user: cannot create WebhookDelivery', async () => {
                const userClient = await makeClientWithNewRegisteredAndLoggedInUser()

                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await createTestWebhookDelivery(userClient)
                })
            })
        })

        describe('Read', () => {
            test('admin: can read WebhookDelivery', async () => {
                const [delivery] = await createTestWebhookDelivery(adminClient)

                const readDelivery = await WebhookDelivery.getOne(adminClient, { id: delivery.id })

                expect(readDelivery.id).toBe(delivery.id)
                expect(readDelivery.status).toBe(WEBHOOK_DELIVERY_STATUS_PENDING)
            })

            test('anonymous: cannot read WebhookDelivery', async () => {
                const [delivery] = await createTestWebhookDelivery(adminClient)
                const anonymousClient = await makeClient()

                await expectToThrowAuthenticationErrorToObjects(async () => {
                    await WebhookDelivery.getOne(anonymousClient, { id: delivery.id })
                })
            })

            test('user: cannot read WebhookDelivery', async () => {
                const [delivery] = await createTestWebhookDelivery(adminClient)
                const userClient = await makeClientWithNewRegisteredAndLoggedInUser()

                await expectToThrowAccessDeniedErrorToObjects(async () => {
                    await WebhookDelivery.getOne(userClient, { id: delivery.id })
                })
            })
        })

        describe('Update', () => {
            test('admin: can update WebhookDelivery status to success', async () => {
                const [delivery] = await createTestWebhookDelivery(adminClient)

                const [updatedDelivery] = await updateTestWebhookDelivery(adminClient, delivery.id, {
                    status: WEBHOOK_DELIVERY_STATUS_SUCCESS,
                    lastHttpStatusCode: 200,
                    lastResponseBody: '{"received":true}',
                    lastSentAt: dayjs().toISOString(),
                    attempt: 1,
                })

                expect(updatedDelivery.status).toBe(WEBHOOK_DELIVERY_STATUS_SUCCESS)
                expect(updatedDelivery.lastHttpStatusCode).toBe(200)
                expect(updatedDelivery.lastResponseBody).toBe('{"received":true}')
                expect(updatedDelivery.attempt).toBe(1)
            })

            test('admin: can update WebhookDelivery status to failed', async () => {
                const [delivery] = await createTestWebhookDelivery(adminClient)

                const [updatedDelivery] = await updateTestWebhookDelivery(adminClient, delivery.id, {
                    status: WEBHOOK_DELIVERY_STATUS_FAILED,
                    lastErrorMessage: 'Connection refused',
                    attempt: 5,
                })

                expect(updatedDelivery.status).toBe(WEBHOOK_DELIVERY_STATUS_FAILED)
                expect(updatedDelivery.lastErrorMessage).toBe('Connection refused')
                expect(updatedDelivery.attempt).toBe(5)
            })

            test('admin: can update nextRetryAt for retry scheduling', async () => {
                const [delivery] = await createTestWebhookDelivery(adminClient)
                const nextRetryAt = dayjs().add(5, 'minute').toISOString()

                const [updatedDelivery] = await updateTestWebhookDelivery(adminClient, delivery.id, {
                    nextRetryAt,
                    lastHttpStatusCode: 500,
                    lastErrorMessage: 'HTTP 500: Internal Server Error',
                    attempt: 1,
                })

                expect(updatedDelivery.nextRetryAt).toBe(nextRetryAt)
                expect(updatedDelivery.lastHttpStatusCode).toBe(500)
            })

            test('anonymous: cannot update WebhookDelivery', async () => {
                const [delivery] = await createTestWebhookDelivery(adminClient)
                const anonymousClient = await makeClient()

                await expectToThrowAuthenticationErrorToObj(async () => {
                    await updateTestWebhookDelivery(anonymousClient, delivery.id, {
                        status: WEBHOOK_DELIVERY_STATUS_SUCCESS,
                    })
                })
            })

            test('user: cannot update WebhookDelivery', async () => {
                const [delivery] = await createTestWebhookDelivery(adminClient)
                const userClient = await makeClientWithNewRegisteredAndLoggedInUser()

                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestWebhookDelivery(userClient, delivery.id, {
                        status: WEBHOOK_DELIVERY_STATUS_SUCCESS,
                    })
                })
            })
        })

        describe('Delete', () => {
            test('admin: cannot hard delete WebhookDelivery', async () => {
                const [delivery] = await createTestWebhookDelivery(adminClient)

                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await WebhookDelivery.delete(adminClient, delivery.id)
                })
            })

            test('admin: can soft delete WebhookDelivery', async () => {
                const [delivery] = await createTestWebhookDelivery(adminClient)

                const [deletedDelivery] = await updateTestWebhookDelivery(adminClient, delivery.id, {
                    deletedAt: dayjs().toISOString(),
                })

                expect(deletedDelivery.deletedAt).not.toBeNull()

                // Should not be found in normal queries
                const found = await WebhookDelivery.getOne(adminClient, { id: delivery.id })
                expect(found).toBeUndefined()
            })
        })
    })

    describe('Field validation', () => {
        test('expiresAt defaults to 7 days from now if not provided', async () => {
            const now = dayjs()
            const [delivery] = await createTestWebhookDelivery(adminClient, {
                expiresAt: undefined,
            })

            const expiresAt = dayjs(delivery.expiresAt)
            // Should be approximately 7 days from now (within 1 minute tolerance)
            expect(expiresAt.diff(now, 'day')).toBeGreaterThanOrEqual(6)
            expect(expiresAt.diff(now, 'day')).toBeLessThanOrEqual(7)
        })

        test('nextRetryAt defaults to now if not provided', async () => {
            const now = dayjs()
            const [delivery] = await createTestWebhookDelivery(adminClient, {
                nextRetryAt: undefined,
            })

            const nextRetryAt = dayjs(delivery.nextRetryAt)
            // Should be within 1 minute of now
            expect(Math.abs(nextRetryAt.diff(now, 'minute'))).toBeLessThanOrEqual(1)
        })

        test('attempt defaults to 0', async () => {
            const [delivery] = await createTestWebhookDelivery(adminClient)

            expect(delivery.attempt).toBe(0)
        })

        test('status defaults to pending', async () => {
            const [delivery] = await createTestWebhookDelivery(adminClient)

            expect(delivery.status).toBe(WEBHOOK_DELIVERY_STATUS_PENDING)
        })
    })

    describe('Querying', () => {
        test('can query by status', async () => {
            const [delivery] = await createTestWebhookDelivery(adminClient)
            await updateTestWebhookDelivery(adminClient, delivery.id, {
                status: WEBHOOK_DELIVERY_STATUS_SUCCESS,
            })

            const successDeliveries = await WebhookDelivery.getAll(adminClient, {
                status: WEBHOOK_DELIVERY_STATUS_SUCCESS,
                id: delivery.id,
            })

            expect(successDeliveries).toHaveLength(1)
            expect(successDeliveries[0].id).toBe(delivery.id)
        })

        test('can query by eventType', async () => {
            const uniqueEventType = `test.event.${faker.random.alphaNumeric(8)}`
            const [delivery] = await createTestWebhookDelivery(adminClient, {
                eventType: uniqueEventType,
            })

            const deliveries = await WebhookDelivery.getAll(adminClient, {
                eventType: uniqueEventType,
            })

            expect(deliveries).toHaveLength(1)
            expect(deliveries[0].id).toBe(delivery.id)
        })

        test('can query by modelName and itemId', async () => {
            const itemId = faker.datatype.uuid()
            const [delivery] = await createTestWebhookDelivery(adminClient, {
                modelName: 'Payment',
                itemId,
            })

            const deliveries = await WebhookDelivery.getAll(adminClient, {
                modelName: 'Payment',
                itemId,
            })

            expect(deliveries).toHaveLength(1)
            expect(deliveries[0].id).toBe(delivery.id)
        })

        test('can query pending deliveries due for retry', async () => {
            const pastTime = dayjs().subtract(1, 'hour').toISOString()
            const futureTime = dayjs().add(1, 'day').toISOString()

            const [delivery] = await createTestWebhookDelivery(adminClient, {
                nextRetryAt: pastTime,
                expiresAt: futureTime,
            })

            const now = dayjs().toISOString()
            const pendingDeliveries = await WebhookDelivery.getAll(adminClient, {
                status: WEBHOOK_DELIVERY_STATUS_PENDING,
                nextRetryAt_lte: now,
                expiresAt_gt: now,
                id: delivery.id,
            })

            expect(pendingDeliveries).toHaveLength(1)
            expect(pendingDeliveries[0].id).toBe(delivery.id)
        })
    })
})
