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
 * @param {unknown} value
 * @param {{ requireNonEmpty?: boolean }} [opts]
 * @returns {boolean}
 */
function isFileMeta (value, opts = {}) {
    const requireNonEmpty = opts.requireNonEmpty !== false

    if (!isPlainObject(value)) return false

    const id = value.id
    const filename = value.filename

    if (typeof id !== 'string' || typeof filename !== 'string') return false
    if (!requireNonEmpty) return true

    return id.length > 0 && filename.length > 0
}

/**
 * Factory function to create ExternalContent field configuration.
 * Ensures consistency and prevents accidental misconfigurations.
 * 
 * @param {Object} options - Field options
 * @param {Object} options.adapter - FileAdapter instance
 * @param {string} [options.format='json'] - Data format (json, xml, text)
 * @param {Object} [options.processors] - Custom serialization/deserialization functions
 * @param {number} [options.maxSizeBytes] - Maximum size in bytes (default: 10MB)
 * @returns {Object} Field configuration object
 * 
 * @example
 * const MY_DATA_FIELD = createExternalDataField({
 *   adapter: myFileAdapter,
 *   format: 'json',
 *   maxSizeBytes: 50 * 1024 * 1024, // 50MB
 * })
 */
function createExternalDataField ({ adapter, format = 'json', processors = {}, maxSizeBytes }) {
    const config = {
        type: 'ExternalContent',
        adapter,
        format,
        processors,
    }
    
    // Only include maxSizeBytes if explicitly provided
    if (maxSizeBytes !== undefined) {
        config.maxSizeBytes = maxSizeBytes
    }
    
    return config
}

module.exports = {
    createExternalDataField,
    isFileMeta,
}

