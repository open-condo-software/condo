const { Readable } = require('stream')

const { Implementation } = require('@open-keystone/fields')
const cuid = require('cuid')

const { ExternalContent } = require('@open-condo/keystone/fieldsUtils')
const { getLogger } = require('@open-condo/keystone/logging')


const { FILE_META_TYPE, isFileMeta, resolveExternalContentValue } = ExternalContent
const logger = getLogger('ExternalContent')

const DEFAULT_FORMAT = 'json'
const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024 // Default max size: 10MB
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
        // For admin interface, return ExternalContentFile type with metadata fields
        // For API requests, the resolver will return the full content
        return [`${this.path}: ExternalContentFile`]
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

    // Admin
    extendAdminMeta (meta) {
        return {
            graphQLAdminFragment: this.graphQLAdminFragment,
            ...meta,
        }
    }

    /**
     * Resolves the field value for GraphQL output.
     * 
     * For admin interface requests: returns file metadata with publicUrl without loading content.
     * This avoids expensive file I/O operations when browsing models in admin UI.
     * 
     * For API requests: delegates to resolveExternalContentValue utility which handles:
     * - Backward compatibility with inline JSON objects
     * - File-meta object resolution with DataLoader batching
     * - Graceful handling of missing files
     * 
     * @returns {Object} Field resolver mapping
     */
    gqlOutputFieldResolvers () {
        return {
            [this.path]: async (item, args, context) => {
                const value = item?.[this.path]
                
                // Parse value if it's a JSON string (from database storage)
                let parsedValue = value
                if (typeof value === 'string') {
                    try {
                        parsedValue = JSON.parse(value)
                    } catch (err) {
                        // If parsing fails, return as-is (backward compatibility)
                        parsedValue = value
                    }
                }
                
                // For admin interface, return file metadata with publicUrl without loading content
                // Admin context is detected via authedItem.isAdmin (from Keystone authentication)
                const user = context?.authedItem || context?.req?.user || null
                const isAdminUser = user?.isAdmin === true
                
                if (isAdminUser) {
                    if (isFileMeta(parsedValue)) {
                        const publicUrl = this.adapter.publicUrl(parsedValue)
                        return {
                            id: parsedValue.id,
                            filename: parsedValue.filename,
                            originalFilename: parsedValue.originalFilename,
                            publicUrl,
                            mimetype: parsedValue.mimetype,
                        }
                    }
                    return parsedValue
                }
                
                // For API requests, load and resolve the full content
                try {
                    return await resolveExternalContentValue(value, {
                        adapter: this.adapter,
                        deserialize: this.deserialize,
                        context,
                        batchDelayMs: this.batchDelayMs,
                        fieldPath: this.path,
                        item,
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

