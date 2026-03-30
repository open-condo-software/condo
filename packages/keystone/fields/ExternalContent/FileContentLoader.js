const { readFile } = require('fs/promises')
const path = require('path')

/**
 * Custom DataLoader for batching and caching file content reads.
 * 
 * Solves the N+1 query problem when fetching ExternalContent fields in GraphQL list queries.
 * 
 * Features:
 * - Batching: Collects multiple file read requests over a 10ms window and executes them together
 * - Caching: Request-scoped cache prevents duplicate reads within same GraphQL query
 * - Error isolation: One file failure doesn't break the entire batch
 * 
 * Performance:
 * - Before: 100 items = 100 separate file reads
 * - After: 100 items = 1 batched operation + cache hits for duplicates
 * 
 * @example
 * const loader = new FileContentLoader(fileAdapter)
 * const buffer1 = await loader.load({ filename: 'file1.json' })
 * const buffer2 = await loader.load({ filename: 'file1.json' }) // Returns cached result
 */
class FileContentLoader {
    constructor (adapter) {
        this.adapter = adapter
        
        // Request-scoped cache: filename -> Promise<Buffer>
        this.cache = new Map()
        
        // Batch queue: array of { fileMeta, resolve, reject }
        this.queue = []
        
        // Batch timer
        this.batchTimer = null
        
        // Batch delay in milliseconds (one event loop tick)
        this.batchDelay = 10
        
        // Track if batch is currently executing to prevent race conditions
        this.isExecutingBatch = false
    }

    /**
     * Load a single file's content.
     * 
     * @param {Object} fileMeta - File metadata object with filename, mimetype, originalFilename
     * @returns {Promise<Buffer>} File content as Buffer
     */
    async load (fileMeta) {
        const cacheKey = this._getCacheKey(fileMeta)
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)
        }
        
        // If batch is currently executing, wait for it to complete then retry
        // This prevents race condition where promise is cached but item isn't in batch
        if (this.isExecutingBatch) {
            await new Promise(resolve => setTimeout(resolve, this.batchDelay + 5))
            return this.load(fileMeta)
        }
        
        // Create promise for this request
        const promise = new Promise((resolve, reject) => {
            this.queue.push({ fileMeta, resolve, reject })
            
            // Schedule batch execution if not already scheduled
            if (!this.batchTimer) {
                this.batchTimer = setTimeout(() => {
                    this._executeBatch()
                }, this.batchDelay)
            }
        })
        
        // Cache the promise (not just the result)
        this.cache.set(cacheKey, promise)
        
        return promise
    }

    /**
     * Load multiple files' content.
     * 
     * @param {Array<Object>} fileMetas - Array of file metadata objects
     * @returns {Promise<Array<Buffer>>} Array of file contents as Buffers
     */
    async loadMany (fileMetas) {
        return Promise.all(fileMetas.map(meta => this.load(meta)))
    }

    /**
     * Generate cache key from file metadata.
     * 
     * @private
     * @param {Object} fileMeta - File metadata
     * @returns {string} Cache key
     */
    _getCacheKey (fileMeta) {
        // Use filename as cache key (unique per file)
        return fileMeta.filename
    }

    /**
     * Execute batched file reads.
     * 
     * @private
     */
    async _executeBatch () {
        // Set execution flag to prevent race conditions
        this.isExecutingBatch = true
        
        // Clear timer
        this.batchTimer = null
        
        // Get current queue and reset for next batch
        const batch = this.queue.slice()
        this.queue = []
        
        if (batch.length === 0) {
            this.isExecutingBatch = false
            return
        }
        
        try {
            // Determine adapter type
            const isLocalAdapter = typeof this.adapter?.src === 'string'
            
            if (isLocalAdapter) {
                await this._executeBatchLocal(batch)
            } else {
                await this._executeBatchCloud(batch)
            }
        } finally {
            // Always clear execution flag, even if batch fails
            this.isExecutingBatch = false
        }
    }

    /**
     * Execute batch for local file adapter.
     * 
     * @private
     * @param {Array} batch - Batch of requests
     */
    async _executeBatchLocal (batch) {
        // Read all files in parallel
        const promises = batch.map(async ({ fileMeta, resolve, reject }) => {
            try {
                // Prevent path traversal attacks - check for absolute paths first
                if (path.isAbsolute(fileMeta.filename)) {
                    reject(new Error(`Invalid filename: path traversal detected in ${fileMeta.filename}`))
                    return
                }
                
                const fullPath = path.join(this.adapter.src, fileMeta.filename)
                const normalized = path.normalize(fullPath)
                const basePath = path.normalize(this.adapter.src)
                
                // Check if normalized path starts with base path followed by separator or equals base path
                if (!normalized.startsWith(basePath + path.sep) && normalized !== basePath) {
                    reject(new Error(`Invalid filename: path traversal detected in ${fileMeta.filename}`))
                    return
                }
                
                const buffer = Buffer.from(await readFile(fullPath))
                resolve(buffer)
            } catch (err) {
                reject(err)
            }
        })
        
        await Promise.allSettled(promises)
    }

    /**
     * Execute batch for cloud file adapter (S3, OBS).
     * 
     * @private
     * @param {Array} batch - Batch of requests
     */
    async _executeBatchCloud (batch) {
        // Fetch all files in parallel
        const promises = batch.map(async ({ fileMeta, resolve, reject }) => {
            try {
                const directUrl = this.adapter.acl.generateUrl({
                    filename: `${this.adapter.folder}/${fileMeta.filename}`,
                    mimetype: fileMeta.mimetype,
                    originalFilename: fileMeta.originalFilename,
                })
                
                if (!directUrl || typeof directUrl !== 'string') {
                    throw new Error(`Invalid URL generated for file: ${fileMeta.filename}`)
                }
                
                const res = await fetch(directUrl)
                if (!res.ok) {
                    throw new Error(`Fetch failed with status ${res.status} for file: ${fileMeta.filename}`)
                }
                
                const buffer = Buffer.from(await res.arrayBuffer())
                resolve(buffer)
            } catch (err) {
                reject(new Error(`ExternalContent: failed to read file ${fileMeta.filename}: ${err.message}`))
            }
        })
        
        await Promise.allSettled(promises)
    }
}

module.exports = {
    FileContentLoader,
}
