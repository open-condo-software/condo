/**
 * Factory function to create ExternalContent field configuration.
 * Creates a consistent ExternalContent field configuration.
 * 
 * @typedef {import('./defaultProcessors').ExternalContentProcessor} ExternalContentProcessor
 * 
 * @typedef {Object} ExternalContentFieldConfig
 * @property {Object} adapter - File adapter (required)
 * @property {string} [format='json'] - Data format ('json', 'xml', or 'text')
 * @property {Object.<string, ExternalContentProcessor>} [processors={}] - Custom data processors by format
 * @property {number} [maxSizeBytes] - Maximum payload size in bytes
 * @property {number} [batchDelayMs] - Batch delay in milliseconds (default: 10)
 * @property {string} [schemaDoc] - Field description for schema documentation
 * @property {boolean} [sensitive] - Mark field as sensitive for audit logging
 * @property {boolean} [isRequired] - Whether the field is required
 * @property {boolean} [isAdminUIReadOnly=true] - Whether the field is read-only in admin UI (default: true)
 * 
 * @param {ExternalContentFieldConfig} options - Field configuration options
 * @returns {Object} Field configuration object
 * 
 * @example
 * const myField = createExternalDataField({
 *   adapter: myFileAdapter,
 *   format: 'json',
 *   maxSizeBytes: 10 * 1024 * 1024, // 10MB
 *   batchDelayMs: 10, // 10ms batch delay
 *   schemaDoc: 'Field description',
 *   sensitive: true,
 *   isRequired: false,
 * })
 */
function createExternalDataField ({ adapter, format = 'json', processors = {}, maxSizeBytes, batchDelayMs, isAdminUIReadOnly = true, ...otherProps }) {
    if (!adapter) {
        throw new Error('createExternalDataField: adapter is required')
    }
    
    if (maxSizeBytes !== undefined && (typeof maxSizeBytes !== 'number' || maxSizeBytes <= 0)) {
        throw new Error('createExternalDataField: maxSizeBytes must be a positive number')
    }
    
    if (batchDelayMs !== undefined && (typeof batchDelayMs !== 'number' || batchDelayMs < 0)) {
        throw new Error('createExternalDataField: batchDelay must be a non-negative number')
    }
    
    return {
        schemaDoc: `External content field storing ${format} data in external files`,
        ...otherProps,
        type: 'ExternalContent',
        adapter,
        format,
        processors,
        maxSizeBytes,
        batchDelayMs,
        adminConfig: {
            isReadOnly: isAdminUIReadOnly,
        },
    }
}

module.exports = {
    createExternalDataField,
}
