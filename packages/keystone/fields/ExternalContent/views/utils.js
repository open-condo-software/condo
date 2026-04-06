const { isFileMeta } = require('@open-condo/keystone/fieldsUtils/ExternalContent/isFileMeta')

/**
 * Parses ExternalContent field value and determines if it's file metadata or legacy content.
 * 
 * @param {string|object} value - The field value from the database
 * @returns {{ fileMeta: object, isFileMetadata: boolean }} Parsed metadata and detection flag
 */
function parseExternalContentValue (value) {
    let fileMeta = {}
    let isFileMetadata = false
    
    try {
        if (typeof value === 'string') {
            const parsed = value ? JSON.parse(value) : {}
            // Check if it's file metadata or legacy JSON
            if (isFileMeta(parsed)) {
                fileMeta = parsed
                isFileMetadata = true
            } else {
                // Legacy JSON object - display as string
                fileMeta = { legacyContent: JSON.stringify(parsed, null, 2) }
            }
        } else if (value && typeof value === 'object') {
            // Already parsed object - check if it's file metadata
            if (isFileMeta(value)) {
                fileMeta = value
                isFileMetadata = true
            } else {
                // Legacy JSON object - display as string
                fileMeta = { legacyContent: JSON.stringify(value, null, 2) }
            }
        }
    } catch (err) {
        // If parsing fails, it's legacy XML/text content stored directly
        // Display the actual content
        fileMeta = { legacyContent: value }
    }

    return { fileMeta, isFileMetadata }
}

module.exports = {
    parseExternalContentValue,
}
