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
 * Public factory for creating ExternalContent-based fields.
 *
 * Usage example:
 *
 *   const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')
 *   const { createExternalDataField } = require('@open-condo/keystone/utils/externalContentFieldType')
 *
 *   const adapter = new FileAdapter('someFolder')
 *   const RAW_FIELD = createExternalDataField({
 *       adapter,
 *       format: 'json',
 *       sensitive: true,
 *       isRequired: false,
 *   })
 *
 * @param {{ adapter: any, format?: string } & Record<string, any>} [opts]
 * @returns {Record<string, any>}
 */
function createExternalDataField ({
    adapter,
    format = 'json',
    // prevent passing a different field type accidentally (e.g. from spreading Json field config)
    type: _ignoredType,
    ...rest
} = {}) {
    return {
        ...rest,
        type: 'ExternalContent',
        adapter,
        format,
    }
}

module.exports = {
    createExternalDataField,
    isFileMeta,
}

