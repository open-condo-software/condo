const isPlainObject = require('lodash/isPlainObject')

/**
 * INTERNAL helper: checks if a value looks like a keystone file-meta object
 * produced by file adapters.
 *
 * This function is intended for use by field implementations and tooling.
 * Apps should normally not rely on the exact file-meta shape.
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

module.exports = {
    isFileMeta,
}

