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
    expectToThrowGQLError,
} = require('@open-condo/keystone/test.utils')

const {
    WebhookDeliveryWhiteListItem,
    createTestWebhookDeliveryWhiteListItem,
    updateTestWebhookDeliveryWhiteListItem,
} = require('@condo/domains/common/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')


describe('WebhookDeliveryWhiteListItem', () => {
    let adminClient

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
    })

    describe('CRUD', () => {
        describe('Create', () => {
            test('admin: can create WebhookDeliveryWhiteListItem', async () => {
                const [item] = await createTestWebhookDeliveryWhiteListItem(adminClient)

                expect(item.id).toMatch(UUID_RE)
                expect(item.url).toContain('https://')
                expect(item.isEnabled).toBe(true)
            })

            test('admin: can create WebhookDeliveryWhiteListItem with name and description', async () => {
                const name = 'Production CRM Webhook'
                const description = 'Webhook for CRM integration'

                const [item] = await createTestWebhookDeliveryWhiteListItem(adminClient, {
                    name,
                    description,
                })

                expect(item.name).toBe(name)
                expect(item.description).toBe(description)
            })

            test('admin: can create disabled WebhookDeliveryWhiteListItem', async () => {
                const [item] = await createTestWebhookDeliveryWhiteListItem(adminClient, {
                    isEnabled: false,
                })

                expect(item.isEnabled).toBe(false)
            })

            test('anonymous: cannot create WebhookDeliveryWhiteListItem', async () => {
                const anonymousClient = await makeClient()

                await expectToThrowAuthenticationErrorToObj(async () => {
                    await createTestWebhookDeliveryWhiteListItem(anonymousClient)
                })
            })

            test('user: cannot create WebhookDeliveryWhiteListItem', async () => {
                const userClient = await makeClientWithNewRegisteredAndLoggedInUser()

                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await createTestWebhookDeliveryWhiteListItem(userClient)
                })
            })
        })

        describe('Read', () => {
            test('admin: can read WebhookDeliveryWhiteListItem', async () => {
                const [item] = await createTestWebhookDeliveryWhiteListItem(adminClient)

                const readItem = await WebhookDeliveryWhiteListItem.getOne(adminClient, { id: item.id })

                expect(readItem.id).toBe(item.id)
                expect(readItem.url).toBe(item.url)
            })

            test('anonymous: cannot read WebhookDeliveryWhiteListItem', async () => {
                const [item] = await createTestWebhookDeliveryWhiteListItem(adminClient)
                const anonymousClient = await makeClient()

                await expectToThrowAuthenticationErrorToObjects(async () => {
                    await WebhookDeliveryWhiteListItem.getOne(anonymousClient, { id: item.id })
                })
            })

            test('user: cannot read WebhookDeliveryWhiteListItem', async () => {
                const [item] = await createTestWebhookDeliveryWhiteListItem(adminClient)
                const userClient = await makeClientWithNewRegisteredAndLoggedInUser()

                await expectToThrowAccessDeniedErrorToObjects(async () => {
                    await WebhookDeliveryWhiteListItem.getOne(userClient, { id: item.id })
                })
            })
        })

        describe('Update', () => {
            test('admin: can update WebhookDeliveryWhiteListItem', async () => {
                const [item] = await createTestWebhookDeliveryWhiteListItem(adminClient)

                const [updatedItem] = await updateTestWebhookDeliveryWhiteListItem(adminClient, item.id, {
                    isEnabled: false,
                    name: 'Updated Name',
                })

                expect(updatedItem.isEnabled).toBe(false)
                expect(updatedItem.name).toBe('Updated Name')
            })

            test('admin: can update URL to new valid HTTPS URL', async () => {
                const [item] = await createTestWebhookDeliveryWhiteListItem(adminClient)
                const newUrl = `https://new-webhook-${faker.random.alphaNumeric(8)}.com/callback`

                const [updatedItem] = await updateTestWebhookDeliveryWhiteListItem(adminClient, item.id, {
                    url: newUrl,
                })

                expect(updatedItem.url).toBe(newUrl)
            })

            test('anonymous: cannot update WebhookDeliveryWhiteListItem', async () => {
                const [item] = await createTestWebhookDeliveryWhiteListItem(adminClient)
                const anonymousClient = await makeClient()

                await expectToThrowAuthenticationErrorToObj(async () => {
                    await updateTestWebhookDeliveryWhiteListItem(anonymousClient, item.id, {
                        isEnabled: false,
                    })
                })
            })

            test('user: cannot update WebhookDeliveryWhiteListItem', async () => {
                const [item] = await createTestWebhookDeliveryWhiteListItem(adminClient)
                const userClient = await makeClientWithNewRegisteredAndLoggedInUser()

                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestWebhookDeliveryWhiteListItem(userClient, item.id, {
                        isEnabled: false,
                    })
                })
            })
        })

        describe('Delete', () => {
            test('admin: cannot hard delete WebhookDeliveryWhiteListItem', async () => {
                const [item] = await createTestWebhookDeliveryWhiteListItem(adminClient)

                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await WebhookDeliveryWhiteListItem.delete(adminClient, item.id)
                })
            })

            test('admin: can soft delete WebhookDeliveryWhiteListItem', async () => {
                const [item] = await createTestWebhookDeliveryWhiteListItem(adminClient)

                const [deletedItem] = await updateTestWebhookDeliveryWhiteListItem(adminClient, item.id, {
                    deletedAt: dayjs().toISOString(),
                })

                expect(deletedItem.deletedAt).not.toBeNull()

                // Should not be found in normal queries
                const found = await WebhookDeliveryWhiteListItem.getOne(adminClient, { id: item.id })
                expect(found).toBeUndefined()
            })
        })
    })

    describe('URL validation', () => {
        test('should require valid HTTPS URL', async () => {
            const uniqueUrl = `https://valid-webhook-${faker.random.alphaNumeric(10)}.com/callback`
            const [item] = await createTestWebhookDeliveryWhiteListItem(adminClient, {
                url: uniqueUrl,
            })

            expect(item.url).toBe(uniqueUrl)
        })

        test('should reject HTTP URLs (non-HTTPS)', async () => {
            await expectToThrowGQLError(
                async () => {
                    await createTestWebhookDeliveryWhiteListItem(adminClient, {
                        url: 'http://insecure-webhook.com/callback',
                    })
                },
                {
                    code: 'BAD_USER_INPUT',
                    type: 'INVALID_URL',
                },
                'obj'
            )
        })

        test('should allow HTTP for localhost (testing purposes)', async () => {
            const port = faker.datatype.number({ min: 3000, max: 9999 })
            const path = faker.random.alphaNumeric(10)
            const url = `http://localhost:${port}/${path}`
            
            const [item] = await createTestWebhookDeliveryWhiteListItem(adminClient, {
                url,
            })

            expect(item.url).toBe(url)
        })

        test('should allow HTTP for 127.0.0.1 (testing purposes)', async () => {
            const port = faker.datatype.number({ min: 3000, max: 9999 })
            const path = faker.random.alphaNumeric(10)
            const url = `http://127.0.0.1:${port}/${path}`
            
            const [item] = await createTestWebhookDeliveryWhiteListItem(adminClient, {
                url,
            })

            expect(item.url).toBe(url)
        })

        test('should reject invalid URL format', async () => {
            await expect(async () => {
                await createTestWebhookDeliveryWhiteListItem(adminClient, {
                    url: 'not-a-valid-url',
                })
            }).rejects.toThrow()
        })
    })

    describe('Unique constraint', () => {
        test('should enforce unique URL constraint', async () => {
            const uniqueUrl = `https://unique-${faker.random.alphaNumeric(10)}.com/webhook`

            await createTestWebhookDeliveryWhiteListItem(adminClient, {
                url: uniqueUrl,
            })

            // Trying to create another item with the same URL should fail
            await expect(async () => {
                await createTestWebhookDeliveryWhiteListItem(adminClient, {
                    url: uniqueUrl,
                })
            }).rejects.toThrow()
        })

        test('should allow same URL after soft delete', async () => {
            const uniqueUrl = `https://reusable-${faker.random.alphaNumeric(10)}.com/webhook`

            const [item] = await createTestWebhookDeliveryWhiteListItem(adminClient, {
                url: uniqueUrl,
            })

            // Soft delete the item
            await updateTestWebhookDeliveryWhiteListItem(adminClient, item.id, {
                deletedAt: dayjs().toISOString(),
            })

            // Should be able to create a new item with the same URL
            const [newItem] = await createTestWebhookDeliveryWhiteListItem(adminClient, {
                url: uniqueUrl,
            })

            expect(newItem.url).toBe(uniqueUrl)
            expect(newItem.id).not.toBe(item.id)
        })
    })

    describe('Querying', () => {
        test('can query by isEnabled', async () => {
            const [enabledItem] = await createTestWebhookDeliveryWhiteListItem(adminClient, {
                isEnabled: true,
            })

            const enabledItems = await WebhookDeliveryWhiteListItem.getAll(adminClient, {
                isEnabled: true,
                id: enabledItem.id,
            })

            expect(enabledItems).toHaveLength(1)
            expect(enabledItems[0].isEnabled).toBe(true)
        })

        test('can query by url', async () => {
            const uniqueUrl = `https://queryable-${faker.random.alphaNumeric(10)}.com/webhook`
            const [item] = await createTestWebhookDeliveryWhiteListItem(adminClient, {
                url: uniqueUrl,
            })

            const items = await WebhookDeliveryWhiteListItem.getAll(adminClient, {
                url: uniqueUrl,
            })

            expect(items).toHaveLength(1)
            expect(items[0].id).toBe(item.id)
        })

        test('can query by name contains', async () => {
            const uniqueName = `Webhook-${faker.random.alphaNumeric(10)}`
            const [item] = await createTestWebhookDeliveryWhiteListItem(adminClient, {
                name: uniqueName,
            })

            const items = await WebhookDeliveryWhiteListItem.getAll(adminClient, {
                name_contains: uniqueName.substring(0, 10),
            })

            expect(items.length).toBeGreaterThanOrEqual(1)
            expect(items.some(i => i.id === item.id)).toBe(true)
        })
    })
})
