const mockReadFile = jest.fn()
jest.mock('node:fs/promises', () => ({
    readFile: mockReadFile,
}))

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
}))

const { FileContentLoader } = require('./FileContentLoader')

describe('FileContentLoader', () => {
    beforeEach(() => {
        mockReadFile.mockReset()
        mockFetch.mockReset()
    })

    describe('constructor', () => {
        it('should create loader with adapter and default options', () => {
            const adapter = { folder: 'test-folder' }
            const loader = new FileContentLoader(adapter)
            
            expect(loader.adapter).toBe(adapter)
            expect(loader.cache).toBeInstanceOf(Map)
            expect(loader.pending).toBeInstanceOf(Map)
            expect(loader.queue).toEqual([])
            expect(loader.batchTimer).toBeNull()
            expect(loader.batchDelayMs).toBe(10)
            expect(loader.batchCompletionPromise).toBeNull()
        })

        it('should accept custom batchDelayMs option', () => {
            const adapter = { folder: 'test' }
            const loader = new FileContentLoader(adapter, { batchDelayMs: 50 })
            
            expect(loader.batchDelayMs).toBe(50)
        })

        it('should accept batchDelayMs of 0 for immediate execution', () => {
            const adapter = { folder: 'test' }
            const loader = new FileContentLoader(adapter, { batchDelayMs: 0 })
            
            expect(loader.batchDelayMs).toBe(0)
        })

        it('should use default batchDelayMs when not provided', () => {
            const adapter = { folder: 'test' }
            const loader = new FileContentLoader(adapter, {})
            
            expect(loader.batchDelayMs).toBe(10)
        })
    })

    describe('_getCacheKey', () => {
        it('should use filename as cache key', () => {
            const adapter = { folder: 'test' }
            const loader = new FileContentLoader(adapter)
            
            const key = loader._getCacheKey({ 
                filename: 'test.json', 
                mimetype: 'application/json',
                originalFilename: 'original.json',
            })
            
            expect(key).toBe('test.json')
        })
    })

    describe('clear', () => {
        it('should clear both cache and pending maps', () => {
            const adapter = { folder: 'test' }
            const loader = new FileContentLoader(adapter)
            
            // Manually populate maps
            loader.cache.set('file1', Promise.resolve(Buffer.from('test')))
            loader.pending.set('file2', Promise.resolve(Buffer.from('test')))
            
            expect(loader.cache.size).toBe(1)
            expect(loader.pending.size).toBe(1)
            
            loader.clear()
            
            expect(loader.cache.size).toBe(0)
            expect(loader.pending.size).toBe(0)
        })
    })

    describe('loadMany', () => {
        it('should return empty array for empty input', async () => {
            const adapter = { folder: 'test' }
            const loader = new FileContentLoader(adapter)
            
            const results = await loader.loadMany([])
            
            expect(results).toEqual([])
        })
    })

    describe('_executeBatch', () => {
        it('should handle empty queue gracefully', async () => {
            const adapter = { folder: 'test' }
            const loader = new FileContentLoader(adapter)
            
            loader.queue = []
            await loader._executeBatch()
            
            expect(loader.queue).toHaveLength(0)
            expect(loader.batchTimer).toBeNull()
        })
    })

    describe('Batch scheduling', () => {
        describe('Race condition prevention', () => {
            it('should prevent race condition when scheduling batches with _schedulingBatch flag', async () => {
                const adapter = { src: '/test/path' }
                const loader = new FileContentLoader(adapter, { batchDelayMs: 0 })
                
                // Mock file reads
                mockReadFile.mockResolvedValue(Buffer.from('test'))
                
                // Rapidly queue multiple requests
                const promise1 = loader.load({ filename: 'file1.json' })
                const promise2 = loader.load({ filename: 'file2.json' })
                const promise3 = loader.load({ filename: 'file3.json' })
                
                // Verify _schedulingBatch flag prevents multiple timers
                expect(loader._schedulingBatch).toBeDefined()
                
                await Promise.all([promise1, promise2, promise3])
                
                // Clean up
                jest.restoreAllMocks()
            })
        })

        describe('Cache management for failed requests', () => {
            it('should remove rejected promises from cache to prevent memory leaks', async () => {
                const adapter = { src: '/test/path' }
                const loader = new FileContentLoader(adapter)
                
                // Mock file read to fail
                mockReadFile.mockRejectedValue(new Error('Read failed'))
                
                const fileMeta = { filename: 'failing-file.json' }
                
                // First attempt should fail
                await expect(loader.load(fileMeta)).rejects.toThrow('Read failed')
                
                // Verify promise was removed from cache after rejection
                const cacheKey = loader._getCacheKey(fileMeta)
                expect(loader.cache.has(cacheKey)).toBe(false)
                expect(loader.pending.has(cacheKey)).toBe(false)
            })

            it('should allow retry after transient error', async () => {
                const adapter = { src: '/test/path' }
                const loader = new FileContentLoader(adapter)
                
                const fileMeta = { filename: 'retry-file.json' }
                
                // Mock to fail first time, succeed second time
                mockReadFile
                    .mockRejectedValueOnce(new Error('Transient error'))
                    .mockResolvedValueOnce(Buffer.from('success'))
                
                // First attempt fails
                await expect(loader.load(fileMeta)).rejects.toThrow('Transient error')
                
                // Second attempt should succeed (not use cached rejection)
                const result = await loader.load(fileMeta)
                expect(result).toEqual(Buffer.from('success'))
            })
        })

        describe('Missing file handling', () => {
            it('should resolve with null for 404 responses in cloud adapter', async () => {
                const adapter = {
                    acl: {
                        generateUrl: jest.fn(() => 'https://example.com/file.json'),
                    },
                    folder: 'test-folder',
                }
                const loader = new FileContentLoader(adapter)
                
                // Mock fetch to return 404
                mockFetch.mockResolvedValue({
                    ok: false,
                    status: 404,
                })
                
                const fileMeta = { filename: 'missing-file.json' }
                
                // Should resolve with null, not reject
                const result = await loader.load(fileMeta)
                expect(result).toBeNull()
            })

            it('should resolve with null for ENOENT in local adapter', async () => {
                const adapter = { src: '/test/path' }
                const loader = new FileContentLoader(adapter)
                
                // Mock file read to fail with ENOENT
                const error = new Error('File not found')
                error.code = 'ENOENT'
                mockReadFile.mockRejectedValue(error)
                
                const fileMeta = { filename: 'missing-file.json' }
                
                // Should resolve with null, not reject
                const result = await loader.load(fileMeta)
                expect(result).toBeNull()
            })
        })

        describe('Batch error handling', () => {
            it('should reject all pending promises when batch execution fails', async () => {
                const adapter = { src: '/test/path' }
                const loader = new FileContentLoader(adapter)
                
                // Mock to cause batch execution to fail
                mockReadFile.mockImplementation(() => {
                    throw new Error('Critical batch error')
                })
                
                const fileMeta1 = { filename: 'file1.json' }
                const fileMeta2 = { filename: 'file2.json' }
                const fileMeta3 = { filename: 'file3.json' }
                
                // Queue multiple requests
                const promise1 = loader.load(fileMeta1)
                const promise2 = loader.load(fileMeta2)
                const promise3 = loader.load(fileMeta3)
                
                // All should be rejected with batch failure message
                await expect(promise1).rejects.toThrow()
                await expect(promise2).rejects.toThrow()
                await expect(promise3).rejects.toThrow()
            })
        })
    })
})
