const { EXTERNAL_CONTENT_FIELD_TYPE_META } = require('./constants')

function isPlainObject (value) {
    if (value === null || typeof value !== 'object') return false
    const proto = Object.getPrototypeOf(value)
    return proto === Object.prototype || proto === null
}

/**
 * Checks if a value is an ExternalContent file-meta object.
 *
 * This helper is intended for scripts/tooling (e.g. backfills) and field implementations
 * that need to distinguish between inline JSON values and file-meta references.
 *
 * ExternalContent file-meta objects are identified by the presence of `_externalContentFieldTypeMeta`
 * which contains application-level metadata like the format ('json', 'xml', 'text').
 *
 * @param {unknown} value
 * @param {{ requireNonEmpty?: boolean }} [opts]
 * @returns {boolean}
 */
function isFileMeta (value, opts = {}) {
    if (!isPlainObject(value)) return false

    const { requireNonEmpty = true } = opts

    // Presence of _externalContentFieldTypeMeta indicates this is ExternalContent file metadata
    if (value[EXTERNAL_CONTENT_FIELD_TYPE_META] !== undefined) return true

    const hasValidString = (v) => typeof v === 'string' && (!requireNonEmpty || v.length > 0)

    if (!hasValidString(value.id)) return false
    if (!hasValidString(value.filename)) return false

    // Guard against accidentally treating arbitrary JSON as file-meta:
    // require the object to contain only known file-meta keys.
    const allowedKeys = new Set([
        'id',
        'filename',
        'mimetype',
        'originalFilename',
        'encoding',
        EXTERNAL_CONTENT_FIELD_TYPE_META, // Application-level metadata: format ('json'/'xml'/'text')
        '_meta',            // Provider-specific metadata (e.g., cloud storage response headers, ETags, request IDs)
        'publicUrl',
    ])
    return Object.keys(value).every((key) => allowedKeys.has(key))
}

module.exports = {
    isFileMeta,
}
