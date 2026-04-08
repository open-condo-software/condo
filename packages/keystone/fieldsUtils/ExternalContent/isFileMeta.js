const { FILE_META_TYPE } = require('./constants')

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
    if (value._type !== undefined && value._type !== FILE_META_TYPE) return false

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
        'publicUrl',
    ])
    return Object.keys(value).every((key) => allowedKeys.has(key))
}

module.exports = {
    isFileMeta,
}
