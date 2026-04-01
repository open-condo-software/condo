// WARNING: Changing this value requires database migration!
// All existing file-meta objects in the database have _type set to this value.
// If you change it, you must migrate all existing records to use the new value.
const FILE_META_TYPE = 'ExternalContent.file-meta'

function isPlainObject (value) {
    if (value === null || typeof value !== 'object') return false
    const proto = Object.getPrototypeOf(value)
    return proto === Object.prototype || proto === null
}

/**
 * Checks if a value looks like a keystone file-meta object produced by file adapters.
 *
 * This helper is intended for scripts/tooling (e.g. backfills) and field implementations
 * that need to distinguish between inline JSON values and file-meta references.
 *
 * File-meta objects always have `id` and `filename` properties.
 *
 * We accept both shapes:
 * - `{ _type: FILE_META_TYPE, id, filename, ... }` (preferred)
 * - `{ id, filename, ... }` (also accepted for compatibility)
 *
 * @param {unknown} value
 * @param {{ requireNonEmpty?: boolean }} [opts]
 * @returns {boolean}
 */
function isFileMeta (value, opts = {}) {
    if (!isPlainObject(value)) return false

    const { requireNonEmpty = true } = opts

    // If _type is present it must match
    if (typeof value._type !== 'undefined' && value._type !== FILE_META_TYPE) return false

    const hasValidString = (v) => typeof v === 'string' && (!requireNonEmpty || v.length > 0)

    if (!hasValidString(value.id)) return false
    if (!hasValidString(value.filename)) return false

    // Guard against accidentally treating arbitrary JSON as file-meta:
    // require the object to contain only known file-meta keys.
    const allowedKeys = new Set([
        '_type',
        'id',
        'filename',
        'mimetype',
        'originalFilename',
        'encoding',
        'meta',
    ])
    return Object.keys(value).every((key) => allowedKeys.has(key))
}

/**
 * Factory function to create ExternalContent field configuration.
 * Creates a consistent ExternalContent field configuration.
 * 
 * @param {Object} options - Field configuration options
 * @param {Object} options.adapter - File adapter (required)
 * @param {string} [options.format='json'] - Data format ('json' or 'text')
 * @param {Object} [options.processors={}] - Data processors
 * @param {number} [options.maxSizeBytes] - Maximum payload size in bytes
 * @param {number} [options.batchDelay] - Batch delay in milliseconds (default: 10)
 * @param {Object} [options.otherProps] - Additional Keystone field properties (schemaDoc, sensitive, isRequired, etc.)
 * @returns {Object} Field configuration object
 * 
 * @example
 * const myField = createExternalDataField({
 *   adapter: myFileAdapter,
 *   format: 'json',
 *   maxSizeBytes: 50 * 1024 * 1024, // 50MB
 *   batchDelayMs: 10, // 10ms batch delay
 *   schemaDoc: 'Field description',
 *   sensitive: true,
 *   isRequired: false,
 * })
 */
function createExternalDataField ({ adapter, format = 'json', processors = {}, maxSizeBytes, batchDelayMs, ...otherProps }) {
    if (!adapter) {
        throw new Error('createExternalDataField: adapter is required')
    }
    
    if (maxSizeBytes !== undefined && (typeof maxSizeBytes !== 'number' || maxSizeBytes <= 0)) {
        throw new Error('createExternalDataField: maxSizeBytes must be a positive number')
    }
    
    if (batchDelayMs !== undefined && (typeof batchDelayMs !== 'number' || batchDelayMs < 0)) {
        throw new Error('createExternalDataField: batchDelay must be a non-negative number')
    }
    
    const config = {
        ...otherProps,
        type: 'ExternalContent',
        adapter,
        format,
        processors,
    }
    
    // Only include maxSizeBytes if explicitly provided
    if (maxSizeBytes !== undefined) {
        config.maxSizeBytes = maxSizeBytes
    }
    
    // Only include batchDelay if explicitly provided
    if (batchDelayMs !== undefined) {
        config.batchDelayMs = batchDelayMs
    }
    
    return config
}

module.exports = {
    FILE_META_TYPE,
    createExternalDataField,
    isFileMeta,
}

