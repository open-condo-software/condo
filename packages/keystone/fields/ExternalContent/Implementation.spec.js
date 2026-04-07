// Mock fs/promises before importing Implementation
const mockReadFile = jest.fn()
jest.mock('fs/promises', () => ({
    readFile: mockReadFile,
}))

// Mock fetch before importing Implementation
const mockFetch = jest.fn()
jest.mock('@open-condo/keystone/fetch', () => ({
    fetch: mockFetch,
}))

// Mock logger to avoid console output in tests
jest.mock('@open-condo/keystone/logging', () => ({
    getLogger: () => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    }),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}))

const { ExternalContentImplementation } = require('./Implementation')

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
                publicUrl: () => 'https://example.com/new.bin',
            }

            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            const res = await impl.resolveInput({
                resolvedData: { raw: { a: 1 } },
                existingItem: { raw: { id: 'old', filename: 'old.bin' } },
                listKey: 'BillingReceipt',
            })

            expect(res).toEqual({ id: 'new', filename: 'new.bin', publicUrl: 'https://example.com/new.bin', meta: { format: 'json' }, _type: 'ExternalContent.file-meta' })
            expect(calls).toEqual(['save', 'delete'])
        })

        test('does not delete previous file if save fails', async () => {
            const adapter = {
                save: async () => {
                    throw new Error('save failed')
                },
                delete: jest.fn(),
                publicUrl: jest.fn(),
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
                publicUrl: jest.fn(() => 'https://example.com/new.bin'),
            }

            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            await impl.resolveInput({
                resolvedData: { raw: { a: 1 } },
                existingItem: null,
                listKey: 'BillingReceipt',
            })

            const saveArgs = adapter.save.mock.calls[0][0]
            // Filename should include listKey, field path, and ID for uniqueness
            expect(saveArgs.filename).toMatch(/^BillingReceipt_raw_[a-z0-9-]+\.json$/)
            expect(saveArgs.id).toBeTruthy()
        })

        test('does not delete null prevValue', async () => {
            const adapter = {
                save: jest.fn(async () => ({ id: 'new', filename: 'new.bin' })),
                delete: jest.fn(),
                publicUrl: jest.fn(() => 'https://example.com/new.bin'),
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
                publicUrl: jest.fn(() => 'https://example.com/new.bin'),
            }

            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            const result = await impl.resolveInput({
                resolvedData: { raw: { a: 1 } },
                existingItem: { raw: { id: 'old', filename: 'old.bin' } },
                listKey: 'BillingReceipt',
            })

            expect(result).toEqual({ id: 'new', filename: 'new.bin', publicUrl: 'https://example.com/new.bin', meta: { format: 'json' }, _type: 'ExternalContent.file-meta' })
            expect(adapter.delete).toHaveBeenCalled()
        })
    })

    describe('processors', () => {
        const { DEFAULT_PROCESSORS } = require('./Implementation')

        test('text/xml deserialize empty string to null', () => {
            expect(DEFAULT_PROCESSORS.text.deserialize('')).toBe(null)
            expect(DEFAULT_PROCESSORS.xml.deserialize('')).toBe(null)
        })

        test('json deserialize handles corrupted JSON with error', () => {
            expect(() => DEFAULT_PROCESSORS.json.deserialize('{invalid json}'))
                .toThrow('Failed to parse JSON content')
        })

        test('json deserialize empty string returns null', () => {
            expect(DEFAULT_PROCESSORS.json.deserialize('')).toBe(null)
        })

        test('json deserialize valid JSON succeeds', () => {
            const result = DEFAULT_PROCESSORS.json.deserialize('{"test": "data"}')
            expect(result).toEqual({ test: 'data' })
        })
    })

    describe('security - path traversal protection', () => {
        beforeEach(() => {
            mockReadFile.mockClear()
        })

        test('blocks path traversal in local adapter', async () => {
            const adapter = {
                src: '/test/path',
            }
            
            mockReadFile.mockResolvedValue(Buffer.from('{"test": "data"}'))
            
            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            const resolver = impl.gqlOutputFieldResolvers().rawResolved
            
            await expect(resolver({
                raw: { id: 'test-id', filename: '../../../etc/passwd', meta: { format: 'json' } },
            }, {}, {})).rejects.toThrow('path traversal detected')
        })

        test('allows valid filenames in local adapter', async () => {
            const adapter = {
                src: '/test/path',
            }
            
            mockReadFile.mockResolvedValue(Buffer.from('{"test": "data"}'))
            
            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            const resolver = impl.gqlOutputFieldResolvers().rawResolved
            
            const result = await resolver({
                raw: { id: 'test-id', filename: 'valid-file.json', meta: { format: 'json' } },
            }, {}, {})
            
            expect(result).toEqual({ test: 'data' })
        })
    })

    describe('deserialization error context', () => {
        beforeEach(() => {
            mockReadFile.mockClear()
        })

        test('re-throws deserialization error with original message', async () => {
            const adapter = {
                src: '/test/path',
            }
            
            mockReadFile.mockResolvedValue(Buffer.from('{invalid json}'))
            
            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            const resolver = impl.gqlOutputFieldResolvers().rawResolved
            
            await expect(resolver({
                id: 'item-123',
                raw: { id: 'test-id', filename: 'test.json', meta: { format: 'json' } },
            }, {}, {})).rejects.toThrow('Failed to deserialize ExternalContent value')
        })

        test('re-throws deserialization error when item ID is missing', async () => {
            const adapter = {
                src: '/test/path',
            }
            
            mockReadFile.mockResolvedValue(Buffer.from('{invalid json}'))
            
            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            const resolver = impl.gqlOutputFieldResolvers().rawResolved
            
            await expect(resolver({
                raw: { id: 'test-id', filename: 'test.json', meta: { format: 'json' } },
            }, {}, {})).rejects.toThrow('Failed to deserialize ExternalContent value')
        })
    })

    describe('File reading error handling', () => {
        // File reading logic is tested indirectly through gqlOutputFieldResolvers
        
        beforeEach(() => {
            mockFetch.mockClear()
        })
        
        afterEach(() => {
            mockFetch.mockClear()
        })

        test('handles cloud adapter with mimetype parameter', async () => {
            const mockGenerateUrl = jest.fn(() => 'https://example.com/file.json')
            const adapter = {
                acl: {
                    generateUrl: mockGenerateUrl,
                },
                folder: 'test-folder',
            }

            // Setup mock fetch to return successful response
            mockFetch.mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const data = JSON.stringify({ test: 'data' })
                    return new TextEncoder().encode(data).buffer
                },
            })

            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            const resolver = impl.gqlOutputFieldResolvers().rawResolved
            
            const result = await resolver({
                raw: {
                    id: 'test-id',
                    filename: 'test.json',
                    mimetype: 'application/json',
                    originalFilename: 'original.json',
                    meta: { format: 'json' },
                },
            }, {}, {})

            expect(result).toEqual({ test: 'data' })
            expect(mockGenerateUrl).toHaveBeenCalledWith({
                filename: 'test-folder/test.json',
                mimetype: 'application/json',
                originalFilename: 'original.json',
            })
        })

        test('throws error when generateUrl returns invalid URL', async () => {
            const adapter = {
                acl: {
                    generateUrl: jest.fn(() => null),
                },
                folder: 'test-folder',
            }

            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            const resolver = impl.gqlOutputFieldResolvers().rawResolved
            
            await expect(resolver({
                raw: { id: 'test-id', filename: 'test.json', meta: { format: 'json' } },
            }, {}, {})).rejects.toThrow('Invalid URL generated for file: test.json')
        })

        test('resolves with null for 404 fetch response', async () => {
            const adapter = {
                acl: {
                    generateUrl: jest.fn(() => 'https://example.com/file.json'),
                },
                folder: 'test-folder',
            }

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
            })

            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            const resolver = impl.gqlOutputFieldResolvers().rawResolved
            
            const result = await resolver({
                raw: { id: 'test-id', filename: 'test.json', meta: { format: 'json' } },
            }, {}, {})
            expect(result).toBeNull()
        })

        test('throws error with context when network error occurs', async () => {
            const adapter = {
                acl: {
                    generateUrl: jest.fn(() => 'https://example.com/file.json'),
                },
                folder: 'test-folder',
            }

            // Setup mock fetch to throw network error
            mockFetch.mockRejectedValueOnce(new Error('Network error'))

            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            const resolver = impl.gqlOutputFieldResolvers().rawResolved
            
            await expect(resolver({
                raw: { id: 'test-id', filename: 'test.json', meta: { format: 'json' } },
            }, {}, {})).rejects.toThrow('ExternalContent: failed to read file test.json: Network error')
        })
    })

    describe('DataLoader integration', () => {
        beforeEach(() => {
            mockReadFile.mockClear()
        })

        test('uses DataLoader when context is provided', async () => {
            const adapter = {
                src: '/test/path',
            }
            
            mockReadFile.mockResolvedValue(Buffer.from(JSON.stringify({ test: 'data' })))
            
            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            const resolver = impl.gqlOutputFieldResolvers().rawResolved
            
            const context = {}
            
            // First call should create loader
            const result1 = await resolver({
                raw: { id: 'test-id', filename: 'test.json', meta: { format: 'json' } },
            }, {}, context)
            
            expect(result1).toEqual({ test: 'data' })
            expect(context._externalContentLoaders).toBeDefined()
            expect(context._externalContentLoaders.size).toBe(1)
            
            // Second call should reuse loader (cached)
            const result2 = await resolver({
                raw: { id: 'test-id', filename: 'test.json', meta: { format: 'json' } },
            }, {}, context)
            
            expect(result2).toEqual({ test: 'data' })
            expect(mockReadFile).toHaveBeenCalledTimes(1) // Cached!
        })

        test('uses DataLoader even when context is an empty object', async () => {
            const adapter = {
                src: '/test/path',
            }
            
            mockReadFile.mockResolvedValue(Buffer.from(JSON.stringify({ test: 'data' })))
            
            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            const resolver = impl.gqlOutputFieldResolvers().rawResolved
            
            const context = {}
            const result = await resolver({
                raw: { id: 'test-id', filename: 'test.json', meta: { format: 'json' } },
            }, {}, context)
            
            expect(result).toEqual({ test: 'data' })
            expect(mockReadFile).toHaveBeenCalledTimes(1)
        })

        test('creates separate loaders for different adapters', async () => {
            const adapter1 = {
                src: '/test/path1',
            }
            const adapter2 = {
                src: '/test/path2',
            }
            
            mockReadFile
                .mockResolvedValueOnce(Buffer.from(JSON.stringify({ data: 1 })))
                .mockResolvedValueOnce(Buffer.from(JSON.stringify({ data: 2 })))
            
            const impl1 = new ExternalContentImplementation('raw', { adapter: adapter1, format: 'json' }, createMeta())
            const impl2 = new ExternalContentImplementation('raw', { adapter: adapter2, format: 'json' }, createMeta())
            
            const resolver1 = impl1.gqlOutputFieldResolvers().rawResolved
            const resolver2 = impl2.gqlOutputFieldResolvers().rawResolved
            
            const context = {}
            
            await resolver1({
                raw: { id: 'test-id', filename: 'test1.json', meta: { format: 'json' } },
            }, {}, context)
            
            await resolver2({
                raw: { id: 'test-id', filename: 'test2.json', meta: { format: 'json' } },
            }, {}, context)
            
            // Should have two separate loaders
            expect(context._externalContentLoaders.size).toBe(2)
        })

        test('creates separate loaders for different adapter instances with same folder', async () => {
            // This tests the loader key collision fix
            const adapter1 = {
                src: '/test/path',
            }
            const adapter2 = {
                src: '/test/path', // Same path as adapter1
            }
            
            mockReadFile
                .mockResolvedValueOnce(Buffer.from(JSON.stringify({ data: 1 })))
                .mockResolvedValueOnce(Buffer.from(JSON.stringify({ data: 2 })))
            
            const impl1 = new ExternalContentImplementation('raw', { adapter: adapter1, format: 'json' }, createMeta())
            const impl2 = new ExternalContentImplementation('raw', { adapter: adapter2, format: 'json' }, createMeta())
            
            const resolver1 = impl1.gqlOutputFieldResolvers().rawResolved
            const resolver2 = impl2.gqlOutputFieldResolvers().rawResolved
            
            const context = {}
            
            await resolver1({
                raw: { id: 'test-id', filename: 'test1.json', meta: { format: 'json' } },
            }, {}, context)
            
            await resolver2({
                raw: { id: 'test-id', filename: 'test2.json', meta: { format: 'json' } },
            }, {}, context)
            
            // Should have two separate loaders even though they have the same folder
            // This verifies the WeakMap-based key prevents collisions
            expect(context._externalContentLoaders.size).toBe(2)
        })

        test('batches multiple resolver calls in same context', async () => {
            const adapter = {
                src: '/test/path',
            }
            
            mockReadFile
                .mockResolvedValueOnce(Buffer.from(JSON.stringify({ id: 1 })))
                .mockResolvedValueOnce(Buffer.from(JSON.stringify({ id: 2 })))
                .mockResolvedValueOnce(Buffer.from(JSON.stringify({ id: 3 })))
            
            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            const resolver = impl.gqlOutputFieldResolvers().rawResolved
            
            const context = {}
            
            // Simulate list query - multiple items resolved in parallel
            const promise1 = resolver({
                raw: { id: 'id1', filename: 'file1.json', meta: { format: 'json' } },
            }, {}, context)
            const promise2 = resolver({
                raw: { id: 'id2', filename: 'file2.json', meta: { format: 'json' } },
            }, {}, context)
            const promise3 = resolver({
                raw: { id: 'id3', filename: 'file3.json', meta: { format: 'json' } },
            }, {}, context)
            
            const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3])
            
            expect(result1).toEqual({ id: 1 })
            expect(result2).toEqual({ id: 2 })
            expect(result3).toEqual({ id: 3 })
            expect(mockReadFile).toHaveBeenCalledTimes(3)
        })

        test('handles duplicate files with caching', async () => {
            const adapter = {
                src: '/test/path',
            }
            
            mockReadFile.mockResolvedValue(Buffer.from(JSON.stringify({ shared: 'data' })))
            
            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            const resolver = impl.gqlOutputFieldResolvers().rawResolved
            
            const context = {}
            
            // Multiple items with same file
            const promise1 = resolver({
                raw: { id: 'id1', filename: 'shared.json', meta: { format: 'json' } },
            }, {}, context)
            const promise2 = resolver({
                raw: { id: 'id2', filename: 'shared.json', meta: { format: 'json' } },
            }, {}, context)
            const promise3 = resolver({
                raw: { id: 'id3', filename: 'shared.json', meta: { format: 'json' } },
            }, {}, context)
            
            const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3])
            
            expect(result1).toEqual({ shared: 'data' })
            expect(result2).toEqual({ shared: 'data' })
            expect(result3).toEqual({ shared: 'data' })
            expect(mockReadFile).toHaveBeenCalledTimes(1) // Only read once!
        })
    })
    
    describe('Size limit validation', () => {
        test('throws error when payload exceeds MAX_SIZE', async () => {
            const adapter = {
                save: jest.fn(),
                delete: jest.fn(),
            }
            
            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            
            // Create data larger than default 10MB limit
            // Generate ~11MB of data
            const largeData = { data: 'x'.repeat(11 * 1024 * 1024) }
            
            await expect(impl.resolveInput({
                resolvedData: { raw: largeData },
                existingItem: null,
                listKey: 'TestList',
            })).rejects.toThrow('exceeds maximum allowed size')
        })
        
        test('allows payload within size limit', async () => {
            const adapter = {
                save: jest.fn(async () => ({ id: 'new', filename: 'new.json' })),
                delete: jest.fn(),
                publicUrl: jest.fn(() => 'https://example.com/new.json'),
            }
            
            const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
            
            // Small data that should pass
            const smallData = { data: 'small' }
            
            const result = await impl.resolveInput({
                resolvedData: { raw: smallData },
                existingItem: null,
                listKey: 'TestList',
            })
            
            expect(result).toEqual({ id: 'new', filename: 'new.json', publicUrl: 'https://example.com/new.json', meta: { format: 'json' }, _type: 'ExternalContent.file-meta' })
            expect(adapter.save).toHaveBeenCalled()
        })
    })

    describe('File-meta type marker', () => {
        describe('Type identification', () => {
            test('should add _type marker to saved file-meta objects', async () => {
                const adapter = {
                    save: jest.fn(async () => ({ id: 'test-id', filename: 'test.json' })),
                    delete: jest.fn(),
                    publicUrl: jest.fn(() => 'https://example.com/test.json'),
                }

                const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
                const result = await impl.resolveInput({
                    resolvedData: { raw: { test: 'data' } },
                    existingItem: null,
                    listKey: 'TestList',
                })

                // Verify _type marker is added
                expect(result).toHaveProperty('_type', 'ExternalContent.file-meta')
                expect(result).toMatchObject({
                    id: 'test-id',
                    filename: 'test.json',
                    publicUrl: 'https://example.com/test.json',
                    meta: { format: 'json' },
                    _type: 'ExternalContent.file-meta',
                })
            })

            test('should preserve other properties when adding _type marker', async () => {
                const adapter = {
                    save: jest.fn(async () => ({
                        id: 'test-id',
                        filename: 'test.json',
                        mimetype: 'application/json',
                        originalFilename: 'original.json',
                        size: 1234,
                    })),
                    delete: jest.fn(),
                    publicUrl: jest.fn(() => 'https://example.com/test.json'),
                }

                const impl = new ExternalContentImplementation('raw', { adapter, format: 'json' }, createMeta())
                const result = await impl.resolveInput({
                    resolvedData: { raw: { test: 'data' } },
                    existingItem: null,
                    listKey: 'TestList',
                })

                // Verify all properties are preserved and _type is added
                expect(result).toMatchObject({
                    id: 'test-id',
                    filename: 'test.json',
                    mimetype: 'application/json',
                    originalFilename: 'original.json',
                    size: 1234,
                    publicUrl: 'https://example.com/test.json',
                    meta: { format: 'json' },
                    _type: 'ExternalContent.file-meta',
                })
            })
        })
    })
})
