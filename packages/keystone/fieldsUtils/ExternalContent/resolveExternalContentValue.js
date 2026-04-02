const { getOrCreateLoader } = require('./getOrCreateLoader')
const { isFileMeta } = require('./isFileMeta')
const { readFromAdapter } = require('./readFromAdapter')

/**
 * Resolves ExternalContent field value by reading file content from storage if needed.
 * 
 * For backward compatibility, returns inline JSON objects directly if they don't have file-meta structure.
 * For file-meta objects, fetches the file content and deserializes it.
 * 
 * This utility is designed for use in:
 * 1. Field type resolvers (gqlOutputFieldResolvers)
 * 2. Scripts and utilities that load data via find() without GraphQL processing
 * 
 * Performance notes:
 * - When context is available (GraphQL queries), uses DataLoader for batching and caching
 * - Falls back to direct adapter read for non-GraphQL usage (scripts, utilities)
 * - Reads entire file into memory (suitable for typical use cases <1MB)
 * 
 * @param {unknown} value - The field value from database (could be inline JSON or file-meta)
 * @param {Object} options - Resolution options
 * @param {Object} options.adapter - File adapter instance (required)
 * @param {Function} options.deserialize - Deserialization function (required)
 * @param {Object} [options.context] - GraphQL context for DataLoader batching (optional)
 * @param {number} [options.batchDelayMs] - Batch delay for DataLoader (optional)
 * @param {string} [options.fieldPath] - Field path for error messages (optional)
 * @param {Object} [options.item] - Item object for error context (optional)
 * @returns {Promise<unknown>} Resolved field value or null if file not found
 * @throws {Error} If file read or deserialization fails (except for missing files)
 */
async function resolveExternalContentValue (value, {
    adapter,
    deserialize,
    context,
    batchDelayMs,
    fieldPath = 'field',
    item = {},
} = {}) {
    if (!adapter) {
        throw new Error('resolveExternalContentValue: adapter is required')
    }
    if (!deserialize) {
        throw new Error('resolveExternalContentValue: deserialize is required')
    }

    if (value === null || typeof value === 'undefined') return value

    // Parse JSON string if needed (database stores serialized JSON)
    let parsedValue = value
    if (typeof value === 'string') {
        try {
            parsedValue = JSON.parse(value)
        } catch (err) {
            // If parsing fails, return the string as-is (backward compatibility)
            return value
        }
    }

    // Backward compatibility: old `Json` field stored raw object directly in DB
    if (!isFileMeta(parsedValue)) return parsedValue

    // Use DataLoader for batching and caching when context is available
    let buf
    try {
        if (context) {
            const loader = getOrCreateLoader(context, adapter, batchDelayMs)
            buf = await loader.load(parsedValue)
        } else {
            // Fallback to direct read for non-GraphQL usage (tests, scripts, etc.)
            buf = await readFromAdapter(adapter, parsedValue)
        }
    } catch (err) {
        // Handle missing files gracefully - return null instead of crashing
        if (err.code === 'ENOENT') {
            // Note: logging would require importing logger, skipping for now
            // to keep this utility lightweight
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
        return deserialize(raw)
    } catch (err) {
        const itemId = item?.id || 'unknown'
        const errMsg = err?.message || String(err)
        throw new Error(`Failed to deserialize ${fieldPath} for item ${itemId}: ${errMsg}`)
    }
}

module.exports = {
    resolveExternalContentValue,
}
