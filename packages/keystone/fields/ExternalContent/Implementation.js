const { randomUUID } = require('crypto')
const { Readable } = require('stream')

const { Implementation } = require('@open-keystone/fields')

const { ExternalContent } = require('@open-condo/keystone/fieldsUtils')
const logger = require('@open-condo/keystone/logging')

const { FILE_META_TYPE, DEFAULT_PROCESSORS, isFileMeta } = ExternalContent

const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024 // Default max size: 10MB

/**
 * ExternalContent field implementation for Keystone.
 * 
 * Stores large data externally in files rather than directly in the database.
 * Provides transparent access to file content through GraphQL with DataLoader batching.
 * 
 * @typedef {import('@open-condo/keystone/fieldsUtils/ExternalContent/defaultProcessors').ExternalContentProcessor} ExternalContentProcessor
 * 
 * @extends {import('@keystonejs/fields').Implementation}
 */
class ExternalContentImplementation extends Implementation {
    /**
     * Creates an ExternalContent field implementation.
     * 
     * @param {string} path - Field path (e.g., 'raw', 'metadata')
     * @param {Object} options - Configuration options
     * @param {Object} options.adapter - File adapter instance (required)
     * @param {string} [options.format='json'] - Data format ('json', 'xml', or 'text')
     * @param {Object.<string, ExternalContentProcessor>} [options.processors={}] - Custom format processors
     * @param {number} [options.maxSizeBytes=10485760] - Maximum payload size in bytes (default: 10MB)
     * @param {number} [options.batchDelayMs] - DataLoader batch delay in milliseconds
     * @param {string} [options.schemaDoc] - Field description for schema
     * @param {string} [options.graphQLAdminFragment=''] - GraphQL fragment for admin UI
     * @param {Object} [meta] - Keystone field metadata
     * 
     * @throws {Error} If adapter is not provided
     * @throws {Error} If format is unknown
     * @throws {Error} If adapter is not properly configured
     */
    constructor (path, options = {}, meta) {
        const {
            adapter,
            format = 'json',
            processors = {},
            maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
            batchDelayMs,
            graphQLAdminFragment,
            adminConfig,
        } = options
        
        // Compute processor config
        const byFormat = { ...DEFAULT_PROCESSORS, ...processors }
        const cfg = byFormat[format]
        if (!cfg) {
            throw new Error(`ExternalContent: unknown format "${format}" for ${path}`)
        }

        if (!adapter) {
            throw new Error(`ExternalContent: "adapter" is required for ${path}`)
        }

        // Validate adapter is properly configured (not NoFileAdapter)
        if (adapter.constructor.name === 'NoFileAdapter' || (adapter.error && adapter.error.message && adapter.error.message.includes('NoFileAdapter'))) {
            throw new Error(`ExternalContent: adapter is not properly configured for ${path}. Check FILE_FIELD_ADAPTER and storage configuration.`)
        }

        // Pass resolved values to parent class
        super(path, {
            ...options,
            format,
            processors,
            graphQLInputType: cfg.graphQLInputType,
            graphQLReturnType: cfg.graphQLReturnType,
            mimetype: cfg.mimetype,
            fileExt: cfg.fileExt,
        }, meta)

        this.adapter = adapter
        this.format = format
        this.maxSizeBytes = maxSizeBytes
        this.batchDelayMs = batchDelayMs
        this.graphQLInputType = cfg.graphQLInputType
        this.graphQLReturnType = cfg.graphQLReturnType
        this.mimetype = cfg.mimetype
        this.fileExt = cfg.fileExt
        // Admin UI should query raw database value (file metadata) not deserialized content
        this.graphQLAdminFragment = graphQLAdminFragment || ''
        this.formatProcessors = byFormat
        this.adminConfig = adminConfig || {}
    }

    /**
     * Defines GraphQL auxiliary types for the field.
     * For admin interface, returns a File-like type with metadata fields.
     * 
     * @returns {Array<string>} GraphQL type definitions
     */
    getGqlAuxTypes () {
        return [`
      type ExternalContentFile {
        id: ID
        filename: String
        originalFilename: String
        mimetype: String
        publicUrl: String
      }
    `]
    }

    // GQL Output
    gqlOutputFields () {
        // Return both raw metadata field and virtual deserialized content field
        return [
            `${this.path}: String`,  // Raw file metadata (JSON string) for admin UI
            `${this.path}Resolved: ${this.graphQLReturnType}`,  // Deserialized content for API clients
        ]
    }

    // Admin
    extendAdminMeta (meta) {
        return {
            graphQLAdminFragment: this.graphQLAdminFragment,
            format: this.format,
            processors: this.formatProcessors,
            adminConfig: this.adminConfig,
            ...meta,
        }
    }

    /**
     * Provides both raw file metadata and deserialized content via GraphQL.
     * 
     * - `fieldName` - Returns raw file metadata (JSON string from DB) for admin UI
     * - `fieldNameResolved` - Virtual field that returns deserialized content for API clients
     * 
     * @returns {Object} Field resolver mapping
     */
    gqlOutputFieldResolvers () {
        const { resolveExternalContentValue } = require('@open-condo/keystone/fieldsUtils/ExternalContent/resolveExternalContentValue')
        
        return {
            // Virtual field for deserialized content (for API clients)
            [`${this.path}Resolved`]: async (item, args, context) => {
                const value = item?.[this.path]

                try {
                    return await resolveExternalContentValue(value, {
                        adapter: this.adapter,
                        formatProcessors: this.formatProcessors,
                        context,
                        batchDelayMs: this.batchDelayMs,
                    })
                } catch (err) {
                    const itemId = item?.id || 'unknown'
                    logger.warn({ msg: 'Error resolving ExternalContent field', field: this.path, itemId, err })
                    throw err
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
     * @param {Object} [params.context] - Keystone context (used for authed user when generating public URLs)
     * @returns {Promise<Object|null|undefined>} File-meta object to store in DB
     */
    async resolveInput ({ resolvedData, existingItem, listKey, context }) {
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

        const processor = this.formatProcessors[this.format]
        const payload = processor.serialize(nextValue)
        const payloadSizeBytes = Buffer.byteLength(String(payload), 'utf-8')

        // Validate size limit after serialization
        this._validatePayloadSize(payloadSizeBytes)

        const stream = Readable.from([Buffer.from(String(payload), 'utf-8')])

        const prefix = listKey || 'item'
        const id = randomUUID()
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

        // Generate publicUrl using adapter's publicUrl method
        const publicUrl = this.adapter.publicUrl(saved, context?.authedItem)

        // Add _type marker and ensure meta.format is included for deserialization
        return { ...saved, publicUrl, meta: { format: this.format }, _type: FILE_META_TYPE }
    }
}

module.exports = {
    ExternalContentImplementation,
    DEFAULT_PROCESSORS,
}

