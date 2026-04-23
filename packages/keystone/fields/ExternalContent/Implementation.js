const { randomUUID } = require('node:crypto')
const { Readable } = require('node:stream')

const { Implementation } = require('@open-keystone/fields')

const { ExternalContent } = require('@open-condo/keystone/fieldsUtils')
const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger()

const { EXTERNAL_CONTENT_FIELD_TYPE_META, DEFAULT_PROCESSORS, isFileMeta, resolveExternalContentValue } = ExternalContent

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
    constructor (path, options = {}, meta = {}) {
        const {
            adapter,
            format = 'json',
            processors = {},
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
        if (adapter.constructor.name === 'NoFileAdapter' || adapter.error?.message?.includes('NoFileAdapter')) {
            throw new Error(`ExternalContent: adapter is not properly configured for ${path}. Check FILE_FIELD_ADAPTER and storage configuration.`)
        }

        super(path, options, meta)

        this.config.format ??= 'json'
        this.config.maxSizeBytes ??= DEFAULT_MAX_SIZE_BYTES

        this.adapter = adapter
        this.graphQLInputType = cfg.graphQLInputType
        this.graphQLReturnType = cfg.graphQLReturnType
        this.mimetype = cfg.mimetype
        this.fileExt = cfg.fileExt
        this.formatProcessors = byFormat
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
            ...meta,
            graphQLAdminFragment: this.config.graphQLAdminFragment || '',
            format: this.config.format,
            processors: this.formatProcessors,
            adminConfig: this.adminConfig || {},
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
        return {
            // Virtual field for deserialized content (for API clients)
            [`${this.path}Resolved`]: async (item, args, context) => {
                const value = item?.[this.path]

                try {
                    return await resolveExternalContentValue(value, {
                        adapter: this.adapter,
                        formatProcessors: this.formatProcessors,
                        context,
                        batchDelayMs: this.config.batchDelayMs,
                    })
                } catch (err) {
                    const itemId = item?.id || 'unknown'
                    logger.warn({
                        msg: 'Error resolving ExternalContent field',
                        entity: this.listKey,
                        entityId: itemId,
                        err,
                        data: { path: this.path },
                    })
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
        if (sizeBytes > this.config.maxSizeBytes) {
            const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2)
            const maxMB = (this.config.maxSizeBytes / 1024 / 1024).toFixed(2)
            throw new Error(`ExternalContent: payload size (${sizeMB}MB) exceeds maximum allowed size (${maxMB}MB) for field ${this.path}`)
        }
    }

    /**
     * Resolves input data before saving to database.
     * 
     * Handles file lifecycle:
     * 1. If setting to null: returns null (old file deleted in afterChange)
     * 2. If setting new value: saves new file to storage, returns file-meta (old file deleted in afterChange)
     * 
     * Known limitation: If adapter.save() succeeds but the DB write fails, the new file will be
     * orphaned in storage. This is acceptable — old file is never deleted until afterChange confirms
     * the DB write succeeded.
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

        if (nextValue === undefined || nextValue === null) return nextValue

        const processor = this.formatProcessors[this.config.format]
        const payload = processor.serialize(nextValue)
        const payloadSizeBytes = Buffer.byteLength(String(payload), 'utf-8')

        this._validatePayloadSize(payloadSizeBytes)

        const stream = Readable.from([Buffer.from(String(payload), 'utf-8')])

        const prefix = listKey || 'item'
        const id = randomUUID()
        const originalFilename = `${prefix}_${this.path}_${id}.${this.fileExt}`

        // Save minimal metadata for OBSFilesMiddleware to identify and authorize access
        // id is not available yet (generated by DB), will be set in afterChange
        const fileMeta = {
            listkey: listKey,
            mimetype: this.mimetype,
        }

        const saved = await this.adapter.save({
            stream,
            filename: originalFilename,
            mimetype: this.mimetype,
            encoding: 'utf-8',
            id,
            meta: fileMeta,
        })

        // Generate publicUrl using adapter's method
        // This ensures consistent URL generation with other file fields
        // For cloud adapters, this returns middleware URL (not direct signed URL) so links don't expire
        const publicUrl = this.adapter.publicUrl({
            filename: originalFilename,
            originalFilename,
            id,
            meta: fileMeta,
        })

        return { ...saved, publicUrl, [EXTERNAL_CONTENT_FIELD_TYPE_META]: { format: this.config.format } }
    }

    /**
     * Deletes the old file after DB write succeeds.
     * 
     * Called by Keystone after the item is saved to the database.
     * Deleting here ensures the old file is only removed
     * once the new value is durably committed — preventing data loss on DB failure.
     * 
     * @param {Object} params
     * @param {Object} params.existingItem - Item state before the update
     * @param {Object} params.updatedItem - Item state after the update
     */
    async afterChange ({ existingItem, updatedItem, listKey }) {
        const parseDbValue = (v) => {
            if (typeof v !== 'string') return v
            try { return JSON.parse(v) } catch { return null }
        }

        const prevValue = parseDbValue(existingItem?.[this.path])
        const nextValue = parseDbValue(updatedItem?.[this.path])

        // Update file metadata with actual item id for new files
        // This allows OBSFilesMiddleware to verify access control
        const prevFilename = isFileMeta(prevValue) ? prevValue.filename : null
        const nextFilename = isFileMeta(nextValue) ? nextValue.filename : null
        if (nextFilename && prevFilename !== nextFilename && this.adapter.acl?.setMeta) {
            try {
                const folder = this.adapter.folder || ''
                await this.adapter.acl.setMeta(`${folder}/${nextFilename}`, {
                    listkey: listKey,
                    id: updatedItem.id,
                    mimetype: this.mimetype,
                })
            } catch (err) {
                logger.warn({ msg: 'Failed to update file metadata with item id', err, data: { nextValue, itemId: updatedItem.id } })
            }
        }

        if (!isFileMeta(prevValue)) return

        // Old file should be deleted if field was cleared or replaced with a new file
        if (prevFilename === nextFilename) return

        try {
            await this.adapter.delete(prevValue)
        } catch (err) {
            logger.warn({ msg: 'Failed to delete old file after change', err, data: { prevValue } })
        }
    }
}

module.exports = {
    ExternalContentImplementation,
    DEFAULT_PROCESSORS,
}

