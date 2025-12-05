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
    PaymentStatusChangeWebhookUrl,
    createTestPaymentStatusChangeWebhookUrl,
    updateTestPaymentStatusChangeWebhookUrl,
} = require('@condo/domains/acquiring/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')


describe('PaymentStatusChangeWebhookUrl', () => {
    let adminClient

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
    })

    describe('CRUD', () => {
        describe('Create', () => {
            test('admin: can create PaymentStatusChangeWebhookUrl', async () => {
                const [item] = await createTestPaymentStatusChangeWebhookUrl(adminClient)

                expect(item.id).toMatch(UUID_RE)
                expect(item.url).toContain('https://')
                expect(item.isEnabled).toBe(true)
            })

            test('admin: can create PaymentStatusChangeWebhookUrl with name and description', async () => {
                const name = 'Production CRM Webhook'
                const description = 'Webhook for CRM integration'

                const [item] = await createTestPaymentStatusChangeWebhookUrl(adminClient, {
                    name,
                    description,
                })

                expect(item.name).toBe(name)
                expect(item.description).toBe(description)
            })

            test('admin: can create disabled PaymentStatusChangeWebhookUrl', async () => {
                const [item] = await createTestPaymentStatusChangeWebhookUrl(adminClient, {
                    isEnabled: false,
                })

                expect(item.isEnabled).toBe(false)
            })

            test('anonymous: cannot create PaymentStatusChangeWebhookUrl', async () => {
                const anonymousClient = await makeClient()

                await expectToThrowAuthenticationErrorToObj(async () => {
                    await createTestPaymentStatusChangeWebhookUrl(anonymousClient)
                })
            })

            test('user: cannot create PaymentStatusChangeWebhookUrl', async () => {
                const userClient = await makeClientWithNewRegisteredAndLoggedInUser()

                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await createTestPaymentStatusChangeWebhookUrl(userClient)
                })
            })
        })

        describe('Read', () => {
            test('admin: can read PaymentStatusChangeWebhookUrl', async () => {
                const [item] = await createTestPaymentStatusChangeWebhookUrl(adminClient)

                const readItem = await PaymentStatusChangeWebhookUrl.getOne(adminClient, { id: item.id })

                expect(readItem.id).toBe(item.id)
                expect(readItem.url).toBe(item.url)
            })

            test('anonymous: cannot read PaymentStatusChangeWebhookUrl', async () => {
                const [item] = await createTestPaymentStatusChangeWebhookUrl(adminClient)
                const anonymousClient = await makeClient()

                await expectToThrowAuthenticationErrorToObjects(async () => {
                    await PaymentStatusChangeWebhookUrl.getOne(anonymousClient, { id: item.id })
                })
            })

            test('user: cannot read PaymentStatusChangeWebhookUrl', async () => {
                const [item] = await createTestPaymentStatusChangeWebhookUrl(adminClient)
                const userClient = await makeClientWithNewRegisteredAndLoggedInUser()

                await expectToThrowAccessDeniedErrorToObjects(async () => {
                    await PaymentStatusChangeWebhookUrl.getOne(userClient, { id: item.id })
                })
            })
        })

        describe('Update', () => {
            test('admin: can update PaymentStatusChangeWebhookUrl', async () => {
                const [item] = await createTestPaymentStatusChangeWebhookUrl(adminClient)

                const [updatedItem] = await updateTestPaymentStatusChangeWebhookUrl(adminClient, item.id, {
                    isEnabled: false,
                    name: 'Updated Name',
                })

                expect(updatedItem.isEnabled).toBe(false)
                expect(updatedItem.name).toBe('Updated Name')
            })

            test('admin: can update URL to new valid HTTPS URL', async () => {
                const [item] = await createTestPaymentStatusChangeWebhookUrl(adminClient)
                const newUrl = `https://new-webhook-${faker.random.alphaNumeric(8)}.com/callback`

                const [updatedItem] = await updateTestPaymentStatusChangeWebhookUrl(adminClient, item.id, {
                    url: newUrl,
                })

                expect(updatedItem.url).toBe(newUrl)
            })

            test('anonymous: cannot update PaymentStatusChangeWebhookUrl', async () => {
                const [item] = await createTestPaymentStatusChangeWebhookUrl(adminClient)
                const anonymousClient = await makeClient()

                await expectToThrowAuthenticationErrorToObj(async () => {
                    await updateTestPaymentStatusChangeWebhookUrl(anonymousClient, item.id, {
                        isEnabled: false,
                    })
                })
            })

            test('user: cannot update PaymentStatusChangeWebhookUrl', async () => {
                const [item] = await createTestPaymentStatusChangeWebhookUrl(adminClient)
                const userClient = await makeClientWithNewRegisteredAndLoggedInUser()

                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestPaymentStatusChangeWebhookUrl(userClient, item.id, {
                        isEnabled: false,
                    })
                })
            })
        })

        describe('Delete', () => {
            test('admin: cannot hard delete PaymentStatusChangeWebhookUrl', async () => {
                const [item] = await createTestPaymentStatusChangeWebhookUrl(adminClient)

                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await PaymentStatusChangeWebhookUrl.delete(adminClient, item.id)
                })
            })

            test('admin: can soft delete PaymentStatusChangeWebhookUrl', async () => {
                const [item] = await createTestPaymentStatusChangeWebhookUrl(adminClient)

                const [deletedItem] = await updateTestPaymentStatusChangeWebhookUrl(adminClient, item.id, {
                    deletedAt: dayjs().toISOString(),
                })

                expect(deletedItem.deletedAt).not.toBeNull()

                // Should not be found in normal queries
                const found = await PaymentStatusChangeWebhookUrl.getOne(adminClient, { id: item.id })
                expect(found).toBeUndefined()
            })
        })
    })

    describe('URL validation', () => {
        test('should require valid HTTPS URL', async () => {
            const uniqueUrl = `https://valid-webhook-${faker.random.alphaNumeric(10)}.com/callback`
            const [item] = await createTestPaymentStatusChangeWebhookUrl(adminClient, {
                url: uniqueUrl,
            })

            expect(item.url).toBe(uniqueUrl)
        })

        test('should reject HTTP URLs (non-HTTPS)', async () => {
            await expectToThrowGQLError(
                async () => {
                    await createTestPaymentStatusChangeWebhookUrl(adminClient, {
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
            
            const [item] = await createTestPaymentStatusChangeWebhookUrl(adminClient, {
                url,
            })

            expect(item.url).toBe(url)
        })

        test('should allow HTTP for 127.0.0.1 (testing purposes)', async () => {
            const port = faker.datatype.number({ min: 3000, max: 9999 })
            const path = faker.random.alphaNumeric(10)
            const url = `http://127.0.0.1:${port}/${path}`
            
            const [item] = await createTestPaymentStatusChangeWebhookUrl(adminClient, {
                url,
            })

            expect(item.url).toBe(url)
        })

        test('should reject invalid URL format', async () => {
            await expect(async () => {
                await createTestPaymentStatusChangeWebhookUrl(adminClient, {
                    url: 'not-a-valid-url',
                })
            }).rejects.toThrow()
        })
    })

    describe('Unique constraint', () => {
        test('should enforce unique URL constraint', async () => {
            const uniqueUrl = `https://unique-${faker.random.alphaNumeric(10)}.com/webhook`

            await createTestPaymentStatusChangeWebhookUrl(adminClient, {
                url: uniqueUrl,
            })

            // Trying to create another item with the same URL should fail
            await expect(async () => {
                await createTestPaymentStatusChangeWebhookUrl(adminClient, {
                    url: uniqueUrl,
                })
            }).rejects.toThrow()
        })

        test('should allow same URL after soft delete', async () => {
            const uniqueUrl = `https://reusable-${faker.random.alphaNumeric(10)}.com/webhook`

            const [item] = await createTestPaymentStatusChangeWebhookUrl(adminClient, {
                url: uniqueUrl,
            })

            // Soft delete the item
            await updateTestPaymentStatusChangeWebhookUrl(adminClient, item.id, {
                deletedAt: dayjs().toISOString(),
            })

            // Should be able to create a new item with the same URL
            const [newItem] = await createTestPaymentStatusChangeWebhookUrl(adminClient, {
                url: uniqueUrl,
            })

            expect(newItem.url).toBe(uniqueUrl)
            expect(newItem.id).not.toBe(item.id)
        })
    })

    describe('Querying', () => {
        test('can query by isEnabled', async () => {
            const [enabledItem] = await createTestPaymentStatusChangeWebhookUrl(adminClient, {
                isEnabled: true,
            })

            const enabledItems = await PaymentStatusChangeWebhookUrl.getAll(adminClient, {
                isEnabled: true,
                id: enabledItem.id,
            })

            expect(enabledItems).toHaveLength(1)
            expect(enabledItems[0].isEnabled).toBe(true)
        })

        test('can query by url', async () => {
            const uniqueUrl = `https://queryable-${faker.random.alphaNumeric(10)}.com/webhook`
            const [item] = await createTestPaymentStatusChangeWebhookUrl(adminClient, {
                url: uniqueUrl,
            })

            const items = await PaymentStatusChangeWebhookUrl.getAll(adminClient, {
                url: uniqueUrl,
            })

            expect(items).toHaveLength(1)
            expect(items[0].id).toBe(item.id)
        })

        test('can query by name contains', async () => {
            const uniqueName = `Webhook-${faker.random.alphaNumeric(10)}`
            const [item] = await createTestPaymentStatusChangeWebhookUrl(adminClient, {
                name: uniqueName,
            })

            const items = await PaymentStatusChangeWebhookUrl.getAll(adminClient, {
                name_contains: uniqueName.substring(0, 10),
            })

            expect(items.length).toBeGreaterThanOrEqual(1)
            expect(items.some(i => i.id === item.id)).toBe(true)
        })
    })
})
