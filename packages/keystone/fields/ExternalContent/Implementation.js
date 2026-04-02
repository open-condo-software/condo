const { readFile } = require('fs/promises')
const { Readable } = require('stream')

const { Implementation } = require('@open-keystone/fields')
const cuid = require('cuid')

const { getLogger } = require('@open-condo/keystone/logging')
const { FILE_META_TYPE, isFileMeta } = require('@open-condo/keystone/utils/externalContentFieldType')

const { FileContentLoader } = require('./FileContentLoader')
const { validateFilePath } = require('./utils')

const logger = getLogger('ExternalContent')

// WeakMap to store unique loader keys per adapter instance
// This prevents loader key collisions when multiple adapters have the same folder name
const adapterLoaderKeys = new WeakMap()

const DEFAULT_FORMAT = 'json'
// Default max size: 10MB
const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024

const DEFAULT_PROCESSORS = {
    json: {
        graphQLInputType: 'JSON',
        graphQLReturnType: 'JSON',
        serialize: (value) => JSON.stringify(value ?? null),
        deserialize: (raw) => (raw.length === 0 ? null : (() => {
            try {
                return JSON.parse(raw)
            } catch (err) {
                throw new Error(`Failed to parse JSON content: ${err.message}`)
            }
        })()),
        mimetype: 'application/json',
        fileExt: 'json',
    },
    xml: {
        graphQLInputType: 'String',
        graphQLReturnType: 'String',
        serialize: (value) => (value == null ? '' : String(value)),
        deserialize: (raw) => (raw.length === 0 ? null : raw),
        mimetype: 'application/xml',
        fileExt: 'xml',
    },
    text: {
        graphQLInputType: 'String',
        graphQLReturnType: 'String',
        serialize: (value) => (value == null ? '' : String(value)),
        deserialize: (raw) => (raw.length === 0 ? null : raw),
        mimetype: 'text/plain',
        fileExt: 'txt',
    },
}

/**
 * Reads file contents for ExternalContent field from the provided adapter.
 *
 * Why not just `fetch(file.publicUrl)`?
 * - `publicUrl()` often returns an indirect URL like `/api/files/...` served by our app.
 * - Those endpoints frequently require authentication (cookie / Authorization / signature).
 * - Field resolvers do not have a browser session and should not depend on request-specific auth.
 *
 * Therefore:
 * - For cloud adapters we use `adapter.acl.generateUrl(...)` to get a short-lived signed *direct* URL
 *   (S3/OBS), and fetch bytes from it without cookies.
 * - For local adapter we read from filesystem directly via `adapter.src`.
 *
 * @param {*} adapter File adapter instance passed into field config
 * @param {{ filename: string, mimetype?: string, originalFilename?: string }} fileMeta Stored file-meta object
 * @returns {Promise<Buffer>}
 */
async function readFromAdapter (adapter, fileMeta) {
    const filename = fileMeta.filename

    // Local adapter (from `packages/keystone/fileAdapter/fileAdapter.js`)
    if (typeof adapter?.src === 'string') {
        const fullPath = validateFilePath(adapter.src, filename)
        return Buffer.from(await readFile(fullPath))
    }

    // Cloud adapters provide acl.generateUrl which returns a signed, time-limited direct URL.
    // It does not require auth cookies (unlike indirect /api/files/... urls from publicUrl()).
    if (adapter?.acl && typeof adapter.acl.generateUrl === 'function' && adapter.folder) {
        const directUrl = adapter.acl.generateUrl({
            filename: `${adapter.folder}/${filename}`,
            mimetype: fileMeta.mimetype,
            originalFilename: fileMeta.originalFilename,
        })
        
        if (!directUrl || typeof directUrl !== 'string') {
            throw new Error(`Invalid URL generated for file: ${filename}`)
        }
        
        const res = await fetch(directUrl)
        if (!res.ok) {
            throw new Error(`Fetch failed with status ${res.status} for file: ${filename}`)
        }
        const buf = Buffer.from(await res.arrayBuffer())
        return buf
    }

    throw new Error('ExternalContent: unsupported file adapter for read')
}

/**
 * Get or create a FileContentLoader for the given adapter.
 * 
 * Implements lazy initialization: creates loader on first access and reuses it for subsequent calls.
 * Each adapter instance gets its own unique loader (keyed by adapter instance via WeakMap).
 * 
 * @param {Object} context - GraphQL context object
 * @param {Object} adapter - File adapter instance
 * @param {number} [batchDelayMs] - Time window in milliseconds to collect requests before executing batch
 * @returns {FileContentLoader} Loader instance for this adapter
 */
function getOrCreateLoader (context, adapter, batchDelayMs) {
    // Initialize loaders map if not exists
    if (!context._externalContentLoaders) {
        context._externalContentLoaders = new Map()
    }
    
    // Use adapter instance as key via WeakMap to prevent collisions
    // This ensures different adapter instances get different loaders even if they have the same folder
    if (!adapterLoaderKeys.has(adapter)) {
        adapterLoaderKeys.set(adapter, Symbol('loader'))
    }
    const loaderKey = adapterLoaderKeys.get(adapter)
    
    // Return existing loader or create new one
    if (!context._externalContentLoaders.has(loaderKey)) {
        const options = batchDelayMs !== undefined ? { batchDelayMs } : undefined
        context._externalContentLoaders.set(loaderKey, new FileContentLoader(adapter, options))
    }
    
    return context._externalContentLoaders.get(loaderKey)
}

class ExternalContentImplementation extends Implementation {
    constructor (path, {
        adapter,
        format = DEFAULT_FORMAT,
        processors = {},
        maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
        batchDelayMs,
        graphQLInputType,
        graphQLReturnType,
        serialize,
        deserialize,
        mimetype,
        fileExt,
        schemaDoc,
        graphQLAdminFragment = '',
    } = {}, meta) {
        // Compute processor config
        const byFormat = { ...DEFAULT_PROCESSORS, ...processors }
        const cfg = byFormat[format]
        if (!cfg) {
            throw new Error(`ExternalContent: unknown format "${format}" for ${path}`)
        }

        // Resolve final values using defaults from processor config
        const finalGraphQLInputType = graphQLInputType || cfg.graphQLInputType
        const finalGraphQLReturnType = graphQLReturnType || cfg.graphQLReturnType
        const finalSerialize = serialize || cfg.serialize
        const finalDeserialize = deserialize || cfg.deserialize
        const finalMimetype = mimetype || cfg.mimetype
        const finalFileExt = fileExt || cfg.fileExt

        if (!adapter) {
            throw new Error(`ExternalContent: "adapter" is required for ${path}`)
        }

        // Validate adapter is properly configured (not NoFileAdapter)
        if (adapter.constructor.name === 'NoFileAdapter' || (adapter.error && adapter.error.message && adapter.error.message.includes('NoFileAdapter'))) {
            throw new Error(`ExternalContent: adapter is not properly configured for ${path}. Check FILE_FIELD_ADAPTER and storage configuration.`)
        }

        // Pass resolved values to parent class (don't spread arguments[1] to avoid passing undefined graphQLReturnType)
        super(path, {
            adapter,
            format,
            processors,
            maxSizeBytes,
            batchDelayMs,
            graphQLInputType: finalGraphQLInputType,
            graphQLReturnType: finalGraphQLReturnType,
            serialize: finalSerialize,
            deserialize: finalDeserialize,
            mimetype: finalMimetype,
            fileExt: finalFileExt,
            schemaDoc,
            graphQLAdminFragment,
        }, meta)

        this.adapter = adapter
        this.format = format
        this.maxSizeBytes = maxSizeBytes
        this.batchDelayMs = batchDelayMs
        this.serialize = finalSerialize
        this.deserialize = finalDeserialize
        this.graphQLInputType = finalGraphQLInputType
        this.graphQLReturnType = finalGraphQLReturnType
        this.mimetype = finalMimetype
        this.fileExt = finalFileExt
        this.graphQLAdminFragment = graphQLAdminFragment
    }

    // GQL Output
    gqlOutputFields () {
        return [`${this.path}: ${this.graphQLReturnType}`]
    }

    // Admin
    extendAdminMeta (meta) {
        return {
            graphQLAdminFragment: this.graphQLAdminFragment,
            ...meta,
        }
    }

    /**
     * Resolves the field value for GraphQL output by reading the file content from storage.
     * 
     * For backward compatibility, returns inline JSON objects directly if they don't have file-meta structure.
     * For file-meta objects, fetches the file content and deserializes it.
     * 
     * Performance optimization:
     * - Uses DataLoader for batching and caching when context is available (GraphQL queries)
     * - Batches multiple file reads into single operation (10ms window)
     * - Caches results within request to prevent duplicate reads
     * - Falls back to direct readFromAdapter for non-GraphQL usage
     * 
     * Note: This reads the entire file into memory. For very large files (10MB+), this could cause
     * memory pressure under load. Current use case (BillingReceipt.raw) typically has files <1MB.
     * 
     * @returns {Object} Field resolver mapping
     */
    gqlOutputFieldResolvers () {
        return {
            [this.path]: async (item, args, context) => {
                let value = item?.[this.path]
                if (value === null || typeof value === 'undefined') return value

                // Parse JSON string if needed (database stores serialized JSON)
                if (typeof value === 'string') {
                    try {
                        value = JSON.parse(value)
                    } catch (err) {
                        // If parsing fails, return the string as-is (backward compatibility)
                        return value
                    }
                }

                // Backward compatibility: old `Json` field stored raw object directly in DB
                if (!isFileMeta(value)) return value

                // Use DataLoader for batching and caching when context is available
                let buf
                try {
                    if (context) {
                        const loader = getOrCreateLoader(context, this.adapter, this.batchDelayMs)
                        buf = await loader.load(value)
                    } else {
                        // Fallback to direct read for non-GraphQL usage (tests, scripts, etc.)
                        buf = await readFromAdapter(this.adapter, value)
                    }
                } catch (err) {
                    // Handle missing files gracefully - return null instead of crashing
                    if (err.code === 'ENOENT') {
                        const itemId = item?.id || 'unknown'
                        logger.warn({ msg: 'File not found for ExternalContent field', field: this.path, itemId, filename: value?.filename || 'unknown' })
                        return null
                    }
                    throw err
                }
                
                // Handle null buffer from FileContentLoader (missing file)
                if (buf === null) {
                    return null
                }
                
                try {
                    const raw = buf.toString('utf-8')
                    return this.deserialize(raw)
                } catch (err) {
                    const itemId = item?.id || 'unknown'
                    const errMsg = err?.message || String(err)
                    throw new Error(`Failed to deserialize ${this.path} for item ${itemId}: ${errMsg}`)
                }
            },
        }
    }

    // GQL Input
    /**
     * Returns query input fields for filtering.
     * We store only file references in DB, so querying by content is not supported.
     * 
     * @returns {Array} Empty array - no query filters available
     */
    gqlQueryInputFields () {
        return []
    }

    /**
     * Returns GraphQL input fields for update mutations.
     * 
     * @returns {Array<string>} Field definitions for GraphQL schema
     */
    gqlUpdateInputFields () {
        return [`${this.path}: ${this.graphQLInputType}`]
    }

    /**
     * Returns GraphQL input fields for create mutations.
     * 
     * @returns {Array<string>} Field definitions for GraphQL schema
     */
    gqlCreateInputFields () {
        return [`${this.path}: ${this.graphQLInputType}`]
    }

    // Hooks
    /**
     * Validates payload size against configured maximum.
     * 
     * @private
     * @param {number} sizeBytes - Size in bytes to validate
     * @throws {Error} If size exceeds maxSizeBytes
     */
    _validatePayloadSize (sizeBytes) {
        if (sizeBytes > this.maxSizeBytes) {
            const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2)
            const maxMB = (this.maxSizeBytes / 1024 / 1024).toFixed(2)
            throw new Error(`ExternalContent: payload size (${sizeMB}MB) exceeds maximum allowed size (${maxMB}MB) for field ${this.path}`)
        }
    }

    /**
     * Resolves input data before saving to database.
     * 
     * Handles file lifecycle:
     * 1. If setting to null: deletes old file (if exists)
     * 2. If setting new value: saves new file, then deletes old file
     * 
     * Save-before-delete pattern prevents data loss if save() fails.
     * 
     * Known limitation: If database update fails after save() succeeds but before transaction commits,
     * the new file will be orphaned in storage while the old file reference remains in DB.
     * This is an acceptable trade-off vs losing the previous file.
     * 
     * Potential mitigation strategies for future implementation:
     * 1. Transaction hooks: Use Keystone afterChange hooks to delete orphaned files on transaction rollback
     * 2. Background cleanup job: Periodic scan for files not referenced in database
     * 3. Two-phase commit: Implement compensation logic to rollback file save on DB failure
     * 4. Reference counting: Track file references and delete when count reaches zero
     * 
     * Current impact: Low - orphaned files accumulate slowly and only on transaction failures.
     * Storage cost is typically negligible compared to preventing data loss.
     * 
     * @param {Object} params
     * @param {Object} params.resolvedData - New field values
     * @param {Object} params.existingItem - Current item from database
     * @param {string} params.listKey - Name of the list/model
     * @returns {Promise<Object|null|undefined>} File-meta object to store in DB
     */
    async resolveInput ({ resolvedData, existingItem, listKey }) {
        const nextValue = resolvedData[this.path]

        if (typeof nextValue === 'undefined') return undefined

        const prevValue = existingItem?.[this.path]
        const prevLooksLikeFile = isFileMeta(prevValue)

        if (nextValue === null) {
            if (prevLooksLikeFile && prevValue) {
                try {
                    await this.adapter.delete(prevValue)
                } catch (err) {
                    // Ignore delete errors to prevent blocking the update.
                    // File will remain orphaned in storage but DB will be updated correctly.
                    logger.debug({ msg: 'Failed to delete old file', err, data: { filename: prevValue.filename } })
                }
            }
            return null
        }

        // Save first, then delete old file.
        // This prevents losing the previous file if save() fails.
        
        const payload = this.serialize(nextValue)
        const payloadSizeBytes = Buffer.byteLength(String(payload), 'utf-8')
        
        // Validate size limit after serialization
        this._validatePayloadSize(payloadSizeBytes)
        
        const stream = Readable.from([Buffer.from(String(payload), 'utf-8')])

        const prefix = listKey || 'item'
        const id = cuid()
        // Include record ID in filename for uniqueness and consistency with backfill script.
        // Note: FileAdapter with saveFileName=false will generate actual unique filename.
        const originalFilename = `${prefix}_${this.path}_${id}.${this.fileExt}`
        const saved = await this.adapter.save({
            stream,
            filename: originalFilename,
            mimetype: this.mimetype,
            encoding: 'utf-8',
            id,
            meta: { format: this.format },
        })

        if (prevLooksLikeFile && prevValue) {
            try {
                await this.adapter.delete(prevValue)
            } catch (err) {
                // Ignore delete errors. New file is already saved, so update can proceed.
                // Old file will remain orphaned in storage.
                logger.debug({ msg: 'Failed to delete old file after save', err, data: { filename: prevValue.filename } })
            }
        }

        // Add _type marker for better file-meta detection
        return { ...saved, _type: FILE_META_TYPE }
    }
}

module.exports = {
    ExternalContentImplementation,
}

