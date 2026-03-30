// Mock fs/promises before importing FileContentLoader
const mockReadFile = jest.fn()
jest.mock('fs/promises', () => ({
    readFile: mockReadFile,
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
    describe('constructor', () => {
        test('creates loader with adapter', () => {
            const adapter = { folder: 'test-folder' }
            const loader = new FileContentLoader(adapter)
            
            expect(loader.adapter).toBe(adapter)
            expect(loader.cache).toBeInstanceOf(Map)
            expect(loader.queue).toEqual([])
            expect(loader.batchDelay).toBe(10)
        })
    })

    describe('caching', () => {
        beforeEach(() => {
            mockReadFile.mockClear()
        })

        test('caches file reads', async () => {
            const adapter = {
                src: '/test/path',
            }
            
            mockReadFile.mockResolvedValue(Buffer.from('test content'))
            
            const loader = new FileContentLoader(adapter)
            const fileMeta = { filename: 'test.json' }
            
            // First call
            const result1 = await loader.load(fileMeta)
            // Second call should use cache
            const result2 = await loader.load(fileMeta)
            
            expect(result1.toString()).toBe('test content')
            expect(result2.toString()).toBe('test content')
            expect(mockReadFile).toHaveBeenCalledTimes(1)
        })

        test('different files have separate cache entries', async () => {
            const adapter = {
                src: '/test/path',
            }
            
            mockReadFile
                .mockResolvedValueOnce(Buffer.from('content 1'))
                .mockResolvedValueOnce(Buffer.from('content 2'))
            
            const loader = new FileContentLoader(adapter)
            
            const result1 = await loader.load({ filename: 'file1.json' })
            const result2 = await loader.load({ filename: 'file2.json' })
            
            expect(result1.toString()).toBe('content 1')
            expect(result2.toString()).toBe('content 2')
            expect(mockReadFile).toHaveBeenCalledTimes(2)
        })

        test('cache key uses filename', () => {
            const adapter = { folder: 'test' }
            const loader = new FileContentLoader(adapter)
            
            const key = loader._getCacheKey({ filename: 'test.json', id: '123' })
            expect(key).toBe('test.json')
        })
    })

    describe('batching - local adapter', () => {
        beforeEach(() => {
            mockReadFile.mockClear()
        })

        test('batches multiple loads together', async () => {
            const adapter = {
                src: '/test/path',
            }
            
            mockReadFile
                .mockResolvedValueOnce(Buffer.from('content 1'))
                .mockResolvedValueOnce(Buffer.from('content 2'))
                .mockResolvedValueOnce(Buffer.from('content 3'))
            
            const loader = new FileContentLoader(adapter)
            
            // Start multiple loads without awaiting
            const promise1 = loader.load({ filename: 'file1.json' })
            const promise2 = loader.load({ filename: 'file2.json' })
            const promise3 = loader.load({ filename: 'file3.json' })
            
            // All should be in queue
            expect(loader.queue).toHaveLength(3)
            
            // Wait for batch to execute
            const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3])
            
            expect(result1.toString()).toBe('content 1')
            expect(result2.toString()).toBe('content 2')
            expect(result3.toString()).toBe('content 3')
            
            // Queue should be cleared after batch execution
            expect(loader.queue).toHaveLength(0)
        })

        test('executes batch after delay', async () => {
            const adapter = {
                src: '/test/path',
            }
            
            mockReadFile.mockResolvedValue(Buffer.from('test'))
            
            const loader = new FileContentLoader(adapter)
            
            const promise = loader.load({ filename: 'test.json' })
            
            // Batch timer should be set
            expect(loader.batchTimer).not.toBeNull()
            
            await promise
            
            // Timer should be cleared after execution
            expect(loader.batchTimer).toBeNull()
        })

        test('preserves order in batch results', async () => {
            const adapter = {
                src: '/test/path',
            }
            
            mockReadFile.mockImplementation((path) => {
                if (path.includes('file1')) return Promise.resolve(Buffer.from('1'))
                if (path.includes('file2')) return Promise.resolve(Buffer.from('2'))
                if (path.includes('file3')) return Promise.resolve(Buffer.from('3'))
            })
            
            const loader = new FileContentLoader(adapter)
            
            const promise1 = loader.load({ filename: 'file1.json' })
            const promise2 = loader.load({ filename: 'file2.json' })
            const promise3 = loader.load({ filename: 'file3.json' })
            
            const [r1, r2, r3] = await Promise.all([promise1, promise2, promise3])
            
            expect(r1.toString()).toBe('1')
            expect(r2.toString()).toBe('2')
            expect(r3.toString()).toBe('3')
        })
    })

    describe('batching - cloud adapter', () => {
        afterEach(() => {
            delete global.fetch
        })

        test('batches multiple cloud fetches together', async () => {
            const adapter = {
                acl: {
                    generateUrl: jest.fn((params) => `https://example.com/${params.filename}`),
                },
                folder: 'test-folder',
            }
            
            global.fetch = jest.fn()
                .mockResolvedValueOnce({
                    ok: true,
                    arrayBuffer: async () => Buffer.from('content 1'),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    arrayBuffer: async () => Buffer.from('content 2'),
                })
            
            const loader = new FileContentLoader(adapter)
            
            const promise1 = loader.load({ filename: 'file1.json' })
            const promise2 = loader.load({ filename: 'file2.json' })
            
            const [result1, result2] = await Promise.all([promise1, promise2])
            
            expect(result1.toString()).toBe('content 1')
            expect(result2.toString()).toBe('content 2')
            expect(adapter.acl.generateUrl).toHaveBeenCalledTimes(2)
            expect(global.fetch).toHaveBeenCalledTimes(2)
        })

        test('passes mimetype and originalFilename to generateUrl', async () => {
            const adapter = {
                acl: {
                    generateUrl: jest.fn(() => 'https://example.com/file.json'),
                },
                folder: 'test-folder',
            }
            
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                arrayBuffer: async () => Buffer.from('test'),
            })
            
            const loader = new FileContentLoader(adapter)
            
            await loader.load({
                filename: 'test.json',
                mimetype: 'application/json',
                originalFilename: 'original.json',
            })
            
            expect(adapter.acl.generateUrl).toHaveBeenCalledWith({
                filename: 'test-folder/test.json',
                mimetype: 'application/json',
                originalFilename: 'original.json',
            })
        })
    })

    describe('security - path traversal protection', () => {
        beforeEach(() => {
            mockReadFile.mockClear()
        })

        test('blocks path traversal attempts with ../', async () => {
            const adapter = {
                src: '/test/path',
            }
            
            const loader = new FileContentLoader(adapter)
            
            await expect(loader.load({ filename: '../../../etc/passwd' }))
                .rejects.toThrow('path traversal detected')
        })

        test('blocks path traversal with absolute paths', async () => {
            const adapter = {
                src: '/test/path',
            }
            
            const loader = new FileContentLoader(adapter)
            
            await expect(loader.load({ filename: '/etc/passwd' }))
                .rejects.toThrow('path traversal detected')
        })

        test('allows valid filenames', async () => {
            const adapter = {
                src: '/test/path',
            }
            
            mockReadFile.mockResolvedValue(Buffer.from('safe content'))
            
            const loader = new FileContentLoader(adapter)
            
            const result = await loader.load({ filename: 'valid-file.json' })
            expect(result.toString()).toBe('safe content')
        })

        test('allows subdirectories within base path', async () => {
            const adapter = {
                src: '/test/path',
            }
            
            mockReadFile.mockResolvedValue(Buffer.from('subdir content'))
            
            const loader = new FileContentLoader(adapter)
            
            const result = await loader.load({ filename: 'subdir/file.json' })
            expect(result.toString()).toBe('subdir content')
        })
    })

    describe('race condition handling', () => {
        beforeEach(() => {
            mockReadFile.mockClear()
        })

        test('handles concurrent loads during batch execution', async () => {
            const adapter = {
                src: '/test/path',
            }
            
            let readFileCallCount = 0
            mockReadFile.mockImplementation(async () => {
                readFileCallCount++
                // Simulate slow file read
                await new Promise(resolve => setTimeout(resolve, 20))
                return Buffer.from(`content-${readFileCallCount}`)
            })
            
            const loader = new FileContentLoader(adapter)
            
            // Start first load
            const promise1 = loader.load({ filename: 'file1.json' })
            
            // Wait a bit for batch to start executing
            await new Promise(resolve => setTimeout(resolve, 15))
            
            // Try to load another file while batch is executing
            const promise2 = loader.load({ filename: 'file2.json' })
            
            const [result1, result2] = await Promise.all([promise1, promise2])
            
            // Both should complete successfully
            expect(result1.toString()).toContain('content')
            expect(result2.toString()).toContain('content')
        })

        test('batch execution flag is cleared after batch completes', async () => {
            const adapter = {
                src: '/test/path',
            }
            
            mockReadFile.mockResolvedValue(Buffer.from('test'))
            
            const loader = new FileContentLoader(adapter)
            
            await loader.load({ filename: 'file1.json' })
            
            // Wait a bit to ensure batch has fully completed
            await new Promise(resolve => setTimeout(resolve, 20))
            
            // Flag should be cleared after batch completes
            expect(loader.isExecutingBatch).toBe(false)
        })

        test('batch execution flag is cleared even if batch fails', async () => {
            const adapter = {
                src: '/test/path',
            }
            
            mockReadFile.mockRejectedValue(new Error('Read failed'))
            
            const loader = new FileContentLoader(adapter)
            
            await expect(loader.load({ filename: 'file1.json' }))
                .rejects.toThrow('Read failed')
            
            // Wait a bit to ensure batch has fully completed
            await new Promise(resolve => setTimeout(resolve, 20))
            
            // Flag should still be cleared after batch fails
            expect(loader.isExecutingBatch).toBe(false)
        })
    })

    describe('error handling', () => {
        beforeEach(() => {
            mockReadFile.mockClear()
        })

        afterEach(() => {
            delete global.fetch
        })

        test('isolates errors per file in batch', async () => {
            const adapter = {
                src: '/test/path',
            }
            
            mockReadFile
                .mockResolvedValueOnce(Buffer.from('success'))
                .mockRejectedValueOnce(new Error('File not found'))
                .mockResolvedValueOnce(Buffer.from('success 2'))
            
            const loader = new FileContentLoader(adapter)
            
            const promise1 = loader.load({ filename: 'file1.json' })
            const promise2 = loader.load({ filename: 'file2.json' })
            const promise3 = loader.load({ filename: 'file3.json' })
            
            const results = await Promise.allSettled([promise1, promise2, promise3])
            
            expect(results[0].status).toBe('fulfilled')
            expect(results[0].value.toString()).toBe('success')
            expect(results[1].status).toBe('rejected')
            expect(results[1].reason.message).toContain('File not found')
            expect(results[2].status).toBe('fulfilled')
            expect(results[2].value.toString()).toBe('success 2')
        })

        test('handles cloud adapter fetch errors', async () => {
            const adapter = {
                acl: {
                    generateUrl: jest.fn(() => 'https://example.com/file.json'),
                },
                folder: 'test-folder',
            }
            
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 404,
            })
            
            const loader = new FileContentLoader(adapter)
            
            await expect(loader.load({ filename: 'test.json' }))
                .rejects.toThrow('Fetch failed with status 404 for file: test.json')
        })

        test('handles invalid URL from generateUrl', async () => {
            const adapter = {
                acl: {
                    generateUrl: jest.fn(() => null),
                },
                folder: 'test-folder',
            }
            
            const loader = new FileContentLoader(adapter)
            
            await expect(loader.load({ filename: 'test.json' }))
                .rejects.toThrow('Invalid URL generated for file: test.json')
        })

        test('handles network errors', async () => {
            const adapter = {
                acl: {
                    generateUrl: jest.fn(() => 'https://example.com/file.json'),
                },
                folder: 'test-folder',
            }
            
            global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
            
            const loader = new FileContentLoader(adapter)
            
            await expect(loader.load({ filename: 'test.json' }))
                .rejects.toThrow('ExternalContent: failed to read file test.json: Network error')
        })
    })

    describe('loadMany', () => {
        beforeEach(() => {
            mockReadFile.mockClear()
        })

        test('loads multiple files', async () => {
            const adapter = {
                src: '/test/path',
            }
            
            mockReadFile
                .mockResolvedValueOnce(Buffer.from('content 1'))
                .mockResolvedValueOnce(Buffer.from('content 2'))
            
            const loader = new FileContentLoader(adapter)
            
            const results = await loader.loadMany([
                { filename: 'file1.json' },
                { filename: 'file2.json' },
            ])
            
            expect(results).toHaveLength(2)
            expect(results[0].toString()).toBe('content 1')
            expect(results[1].toString()).toBe('content 2')
        })
    })
})
