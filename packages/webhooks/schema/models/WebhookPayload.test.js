const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const {
    UUID_RE,
    expectToThrowAccessDeniedErrorToObj,
    expectToThrowAccessDeniedErrorToObjects,
    expectToThrowAuthenticationErrorToObj,
    expectToThrowAuthenticationErrorToObjects,
} = require('@open-condo/keystone/test.utils')
const {
    WEBHOOK_PAYLOAD_STATUS_PENDING,
    WEBHOOK_PAYLOAD_STATUS_SUCCESS,
    WEBHOOK_PAYLOAD_STATUS_FAILED,
} = require('@open-condo/webhooks/constants')
const {
    WebhookPayload,
    createTestWebhookPayload,
    updateTestWebhookPayload,
} = require('@open-condo/webhooks/schema/utils/testSchema')


const WebhookPayloadTests = (appName, actorsInitializer) => {
    describe(`WebhookPayload tests for ${appName} app`, () => {
        let actors

        beforeAll(async () => {
            actors = await actorsInitializer()
        })

        describe('CRUD', () => {
            describe('Create', () => {
                test('admin: can create WebhookPayload', async () => {
                    const [delivery] = await createTestWebhookPayload(actors.admin)

                    expect(delivery.id).toMatch(UUID_RE)
                    expect(delivery.status).toBe(WEBHOOK_PAYLOAD_STATUS_PENDING)
                    expect(delivery.attempt).toBe(0)
                    expect(delivery.payload).toBeDefined()
                    expect(delivery.url).toBeDefined()
                    expect(delivery.eventType).toBe('test.event')
                })

                test('admin: can create WebhookPayload with custom payload', async () => {
                    const customPayload = {
                        event: 'payment.status.changed',
                        data: {
                            paymentId: faker.datatype.uuid(),
                            previousStatus: 'CREATED',
                            newStatus: 'PROCESSING',
                        },
                    }
                    const customPayloadString = JSON.stringify(customPayload)

                    const [delivery] = await createTestWebhookPayload(actors.admin, {
                        payload: customPayloadString,
                        eventType: 'payment.status.changed',
                    })

                    // payload is stored as EncryptedText - it's encrypted at rest but decrypted on read
                    expect(delivery.payload).toBeDefined()
                    expect(typeof delivery.payload).toBe('string')
                    expect(delivery.eventType).toBe('payment.status.changed')
                })

                test('admin: can create WebhookPayload with modelName and itemId', async () => {
                    const itemId = faker.datatype.uuid()

                    const [delivery] = await createTestWebhookPayload(actors.admin, {
                        modelName: 'Payment',
                        itemId,
                    })

                    expect(delivery.modelName).toBe('Payment')
                    expect(delivery.itemId).toBe(itemId)
                })

                test('anonymous: cannot create WebhookPayload', async () => {
                    await expectToThrowAuthenticationErrorToObj(async () => {
                        await createTestWebhookPayload(actors.anonymous)
                    })
                })

                test('user: cannot create WebhookPayload', async () => {
                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await createTestWebhookPayload(actors.user)
                    })
                })
            })

            describe('Read', () => {
                test('admin: can read WebhookPayload', async () => {
                    const [delivery] = await createTestWebhookPayload(actors.admin)

                    const readDelivery = await WebhookPayload.getOne(actors.admin, { id: delivery.id })

                    expect(readDelivery.id).toBe(delivery.id)
                    expect(readDelivery.status).toBe(WEBHOOK_PAYLOAD_STATUS_PENDING)
                })

                test('anonymous: cannot read WebhookPayload', async () => {
                    const [delivery] = await createTestWebhookPayload(actors.admin)

                    await expectToThrowAuthenticationErrorToObjects(async () => {
                        await WebhookPayload.getOne(actors.anonymous, { id: delivery.id })
                    })
                })

                test('user: cannot read WebhookPayload', async () => {
                    const [delivery] = await createTestWebhookPayload(actors.admin)

                    await expectToThrowAccessDeniedErrorToObjects(async () => {
                        await WebhookPayload.getOne(actors.user, { id: delivery.id })
                    })
                })
            })

            describe('Update', () => {
                test('admin: can update WebhookPayload status to success', async () => {
                    const [delivery] = await createTestWebhookPayload(actors.admin)

                    const [updatedDelivery] = await updateTestWebhookPayload(actors.admin, delivery.id, {
                        status: WEBHOOK_PAYLOAD_STATUS_SUCCESS,
                        lastHttpStatusCode: 200,
                        lastResponseBody: '{"received":true}',
                        lastSentAt: dayjs().toISOString(),
                        attempt: 1,
                    })

                    expect(updatedDelivery.status).toBe(WEBHOOK_PAYLOAD_STATUS_SUCCESS)
                    expect(updatedDelivery.lastHttpStatusCode).toBe(200)
                    expect(updatedDelivery.lastResponseBody).toBe('{"received":true}')
                    expect(updatedDelivery.attempt).toBe(1)
                })

                test('admin: can update WebhookPayload status to failed', async () => {
                    const [delivery] = await createTestWebhookPayload(actors.admin)

                    const [updatedDelivery] = await updateTestWebhookPayload(actors.admin, delivery.id, {
                        status: WEBHOOK_PAYLOAD_STATUS_FAILED,
                        lastErrorMessage: 'Connection refused',
                        attempt: 5,
                    })

                    expect(updatedDelivery.status).toBe(WEBHOOK_PAYLOAD_STATUS_FAILED)
                    expect(updatedDelivery.lastErrorMessage).toBe('Connection refused')
                    expect(updatedDelivery.attempt).toBe(5)
                })

                test('admin: can update nextRetryAt for retry scheduling', async () => {
                    const [delivery] = await createTestWebhookPayload(actors.admin)
                    const nextRetryAt = dayjs().add(5, 'minute').toISOString()

                    const [updatedDelivery] = await updateTestWebhookPayload(actors.admin, delivery.id, {
                        nextRetryAt,
                        lastHttpStatusCode: 500,
                        lastErrorMessage: 'HTTP 500: Internal Server Error',
                        attempt: 1,
                    })

                    expect(updatedDelivery.nextRetryAt).toBe(nextRetryAt)
                    expect(updatedDelivery.lastHttpStatusCode).toBe(500)
                })

                test('anonymous: cannot update WebhookPayload', async () => {
                    const [delivery] = await createTestWebhookPayload(actors.admin)

                    await expectToThrowAuthenticationErrorToObj(async () => {
                        await updateTestWebhookPayload(actors.anonymous, delivery.id, {
                            status: WEBHOOK_PAYLOAD_STATUS_SUCCESS,
                        })
                    })
                })

                test('user: cannot update WebhookPayload', async () => {
                    const [delivery] = await createTestWebhookPayload(actors.admin)

                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await updateTestWebhookPayload(actors.user, delivery.id, {
                            status: WEBHOOK_PAYLOAD_STATUS_SUCCESS,
                        })
                    })
                })
            })

            describe('Delete', () => {
                test('admin: cannot hard delete WebhookPayload', async () => {
                    const [delivery] = await createTestWebhookPayload(actors.admin)

                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await WebhookPayload.delete(actors.admin, delivery.id)
                    })
                })

                test('admin: can soft delete WebhookPayload', async () => {
                    const [delivery] = await createTestWebhookPayload(actors.admin)

                    const [deletedDelivery] = await updateTestWebhookPayload(actors.admin, delivery.id, {
                        deletedAt: dayjs().toISOString(),
                    })

                    expect(deletedDelivery.deletedAt).not.toBeNull()

                    // Should not be found in normal queries
                    const found = await WebhookPayload.getOne(actors.admin, { id: delivery.id })
                    expect(found).toBeUndefined()
                })
            })
        })

        describe('Field validation', () => {
            test('expiresAt defaults to 7 days from now if not provided', async () => {
                const now = dayjs()
                const [delivery] = await createTestWebhookPayload(actors.admin, {
                    expiresAt: undefined,
                })

                const expiresAt = dayjs(delivery.expiresAt)
                // Should be approximately 7 days from now (within 1 minute tolerance)
                expect(expiresAt.diff(now, 'day')).toBeGreaterThanOrEqual(6)
                expect(expiresAt.diff(now, 'day')).toBeLessThanOrEqual(7)
            })

            test('nextRetryAt defaults to now if not provided', async () => {
                const now = dayjs()
                const [delivery] = await createTestWebhookPayload(actors.admin, {
                    nextRetryAt: undefined,
                })

                const nextRetryAt = dayjs(delivery.nextRetryAt)
                // Should be within 1 minute of now
                expect(Math.abs(nextRetryAt.diff(now, 'minute'))).toBeLessThanOrEqual(1)
            })

            test('attempt defaults to 0', async () => {
                const [delivery] = await createTestWebhookPayload(actors.admin)

                expect(delivery.attempt).toBe(0)
            })

            test('status defaults to pending', async () => {
                const [delivery] = await createTestWebhookPayload(actors.admin)

                expect(delivery.status).toBe(WEBHOOK_PAYLOAD_STATUS_PENDING)
            })
        })

        describe('Querying', () => {
            test('can query by status', async () => {
                const [delivery] = await createTestWebhookPayload(actors.admin)
                await updateTestWebhookPayload(actors.admin, delivery.id, {
                    status: WEBHOOK_PAYLOAD_STATUS_SUCCESS,
                })

                const successDeliveries = await WebhookPayload.getAll(actors.admin, {
                    status: WEBHOOK_PAYLOAD_STATUS_SUCCESS,
                    id: delivery.id,
                })

                expect(successDeliveries).toHaveLength(1)
                expect(successDeliveries[0].id).toBe(delivery.id)
            })

            test('can query by eventType', async () => {
                const uniqueEventType = `test.event.${faker.random.alphaNumeric(8)}`
                const [delivery] = await createTestWebhookPayload(actors.admin, {
                    eventType: uniqueEventType,
                })

                const deliveries = await WebhookPayload.getAll(actors.admin, {
                    eventType: uniqueEventType,
                })

                expect(deliveries).toHaveLength(1)
                expect(deliveries[0].id).toBe(delivery.id)
            })

            test('can query by modelName and itemId', async () => {
                const itemId = faker.datatype.uuid()
                const [delivery] = await createTestWebhookPayload(actors.admin, {
                    modelName: 'Payment',
                    itemId,
                })

                const deliveries = await WebhookPayload.getAll(actors.admin, {
                    modelName: 'Payment',
                    itemId,
                })

                expect(deliveries).toHaveLength(1)
                expect(deliveries[0].id).toBe(delivery.id)
            })

            test('can query pending deliveries due for retry', async () => {
                const pastTime = dayjs().subtract(1, 'hour').toISOString()
                const futureTime = dayjs().add(1, 'day').toISOString()

                const [delivery] = await createTestWebhookPayload(actors.admin, {
                    nextRetryAt: pastTime,
                    expiresAt: futureTime,
                })

                const now = dayjs().toISOString()
                const pendingDeliveries = await WebhookPayload.getAll(actors.admin, {
                    status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                    nextRetryAt_lte: now,
                    expiresAt_gt: now,
                    id: delivery.id,
                })

                expect(pendingDeliveries).toHaveLength(1)
                expect(pendingDeliveries[0].id).toBe(delivery.id)
            })
        })
    })
}

module.exports = {
    WebhookPayloadTests,
}
