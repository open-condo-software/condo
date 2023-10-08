const { get, isEmpty, escapeRegExp } = require('lodash')
const { checkSync } = require('recheck')

const { MESSAGE_META } = require('@condo/domains/notification/constants/constants')
const { WRONG_MESSAGE_TYPE_PROVIDED_ERROR } = require('@condo/domains/notification/constants/errors')

/**
 * Fills payload using data according to message meta settings by selected notification type.
 * Can handle nested paths if provided.
 * @param messageType MESSAGE_META key
 * @param data { key:value, ...}
 * @param nestedPath ['String', ...]
 * @returns {*}
 */
const fillDataByMessageTypeMeta = (messageType, data, nestedPath = []) => {
    const typeMeta = get(MESSAGE_META, messageType)

    if (!typeMeta) throw new Error(`${WRONG_MESSAGE_TYPE_PROVIDED_ERROR}: ${messageType}`)

    const metaKeys = Object.keys(isEmpty(nestedPath) ? typeMeta : get(typeMeta, nestedPath, {}))
    const result = {}

    for (const fieldKey of metaKeys) {
        const value = get(data, fieldKey)

        if (value) result[fieldKey] = value
    }

    return result
}

/**
 * Renders url from template by replacing {key} instances by data[key] values.
 * If data[key] value is empty-ish, then key will be replaced by ''
 * @param templateString
 * @param data
 * @returns {*}
 */
const renderTemplateString = (templateString, data) => {
    const keys = Object.keys(data)
    let result = `${templateString}`

    for (const key of keys) {
        const flags = 'gmi'
        const reDoSCheck = checkSync(key, flags)

        if (reDoSCheck.status !== 'vulnerable') {
            const pattern = `{${escapeRegExp(key)}}`
            // ReDos injection checked in code above
            // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
            const keyRegexp = new RegExp(pattern, flags)
            result = result.replace(keyRegexp, data[key] || '')
        }
    }

    return result
}

/**
 * Hydrates all meta item values with extraData and all other meta item values via renderTemplateString.
 * This operation fills all template parts that exist within meta fields like url template, etc.
 * Automatically removes 'Template' suffix from names. Ex.: xxxTemplate -> xxx
 * @param meta
 * @param extraData
 */
const hydrateItems = (meta, extraData) => {
    const data = { ...meta, ...extraData }
    const metaKeys = Object.keys(meta)
    const result = {}

    for (const rawKey of metaKeys) {
        const key = rawKey.replace('Template', '')

        result[key] = renderTemplateString(meta[rawKey], data)
    }

    return result
}

module.exports = {
    fillDataByMessageTypeMeta,
    renderTemplateString,
    hydrateItems,
}