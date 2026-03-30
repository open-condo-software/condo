const { ExternalContentImplementation } = require('./Implementation')

// Mock logger to avoid console output in tests
jest.mock('@open-condo/keystone/logging', () => ({
    getLogger: () => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    }),
}))

const createMeta = () => ({
    listAdapter: {
        newFieldAdapter: jest.fn(() => ({})),
    },
    getListByKey: jest.fn(),
    listKey: 'TestList',
    fieldAdapterClass: class {},
    defaultAccess: {
        create: true,
        read: true,
        update: true,
    },
    schemaNames: ['public'],
})

describe('ExternalContent field type', () => {
    describe('ExternalContentImplementation.resolveInput', () => {
        test('saves new file before deleting previous one', async () => {
            const calls = []
            const adapter = {
                save: async () => {
                    calls.push('save')
                    return { id: 'new', filename: 'new.bin' }
                },
                delete: async () => {
                    calls.push('delete')
                },
            }

            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            const res = await impl.resolveInput({
                resolvedData: { raw: { a: 1 } },
                existingItem: { raw: { id: 'old', filename: 'old.bin' } },
                listKey: 'BillingReceipt',
            })

            expect(res).toEqual({ id: 'new', filename: 'new.bin' })
            expect(calls).toEqual(['save', 'delete'])
        })

        test('does not delete previous file if save fails', async () => {
            const adapter = {
                save: async () => {
                    throw new Error('save failed')
                },
                delete: jest.fn(),
            }

            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())

            await expect(impl.resolveInput({
                resolvedData: { raw: { a: 1 } },
                existingItem: { raw: { id: 'old', filename: 'old.bin' } },
                listKey: 'BillingReceipt',
            })).rejects.toThrow('save failed')

            expect(adapter.delete).not.toHaveBeenCalled()
        })

        test('uses listKey for filename prefix and includes ID', async () => {
            const adapter = {
                save: jest.fn(async () => ({ id: 'new', filename: 'new.bin' })),
                delete: jest.fn(),
            }

            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            await impl.resolveInput({
                resolvedData: { raw: { a: 1 } },
                existingItem: null,
                listKey: 'BillingReceipt',
            })

            const saveArgs = adapter.save.mock.calls[0][0]
            // Filename should include listKey, field path, and ID for uniqueness
            expect(saveArgs.filename).toMatch(/^BillingReceipt_raw_[a-z0-9]+\.json$/)
            expect(saveArgs.id).toBeTruthy()
        })

        test('does not delete null prevValue', async () => {
            const adapter = {
                save: jest.fn(async () => ({ id: 'new', filename: 'new.bin' })),
                delete: jest.fn(),
            }

            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            await impl.resolveInput({
                resolvedData: { raw: { a: 1 } },
                existingItem: { raw: null },
                listKey: 'BillingReceipt',
            })

            expect(adapter.delete).not.toHaveBeenCalled()
        })

        test('handles delete errors gracefully when setting to null', async () => {
            const adapter = {
                save: jest.fn(),
                delete: jest.fn(async () => {
                    throw new Error('delete failed')
                }),
            }

            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            const result = await impl.resolveInput({
                resolvedData: { raw: null },
                existingItem: { raw: { id: 'old', filename: 'old.bin' } },
                listKey: 'BillingReceipt',
            })

            expect(result).toBe(null)
            expect(adapter.delete).toHaveBeenCalled()
        })

        test('handles delete errors gracefully after save', async () => {
            const adapter = {
                save: jest.fn(async () => ({ id: 'new', filename: 'new.bin' })),
                delete: jest.fn(async () => {
                    throw new Error('delete failed')
                }),
            }

            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            const result = await impl.resolveInput({
                resolvedData: { raw: { a: 1 } },
                existingItem: { raw: { id: 'old', filename: 'old.bin' } },
                listKey: 'BillingReceipt',
            })

            expect(result).toEqual({ id: 'new', filename: 'new.bin' })
            expect(adapter.delete).toHaveBeenCalled()
        })
    })

    describe('processors', () => {
        test('text/xml deserialize empty string to null', () => {
            const adapter = { save: async () => ({}), delete: async () => undefined }

            const textImpl = new ExternalContentImplementation('raw', { adapter, format: 'text' }, createMeta())
            expect(textImpl.deserialize('')).toBe(null)

            const xmlImpl = new ExternalContentImplementation('raw', { adapter, format: 'xml' }, createMeta())
            expect(xmlImpl.deserialize('')).toBe(null)
        })
    })

    describe('readFromAdapter error handling', () => {
        // Note: readFromAdapter is not exported, so we test it indirectly through gqlOutputFieldResolvers
        
        test('handles cloud adapter with mimetype parameter', async () => {
            const mockGenerateUrl = jest.fn(() => 'https://example.com/file.json')
            const adapter = {
                acl: {
                    generateUrl: mockGenerateUrl,
                },
                folder: 'test-folder',
            }

            // Mock global fetch
            global.fetch = jest.fn(async () => ({
                ok: true,
                arrayBuffer: async () => Buffer.from(JSON.stringify({ test: 'data' })),
            }))

            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            const resolver = impl.gqlOutputFieldResolvers().raw
            
            const result = await resolver({
                raw: {
                    id: 'test-id',
                    filename: 'test.json',
                    mimetype: 'application/json',
                    originalFilename: 'original.json',
                },
            })

            expect(result).toEqual({ test: 'data' })
            expect(mockGenerateUrl).toHaveBeenCalledWith({
                filename: 'test-folder/test.json',
                mimetype: 'application/json',
                originalFilename: 'original.json',
            })

            delete global.fetch
        })

        test('throws error when generateUrl returns invalid URL', async () => {
            const adapter = {
                acl: {
                    generateUrl: jest.fn(() => null),
                },
                folder: 'test-folder',
            }

            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            const resolver = impl.gqlOutputFieldResolvers().raw
            
            await expect(resolver({
                raw: { id: 'test-id', filename: 'test.json' },
            })).rejects.toThrow('Invalid URL generated for file: test.json')
        })

        test('throws error when fetch fails', async () => {
            const adapter = {
                acl: {
                    generateUrl: jest.fn(() => 'https://example.com/file.json'),
                },
                folder: 'test-folder',
            }

            global.fetch = jest.fn(async () => ({
                ok: false,
                status: 404,
            }))

            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            const resolver = impl.gqlOutputFieldResolvers().raw
            
            await expect(resolver({
                raw: { id: 'test-id', filename: 'test.json' },
            })).rejects.toThrow('Fetch failed with status 404 for file: test.json')

            delete global.fetch
        })

        test('throws error with context when network error occurs', async () => {
            const adapter = {
                acl: {
                    generateUrl: jest.fn(() => 'https://example.com/file.json'),
                },
                folder: 'test-folder',
            }

            global.fetch = jest.fn(async () => {
                throw new Error('Network error')
            })

            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            const resolver = impl.gqlOutputFieldResolvers().raw
            
            await expect(resolver({
                raw: { id: 'test-id', filename: 'test.json' },
            })).rejects.toThrow('ExternalContent: failed to read file test.json: Network error')

            delete global.fetch
        })
    })
})

