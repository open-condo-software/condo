const { readFile } = require('node:fs/promises')

const { fetch } = require('@open-condo/keystone/fetch')
const { getLogger } = require('@open-condo/keystone/logging')

const {  validateFilePath } = require('./validateFilePath')


const logger = getLogger('FileContentLoader')

// Default batch delay: 10ms
const DEFAULT_BATCH_DELAY_MS = 10

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
    constructor (adapter, options = {}) {
        this.adapter = adapter
        
        // Request-scoped cache: filename -> Promise<Buffer>
        this.cache = new Map()
        
        // Pending promises map to prevent race conditions: filename -> Promise
        this.pending = new Map()
        
        // Batch queue: array of { fileMeta, resolve, reject }
        this.queue = []
        
        // Batch timer
        this.batchTimer = null
        
        // Flag to prevent race condition in batch scheduling
        this._schedulingBatch = false
        
        // Batch delay in milliseconds (one event loop tick)
        // Can be set to 0 for immediate execution
        this.batchDelayMs = options.batchDelayMs ?? DEFAULT_BATCH_DELAY_MS
        
        // Promise that resolves when current batch completes (for synchronization)
        this.batchCompletionPromise = null
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
        
        // Check if there's already a pending promise for this file
        // This prevents race condition where multiple concurrent requests
        // for the same file create duplicate queue entries
        if (this.pending.has(cacheKey)) {
            return this.pending.get(cacheKey)
        }
        
        // Create promise for this request
        const promise = new Promise((resolve, reject) => {
            this.queue.push({ fileMeta, resolve, reject })
            
            // Schedule batch execution if not already scheduled
            // Use flag to prevent race condition between check and set
            if (!this.batchTimer && !this._schedulingBatch) {
                this._schedulingBatch = true
                if (this.batchDelayMs === 0) {
                    // Use setImmediate for immediate execution
                    this.batchTimer = setImmediate(() => {
                        this._schedulingBatch = false
                        this._executeBatch()
                    })
                } else {
                    this.batchTimer = setTimeout(() => {
                        this._schedulingBatch = false
                        this._executeBatch()
                    }, this.batchDelayMs)
                }
            }
        })
        
        // Store in both pending and cache immediately to prevent duplicates
        this.pending.set(cacheKey, promise)
        this.cache.set(cacheKey, promise)
        
        // Clean up pending map after promise settles
        // Remove from cache on rejection to allow retry of transient errors
        promise.catch(() => {
            this.cache.delete(cacheKey)
        }).finally(() => {
            this.pending.delete(cacheKey)
        })
        
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
     * Clear the cache.
     * 
     * Useful for long-running contexts (e.g., subscriptions, background jobs)
     * where the cache should be explicitly cleared to free memory.
     * 
     * Note: In typical GraphQL request contexts, the cache is automatically
     * garbage collected when the context is destroyed, so explicit clearing
     * is usually not necessary.
     */
    clear () {
        this.cache.clear()
        this.pending.clear()
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
        // Create completion promise for synchronization
        this.batchCompletionPromise = (async () => {
            // Clear timer
            this.batchTimer = null
            
            // Get current queue and reset for next batch
            const batch = this.queue.slice()
            this.queue = []
            
            if (batch.length === 0) {
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
            } catch (err) {
                // Reject all pending promises on batch failure
                batch.forEach(({ reject }) => {
                    reject(new Error(`Batch execution failed: ${err.message}`))
                })
                throw err
            } finally {
                // Batch processing complete
            }
        })()
        
        try {
            await this.batchCompletionPromise
        } finally {
            // Always clear promise, even if batch fails
            this.batchCompletionPromise = null
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
                const fullPath = validateFilePath(this.adapter.src, fileMeta.filename)
                const buffer = Buffer.from(await readFile(fullPath))
                resolve(buffer)
            } catch (err) {
                // Handle missing files gracefully - resolve with null instead of rejecting
                if (err.code === 'ENOENT') {
                    logger.warn({ msg: 'File not found in FileContentLoader', filename: fileMeta.filename })
                    resolve(null)
                } else {
                    const error = err instanceof Error ? err : new Error(String(err))
                    error.message = `ExternalContent: failed to read local file ${fileMeta.filename}: ${error.message}`
                    reject(error)
                }
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
                
                const res = await fetch(directUrl, {
                    abortRequestTimeout: 30000, // 30 second timeout
                    skipTracingHeaders: true,
                    skipXTargetHeader: true,
                })
                if (!res.ok) {
                    // Handle 404 like local adapter - resolve with null instead of rejecting
                    if (res.status === 404) {
                        logger.warn({ msg: 'File not found in cloud storage', filename: fileMeta.filename })
                        resolve(null)
                        return
                    }
                    throw new Error(`Fetch failed with status ${res.status} for file: ${fileMeta.filename}`)
                }
                
                const buffer = Buffer.from(await res.arrayBuffer())
                resolve(buffer)
            } catch (err) {
                const error = err instanceof Error ? err : new Error(String(err))
                error.message = `ExternalContent: failed to read file ${fileMeta.filename}: ${error.message}`
                reject(error)
            }
        })
        
        await Promise.allSettled(promises)
    }
}

module.exports = { FileContentLoader }
