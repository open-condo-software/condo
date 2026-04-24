const { isFileMeta } = require('@open-condo/keystone/fieldsUtils/ExternalContent/isFileMeta')

/**
 * Parses ExternalContent field value and determines if it's file metadata or legacy content.
 * 
 * @param {string|object} value - The field value from the database
 * @returns {{ fileMeta: object, isFileMetadata: boolean }} Parsed metadata and detection flag
 */
function classifyObject (obj) {
    if (isFileMeta(obj)) {
        return { fileMeta: obj, isFileMetadata: true }
    }
    return { fileMeta: { legacyContent: JSON.stringify(obj, null, 2) }, isFileMetadata: false }
}

function parseExternalContentValue (value) {
    try {
        if (typeof value === 'string') {
            return classifyObject(value ? JSON.parse(value) : {})
        } else if (value && typeof value === 'object') {
            return classifyObject(value)
        }
    } catch (err) {
        // If parsing fails, it's legacy XML/text content stored directly
        return { fileMeta: { legacyContent: value }, isFileMetadata: false }
    }

    return { fileMeta: {}, isFileMetadata: false }
}

module.exports = {
    parseExternalContentValue,
}
