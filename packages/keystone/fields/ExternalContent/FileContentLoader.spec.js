const { FileContentLoader } = require('./FileContentLoader')

describe('FileContentLoader', () => {
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
})
