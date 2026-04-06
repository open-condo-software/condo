/**
 * @typedef {Object} ExternalContentProcessor
 * @property {string} graphQLInputType - GraphQL input type (e.g., 'JSON', 'String')
 * @property {string} graphQLReturnType - GraphQL return type (e.g., 'JSON', 'String')
 * @property {Function} serialize - Function to serialize value to string for storage
 * @property {Function} deserialize - Function to deserialize string from storage back to value
 * @property {string} mimetype - MIME type for the file (e.g., 'application/json', 'application/xml')
 * @property {string} fileExt - File extension without dot (e.g., 'json', 'xml', 'txt')
 */

/**
 * Default processors for common ExternalContent formats.
 * 
 * @type {Record<string, ExternalContentProcessor>}
 */
const DEFAULT_PROCESSORS = {
    json: {
        graphQLInputType: 'JSON',
        graphQLReturnType: 'JSON',
        serialize: (value) => JSON.stringify(value ?? null),
        deserialize: (raw) => (raw.length === 0 ? null : (() => {
            try {
                return JSON.parse(raw)
            } catch (err) {
                throw new Error(`Failed to parse JSON content: ${err.message}`)
            }
        })()),
        mimetype: 'application/json',
        fileExt: 'json',
    },
    xml: {
        graphQLInputType: 'String',
        graphQLReturnType: 'String',
        serialize: (value) => (value == null ? '' : String(value)),
        deserialize: (raw) => (raw.length === 0 ? null : raw),
        mimetype: 'application/xml',
        fileExt: 'xml',
    },
    text: {
        graphQLInputType: 'String',
        graphQLReturnType: 'String',
        serialize: (value) => (value == null ? '' : String(value)),
        deserialize: (raw) => (raw.length === 0 ? null : raw),
        mimetype: 'text/plain',
        fileExt: 'txt',
    },
}

module.exports = {
    DEFAULT_PROCESSORS,
}
