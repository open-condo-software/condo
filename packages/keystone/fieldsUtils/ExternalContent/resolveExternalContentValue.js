const { getObjectStream, readFileFromStream } = require('@open-condo/keystone/file/utils')

const { DEFAULT_PROCESSORS } = require('./defaultProcessors')
const { getOrCreateLoader } = require('./getOrCreateLoader')
const { isFileMeta } = require('./isFileMeta')

/**
 * Resolves ExternalContent field value by reading file content from storage if needed.
 * 
 * For backward compatibility, returns inline JSON objects directly if they don't have file-meta structure.
 * For file-meta objects (identified by `_externalContentFieldTypeMeta`), fetches the file content
 * and deserializes it using the format stored in `_externalContentFieldTypeMeta.format`.
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
 * @param {Object} [options.formatProcessors] - Custom format processors (optional, uses defaults for json/xml/text)
 * @param {Object} [options.context] - GraphQL context for DataLoader batching (optional)
 * @param {number} [options.batchDelayMs] - Batch delay for DataLoader (optional)
 * @returns {Promise<unknown>} Resolved field value or null if file not found
 * @throws {Error} If file read or deserialization fails (except for missing files)
 */
async function resolveExternalContentValue (value, {
    adapter,
    formatProcessors,
    context,
    batchDelayMs,
} = {}) {
    if (!adapter) {
        throw new Error('resolveExternalContentValue: adapter is required')
    }
    
    // Merge custom processors with defaults
    const processors = { ...DEFAULT_PROCESSORS, ...formatProcessors }

    if (value === null || value === undefined) return value

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
            const stream = await getObjectStream(parsedValue, adapter)
            buf = await readFileFromStream(stream)
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
        
        // Get format from file metadata (stored in _externalContent.format by ExternalContent field)
        const format = parsedValue?._externalContentFieldTypeMeta?.format

        // If format is missing, return raw content as-is (legacy files without format metadata)
        if (!format) {
            return raw
        }
        
        if (!processors[format]) {
            throw new Error(`Unknown format in file metadata: ${format}`)
        }
        
        return processors[format].deserialize(raw)
    } catch (err) {
        const errMsg = err?.message || String(err)
        throw new Error(`Failed to deserialize ExternalContent value: ${errMsg}`)
    }
}

module.exports = {
    resolveExternalContentValue,
}
