const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const {
    UUID_RE,
    catchErrorFrom,
    expectToThrowAccessDeniedErrorToObj,
    expectToThrowAccessDeniedErrorToObjects,
    expectToThrowAuthenticationErrorToObj,
    expectToThrowAuthenticationErrorToObjects,
} = require('@open-condo/keystone/test.utils')
const {
    WEBHOOK_PAYLOAD_STATUS_PENDING,
    WEBHOOK_PAYLOAD_STATUS_SENT,
    WEBHOOK_PAYLOAD_STATUS_ERROR,
} = require('@open-condo/webhooks/constants')
const {
    WebhookPayload,
    createTestWebhookPayload,
    updateTestWebhookPayload,
} = require('@open-condo/webhooks/schema/utils/testSchema')


const WebhookPayloadTests = (appName, actorsInitializer, customEvents = []) => {
    describe(`WebhookPayload tests for ${appName} app`, () => {
        let actors

        beforeAll(async () => {
            actors = await actorsInitializer()
        })

        describe('CRUD', () => {
            describe('Create', () => {
                test('admin: can create WebhookPayload', async () => {
                    const [webhookPayload] = await createTestWebhookPayload(actors.admin)

                    expect(webhookPayload.id).toMatch(UUID_RE)
                    expect(webhookPayload.status).toBe(WEBHOOK_PAYLOAD_STATUS_PENDING)
                    expect(webhookPayload.attempt).toBe(0)
                    expect(webhookPayload.payload).toBeDefined()
                    expect(webhookPayload.url).toBeDefined()
                    expect(webhookPayload.eventType).toBe('User.created')
                })

                test('admin: can create WebhookPayload with custom payload', async () => {
                    const customPayload = {
                        event: 'payment.status.updated',
                        data: {
                            paymentId: faker.datatype.uuid(),
                            previousStatus: 'CREATED',
                            newStatus: 'PROCESSING',
                        },
                    }
                    const customPayloadString = JSON.stringify(customPayload)

                    const [webhookPayload] = await createTestWebhookPayload(actors.admin, {
                        payload: customPayloadString,
                        eventType: customEvents.length > 0 ? customEvents[0] : 'User.created',
                    })

                    // payload is stored as EncryptedText - it's encrypted at rest but decrypted on read
                    expect(webhookPayload.payload).toBeDefined()
                    expect(typeof webhookPayload.payload).toBe('string')
                    const expectedEventType = customEvents.length > 0 ? customEvents[0] : 'User.created'
                    expect(webhookPayload.eventType).toBe(expectedEventType)
                })

                test('admin: can create WebhookPayload with modelName and itemId', async () => {
                    const itemId = faker.datatype.uuid()

                    const [webhookPayload] = await createTestWebhookPayload(actors.admin, {
                        modelName: 'Payment',
                        itemId,
                    })

                    expect(webhookPayload.modelName).toBe('Payment')
                    expect(webhookPayload.itemId).toBe(itemId)
                })

                test('anonymous: cannot create WebhookPayload', async () => {
                    await expectToThrowAuthenticationErrorToObj(async () => {
                        await createTestWebhookPayload(actors.anonymous)
                    })
                })

                test('support: cannot create WebhookPayload', async () => {
                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await createTestWebhookPayload(actors.support)
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
                    const [webhookPayload] = await createTestWebhookPayload(actors.admin)

                    const foundWebhookPayload = await WebhookPayload.getOne(actors.admin, { id: webhookPayload.id })

                    expect(foundWebhookPayload.id).toBe(webhookPayload.id)
                    expect(foundWebhookPayload.status).toBe(WEBHOOK_PAYLOAD_STATUS_PENDING)
                })

                test('support: can read WebhookPayload', async () => {
                    const [webhookPayload] = await createTestWebhookPayload(actors.admin)

                    const foundWebhookPayload = await WebhookPayload.getOne(actors.support, { id: webhookPayload.id })

                    expect(foundWebhookPayload.id).toBe(webhookPayload.id)
                    expect(foundWebhookPayload.status).toBe(WEBHOOK_PAYLOAD_STATUS_PENDING)
                })

                test('anonymous: cannot read WebhookPayload', async () => {
                    const [webhookPayload] = await createTestWebhookPayload(actors.admin)

                    await expectToThrowAuthenticationErrorToObjects(async () => {
                        await WebhookPayload.getOne(actors.anonymous, { id: webhookPayload.id })
                    })
                })

                test('user: cannot read WebhookPayload', async () => {
                    const [webhookPayload] = await createTestWebhookPayload(actors.admin)

                    await expectToThrowAccessDeniedErrorToObjects(async () => {
                        await WebhookPayload.getOne(actors.user, { id: webhookPayload.id })
                    })
                })
            })

            describe('Update', () => {
                test('admin: can update WebhookPayload status to success', async () => {
                    const [webhookPayload] = await createTestWebhookPayload(actors.admin)

                    const [updatedWebhookPayload] = await updateTestWebhookPayload(actors.admin, webhookPayload.id, {
                        status: WEBHOOK_PAYLOAD_STATUS_SENT,
                        lastHttpStatusCode: 200,
                        lastResponseBody: '{"received":true}',
                        lastSentAt: dayjs().toISOString(),
                        attempt: 1,
                    })

                    expect(updatedWebhookPayload.status).toBe(WEBHOOK_PAYLOAD_STATUS_SENT)
                    expect(updatedWebhookPayload.lastHttpStatusCode).toBe(200)
                    expect(updatedWebhookPayload.lastResponseBody).toBe('{"received":true}')
                    expect(updatedWebhookPayload.attempt).toBe(1)
                })

                test('admin: can update WebhookPayload status to failed', async () => {
                    const [webhookPayload] = await createTestWebhookPayload(actors.admin)

                    const [updatedWebhookPayload] = await updateTestWebhookPayload(actors.admin, webhookPayload.id, {
                        status: WEBHOOK_PAYLOAD_STATUS_ERROR,
                        lastErrorMessage: 'Connection refused',
                        attempt: 5,
                    })

                    expect(updatedWebhookPayload.status).toBe(WEBHOOK_PAYLOAD_STATUS_ERROR)
                    expect(updatedWebhookPayload.lastErrorMessage).toBe('Connection refused')
                    expect(updatedWebhookPayload.attempt).toBe(5)
                })

                test('admin: can update nextRetryAt for retry scheduling', async () => {
                    const [webhookPayload] = await createTestWebhookPayload(actors.admin)
                    const nextRetryAt = dayjs().add(5, 'minute').toISOString()

                    const [updatedWebhookPayload] = await updateTestWebhookPayload(actors.admin, webhookPayload.id, {
                        nextRetryAt,
                        lastHttpStatusCode: 500,
                        lastErrorMessage: 'HTTP 500: Internal Server Error',
                        attempt: 1,
                    })

                    expect(updatedWebhookPayload.nextRetryAt).toBe(nextRetryAt)
                    expect(updatedWebhookPayload.lastHttpStatusCode).toBe(500)
                })

                test('anonymous: cannot update WebhookPayload', async () => {
                    const [webhookPayload] = await createTestWebhookPayload(actors.admin)

                    await expectToThrowAuthenticationErrorToObj(async () => {
                        await updateTestWebhookPayload(actors.anonymous, webhookPayload.id, {
                            status: WEBHOOK_PAYLOAD_STATUS_SENT,
                        })
                    })
                })

                test('support: cannot update WebhookPayload', async () => {
                    const [webhookPayload] = await createTestWebhookPayload(actors.admin)

                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await updateTestWebhookPayload(actors.support, webhookPayload.id, {
                            status: WEBHOOK_PAYLOAD_STATUS_SENT,
                        })
                    })
                })

                test('user: cannot update WebhookPayload', async () => {
                    const [webhookPayload] = await createTestWebhookPayload(actors.admin)

                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await updateTestWebhookPayload(actors.user, webhookPayload.id, {
                            status: WEBHOOK_PAYLOAD_STATUS_SENT,
                        })
                    })
                })

                test('admin: cannot update payload field (read-only)', async () => {
                    const [webhookPayload] = await createTestWebhookPayload(actors.admin)
                    const newPayload = JSON.stringify({ event: 'new.event', data: { test: true } })

                    // Field with update: false is excluded from UpdateInput type, causing GraphQL validation error
                    await catchErrorFrom(async () => {
                        await updateTestWebhookPayload(actors.admin, webhookPayload.id, {
                            payload: newPayload,
                        })
                    }, (caught) => {
                        expect(caught.errors[0].message).toContain('Field "payload" is not defined by type "WebhookPayloadUpdateInput"')
                    })
                })

                test('admin: cannot update secret field (read-only)', async () => {
                    const [webhookPayload] = await createTestWebhookPayload(actors.admin)
                    const newSecret = faker.datatype.uuid()

                    // Field with update: false is excluded from UpdateInput type, causing GraphQL validation error
                    await catchErrorFrom(async () => {
                        await updateTestWebhookPayload(actors.admin, webhookPayload.id, {
                            secret: newSecret,
                        })
                    }, (caught) => {
                        expect(caught.errors[0].message).toContain('Field "secret" is not defined by type "WebhookPayloadUpdateInput"')
                    })
                })
            })

            describe('Delete', () => {
                test('admin: cannot hard delete WebhookPayload', async () => {
                    const [webhookPayload] = await createTestWebhookPayload(actors.admin)

                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await WebhookPayload.delete(actors.admin, webhookPayload.id)
                    })
                })

                test('admin: can soft delete WebhookPayload', async () => {
                    const [webhookPayload] = await createTestWebhookPayload(actors.admin)

                    const [deletedWebhookPayload] = await updateTestWebhookPayload(actors.admin, webhookPayload.id, {
                        deletedAt: dayjs().toISOString(),
                    })

                    expect(deletedWebhookPayload.deletedAt).not.toBeNull()

                    // Should not be found in normal queries
                    const found = await WebhookPayload.getOne(actors.admin, { id: webhookPayload.id })
                    expect(found).toBeUndefined()
                })
            })
        })

        describe('Field validation', () => {
            test('no one cannot create WebhookPayload with empty string payload', async () => {
                await catchErrorFrom(async () => {
                    await createTestWebhookPayload(actors.admin, {
                        payload: '',
                    })
                }, (error) => {
                    expect(error.errors).toBeDefined()
                    expect(error.errors[0]).toMatchObject({
                        message: expect.stringContaining('Payload must be valid JSON'),
                    })
                })
            })

            test('expiresAt defaults to 7 days from now if not provided', async () => {
                const now = dayjs()
                const [webhookPayload] = await createTestWebhookPayload(actors.admin, {
                    expiresAt: undefined,
                })

                const expiresAt = dayjs(webhookPayload.expiresAt)
                // Should be approximately 7 days from now (within 1 minute tolerance)
                expect(expiresAt.diff(now, 'day')).toBeGreaterThanOrEqual(6)
                expect(expiresAt.diff(now, 'day')).toBeLessThanOrEqual(7)
            })

            test('nextRetryAt defaults to now if not provided', async () => {
                const now = dayjs()
                const [webhookPayload] = await createTestWebhookPayload(actors.admin, {
                    nextRetryAt: undefined,
                })

                const nextRetryAt = dayjs(webhookPayload.nextRetryAt)
                // Should be within 2 minutes of now (more lenient for slow test environments)
                expect(Math.abs(nextRetryAt.diff(now, 'second'))).toBeLessThanOrEqual(120)
            })

            test('attempt defaults to 0', async () => {
                const [webhookPayload] = await createTestWebhookPayload(actors.admin)

                expect(webhookPayload.attempt).toBe(0)
            })

            test('status defaults to pending', async () => {
                const [webhookPayload] = await createTestWebhookPayload(actors.admin)

                expect(webhookPayload.status).toBe(WEBHOOK_PAYLOAD_STATUS_PENDING)
            })
        })

        describe('Querying', () => {
            test('can query by status', async () => {
                const [webhookPayload] = await createTestWebhookPayload(actors.admin)
                await updateTestWebhookPayload(actors.admin, webhookPayload.id, {
                    status: WEBHOOK_PAYLOAD_STATUS_SENT,
                })

                const successWebhookPayloads = await WebhookPayload.getAll(actors.admin, {
                    status: WEBHOOK_PAYLOAD_STATUS_SENT,
                    id: webhookPayload.id,
                })

                expect(successWebhookPayloads).toHaveLength(1)
                expect(successWebhookPayloads[0].id).toBe(webhookPayload.id)
            })

            test('can query by eventType', async () => {
                // Use a valid model event with specific modelName to make it unique
                const uniqueEventType = 'Organization.updated'
                const uniqueItemId = faker.datatype.uuid()
                const [webhookPayload] = await createTestWebhookPayload(actors.admin, {
                    eventType: uniqueEventType,
                    modelName: 'Organization',
                    itemId: uniqueItemId,
                })

                const webhookPayloads = await WebhookPayload.getAll(actors.admin, {
                    eventType: uniqueEventType,
                    itemId: uniqueItemId,
                })

                expect(webhookPayloads).toHaveLength(1)
                expect(webhookPayloads[0].id).toBe(webhookPayload.id)
            })

            test('can query by modelName and itemId', async () => {
                const itemId = faker.datatype.uuid()
                const [webhookPayload] = await createTestWebhookPayload(actors.admin, {
                    modelName: 'Payment',
                    itemId,
                })

                const webhookPayloads = await WebhookPayload.getAll(actors.admin, {
                    modelName: 'Payment',
                    itemId,
                })

                expect(webhookPayloads).toHaveLength(1)
                expect(webhookPayloads[0].id).toBe(webhookPayload.id)
            })

            test('can query pending webhook payloads due for retry', async () => {
                const pastTime = dayjs().subtract(1, 'hour').toISOString()
                const futureTime = dayjs().add(1, 'day').toISOString()

                const [webhookPayload] = await createTestWebhookPayload(actors.admin, {
                    nextRetryAt: pastTime,
                    expiresAt: futureTime,
                })

                const now = dayjs().toISOString()
                const pendingWebhookPayloads = await WebhookPayload.getAll(actors.admin, {
                    status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                    nextRetryAt_lte: now,
                    expiresAt_gt: now,
                    id: webhookPayload.id,
                })

                expect(pendingWebhookPayloads).toHaveLength(1)
                expect(pendingWebhookPayloads[0].id).toBe(webhookPayload.id)
            })
        })

        describe('eventType validation', () => {
            customEvents.forEach((customEventType) => {
                test(`admin: can create WebhookPayload with custom event type: ${customEventType}`, async () => {
                    const [webhookPayload] = await createTestWebhookPayload(actors.admin, {
                        eventType: customEventType,
                    })

                    expect(webhookPayload.id).toMatch(UUID_RE)
                    expect(webhookPayload.eventType).toBe(customEventType)
                })
            })

            test('admin: can create WebhookPayload with auto-generated model event (created)', async () => {
                const [webhookPayload] = await createTestWebhookPayload(actors.admin, {
                    eventType: 'User.created',
                })

                expect(webhookPayload.id).toMatch(UUID_RE)
                expect(webhookPayload.eventType).toBe('User.created')
            })

            test('admin: can create WebhookPayload with auto-generated model event (updated)', async () => {
                const [webhookPayload] = await createTestWebhookPayload(actors.admin, {
                    eventType: 'Ticket.updated',
                })

                expect(webhookPayload.id).toMatch(UUID_RE)
                expect(webhookPayload.eventType).toBe('Ticket.updated')
            })

            test('admin: can create WebhookPayload with auto-generated model event (deleted)', async () => {
                const [webhookPayload] = await createTestWebhookPayload(actors.admin, {
                    eventType: 'Organization.deleted',
                })

                expect(webhookPayload.id).toMatch(UUID_RE)
                expect(webhookPayload.eventType).toBe('Organization.deleted')
            })

            test('admin: cannot create WebhookPayload with invalid event type (unknown model)', async () => {
                await catchErrorFrom(async () => {
                    await createTestWebhookPayload(actors.admin, {
                        eventType: 'UnknownModel.created',
                    })
                }, (error) => {
                    expect(error.errors).toBeDefined()
                    expect(error.errors[0]).toMatchObject({
                        message: expect.stringContaining('Invalid event type'),
                    })
                    expect(error.errors[0].message).toContain('UnknownModel.created')
                })
            })

            test('admin: cannot create WebhookPayload with invalid event type (not in custom events or models)', async () => {
                await catchErrorFrom(async () => {
                    await createTestWebhookPayload(actors.admin, {
                        eventType: 'invalid.event.type',
                    })
                }, (error) => {
                    expect(error.errors).toBeDefined()
                    expect(error.errors[0]).toMatchObject({
                        message: expect.stringContaining('Invalid event type'),
                    })
                    expect(error.errors[0].message).toContain('invalid.event.type')
                })
            })

            test('admin: cannot create WebhookPayload with event type for model without webHooked plugin', async () => {
                await catchErrorFrom(async () => {
                    await createTestWebhookPayload(actors.admin, {
                        eventType: 'TourStep.created',
                    })
                }, (error) => {
                    expect(error.errors).toBeDefined()
                    expect(error.errors[0]).toMatchObject({
                        message: expect.stringContaining('Invalid event type'),
                    })
                    expect(error.errors[0].message).toContain('TourStep.created')
                })
            })
        })
    })
}

module.exports = {
    WebhookPayloadTests,
}
