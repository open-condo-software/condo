/**
 * @jest-environment node
 */
const crypto = require('node:crypto')

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')

const {
    setFakeClientMode,
    makeLoggedInAdminClient,
} = require('@open-condo/keystone/test.utils')

const {
    createTestPaymentStatusChangeWebhookUrl,
} = require('@condo/domains/acquiring/utils/testSchema')

const {
    isWebhookUrlInWhitelist,
    applyWebhookSecretGeneration,
} = require('./paymentChangeWebhook')

describe('paymentChangeWebhook', () => {
    setFakeClientMode(index)

    let adminClient

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
    })

    describe('isWebhookUrlInWhitelist', () => {
        test('should return true when URL is in whitelist', async () => {
            const testUrl = faker.internet.url()
            await createTestPaymentStatusChangeWebhookUrl(adminClient, {
                url: testUrl,
                isEnabled: true,
            })

            const result = await isWebhookUrlInWhitelist(testUrl)

            expect(result).toBe(true)
        })

        test('should return false when URL is not in whitelist', async () => {
            const testUrl = faker.internet.url()

            const result = await isWebhookUrlInWhitelist(testUrl)

            expect(result).toBe(false)
        })

        test('should return false when URL is disabled', async () => {
            const testUrl = faker.internet.url()
            await createTestPaymentStatusChangeWebhookUrl(adminClient, {
                url: testUrl,
                isEnabled: false,
            })

            const result = await isWebhookUrlInWhitelist(testUrl)

            expect(result).toBe(false)
        })

        test('should return true when URL is null', async () => {
            const result = await isWebhookUrlInWhitelist(null)

            expect(result).toBe(true)
        })

        test('should return true when URL is undefined', async () => {
            const result = await isWebhookUrlInWhitelist(undefined)

            expect(result).toBe(true)
        })

        test('should return true when URL is empty string', async () => {
            const result = await isWebhookUrlInWhitelist('')

            expect(result).toBe(true)
        })
    })

    describe('applyWebhookSecretGeneration', () => {
        describe('setting new URL generates secret', () => {
            test('should generate secret when URL is set for the first time', () => {
                const testUrl = faker.internet.url()
                const resolvedData = { paymentStatusChangeWebhookUrl: testUrl }
                const existingItem = {}

                const result = applyWebhookSecretGeneration(resolvedData, existingItem)

                expect(result.paymentStatusChangeWebhookSecret).toBeDefined()
                expect(result.paymentStatusChangeWebhookSecret).toHaveLength(64) // 32 bytes = 64 hex chars
                expect(typeof result.paymentStatusChangeWebhookSecret).toBe('string')
            })

            test('should generate new secret when URL is changed to a different URL', () => {
                const oldUrl = faker.internet.url()
                const newUrl = faker.internet.url()
                const oldSecret = crypto.randomBytes(32).toString('hex')
                
                const resolvedData = { paymentStatusChangeWebhookUrl: newUrl }
                const existingItem = {
                    paymentStatusChangeWebhookUrl: oldUrl,
                    paymentStatusChangeWebhookSecret: oldSecret,
                }

                const result = applyWebhookSecretGeneration(resolvedData, existingItem)

                expect(result.paymentStatusChangeWebhookSecret).toBeDefined()
                expect(result.paymentStatusChangeWebhookSecret).not.toBe(oldSecret)
                expect(result.paymentStatusChangeWebhookSecret).toHaveLength(64)
            })

            test('should not generate new secret when URL is unchanged', () => {
                const testUrl = faker.internet.url()
                const existingSecret = crypto.randomBytes(32).toString('hex')
                
                const resolvedData = { paymentStatusChangeWebhookUrl: testUrl }
                const existingItem = {
                    paymentStatusChangeWebhookUrl: testUrl,
                    paymentStatusChangeWebhookSecret: existingSecret,
                }

                const result = applyWebhookSecretGeneration(resolvedData, existingItem)

                expect(result.paymentStatusChangeWebhookSecret).toBeUndefined()
            })

            test('should store plain text secret in context when provided', () => {
                const testUrl = faker.internet.url()
                const resolvedData = { paymentStatusChangeWebhookUrl: testUrl }
                const existingItem = {}
                const mockContext = { req: {} }

                const result = applyWebhookSecretGeneration(resolvedData, existingItem, mockContext)

                expect(result.paymentStatusChangeWebhookSecret).toBeDefined()
                expect(mockContext.req._plainWebhookSecret).toBe(result.paymentStatusChangeWebhookSecret)
            })
        })

        describe('clearing URL clears secret', () => {
            test('should clear secret when URL is set to null', () => {
                const oldUrl = faker.internet.url()
                const oldSecret = crypto.randomBytes(32).toString('hex')
                
                const resolvedData = { paymentStatusChangeWebhookUrl: null }
                const existingItem = {
                    paymentStatusChangeWebhookUrl: oldUrl,
                    paymentStatusChangeWebhookSecret: oldSecret,
                }

                const result = applyWebhookSecretGeneration(resolvedData, existingItem)

                expect(result.paymentStatusChangeWebhookSecret).toBeNull()
            })

            test('should clear secret when URL is set to undefined', () => {
                const oldUrl = faker.internet.url()
                const oldSecret = crypto.randomBytes(32).toString('hex')
                
                const resolvedData = { paymentStatusChangeWebhookUrl: undefined }
                const existingItem = {
                    paymentStatusChangeWebhookUrl: oldUrl,
                    paymentStatusChangeWebhookSecret: oldSecret,
                }

                const result = applyWebhookSecretGeneration(resolvedData, existingItem)

                expect(result.paymentStatusChangeWebhookSecret).toBeNull()
            })

            test('should clear secret when URL is set to empty string', () => {
                const oldUrl = faker.internet.url()
                const oldSecret = crypto.randomBytes(32).toString('hex')
                
                const resolvedData = { paymentStatusChangeWebhookUrl: '' }
                const existingItem = {
                    paymentStatusChangeWebhookUrl: oldUrl,
                    paymentStatusChangeWebhookSecret: oldSecret,
                }

                const result = applyWebhookSecretGeneration(resolvedData, existingItem)

                expect(result.paymentStatusChangeWebhookUrl).toBeNull()
                expect(result.paymentStatusChangeWebhookSecret).toBeNull()
            })

            test('should not clear secret when URL is not being changed', () => {
                const testUrl = faker.internet.url()
                const existingSecret = crypto.randomBytes(32).toString('hex')
                
                const resolvedData = { someOtherField: 'value' }
                const existingItem = {
                    paymentStatusChangeWebhookUrl: testUrl,
                    paymentStatusChangeWebhookSecret: existingSecret,
                }

                const result = applyWebhookSecretGeneration(resolvedData, existingItem)

                expect(result.paymentStatusChangeWebhookSecret).toBeUndefined()
            })
        })

        describe('empty string normalization', () => {
            test('should normalize empty string to null in resolvedData', () => {
                const resolvedData = { paymentStatusChangeWebhookUrl: '' }
                const existingItem = {}

                const result = applyWebhookSecretGeneration(resolvedData, existingItem)

                expect(result.paymentStatusChangeWebhookUrl).toBeNull()
            })

            test('should normalize empty string and clear secret when existing URL present', () => {
                const oldUrl = faker.internet.url()
                const oldSecret = crypto.randomBytes(32).toString('hex')
                
                const resolvedData = { paymentStatusChangeWebhookUrl: '' }
                const existingItem = {
                    paymentStatusChangeWebhookUrl: oldUrl,
                    paymentStatusChangeWebhookSecret: oldSecret,
                }

                const result = applyWebhookSecretGeneration(resolvedData, existingItem)

                expect(result.paymentStatusChangeWebhookUrl).toBeNull()
                expect(result.paymentStatusChangeWebhookSecret).toBeNull()
            })
        })

        describe('edge cases', () => {
            test('should handle missing existingItem gracefully', () => {
                const testUrl = faker.internet.url()
                const resolvedData = { paymentStatusChangeWebhookUrl: testUrl }

                const result = applyWebhookSecretGeneration(resolvedData, undefined)

                expect(result.paymentStatusChangeWebhookSecret).toBeDefined()
                expect(result.paymentStatusChangeWebhookSecret).toHaveLength(64)
            })

            test('should handle empty resolvedData', () => {
                const testUrl = faker.internet.url()
                const existingSecret = crypto.randomBytes(32).toString('hex')
                
                const resolvedData = {}
                const existingItem = {
                    paymentStatusChangeWebhookUrl: testUrl,
                    paymentStatusChangeWebhookSecret: existingSecret,
                }

                const result = applyWebhookSecretGeneration(resolvedData, existingItem)

                expect(result.paymentStatusChangeWebhookSecret).toBeUndefined()
            })

            test('should generate secret when setting URL from null', () => {
                const testUrl = faker.internet.url()
                const resolvedData = { paymentStatusChangeWebhookUrl: testUrl }
                const existingItem = {
                    paymentStatusChangeWebhookUrl: null,
                    paymentStatusChangeWebhookSecret: null,
                }

                const result = applyWebhookSecretGeneration(resolvedData, existingItem)

                expect(result.paymentStatusChangeWebhookSecret).toBeDefined()
                expect(result.paymentStatusChangeWebhookSecret).toHaveLength(64)
            })
        })
    })
})
