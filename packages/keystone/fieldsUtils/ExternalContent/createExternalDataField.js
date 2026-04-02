/**
 * Factory function to create ExternalContent field configuration.
 * Creates a consistent ExternalContent field configuration.
 * 
 * @param {Object} options - Field configuration options
 * @param {Object} options.adapter - File adapter (required)
 * @param {string} [options.format='json'] - Data format ('json' or 'text')
 * @param {Object} [options.processors={}] - Data processors
 * @param {number} [options.maxSizeBytes] - Maximum payload size in bytes
 * @param {number} [options.batchDelay] - Batch delay in milliseconds (default: 10)
 * @param {Object} [options.otherProps] - Additional Keystone field properties (schemaDoc, sensitive, isRequired, etc.)
 * @returns {Object} Field configuration object
 * 
 * @example
 * const myField = createExternalDataField({
 *   adapter: myFileAdapter,
 *   format: 'json',
 *   maxSizeBytes: 50 * 1024 * 1024, // 50MB
 *   batchDelayMs: 10, // 10ms batch delay
 *   schemaDoc: 'Field description',
 *   sensitive: true,
 *   isRequired: false,
 * })
 */
function createExternalDataField ({ adapter, format = 'json', processors = {}, maxSizeBytes, batchDelayMs, schemaDoc, ...otherProps }) {
    if (!adapter) {
        throw new Error('createExternalDataField: adapter is required')
    }
    
    if (maxSizeBytes !== undefined && (typeof maxSizeBytes !== 'number' || maxSizeBytes <= 0)) {
        throw new Error('createExternalDataField: maxSizeBytes must be a positive number')
    }
    
    if (batchDelayMs !== undefined && (typeof batchDelayMs !== 'number' || batchDelayMs < 0)) {
        throw new Error('createExternalDataField: batchDelay must be a non-negative number')
    }
    
    const config = {
        ...otherProps,
        type: 'ExternalContent',
        adapter,
        format,
        processors,
        graphQLAdminFragment: '',  // Prevent 'undefined' in admin UI queries (JsonController adds this to query)
        schemaDoc: schemaDoc || `External content field storing ${format} data in files`,
    }
    
    // Only include maxSizeBytes if explicitly provided
    if (maxSizeBytes !== undefined) {
        config.maxSizeBytes = maxSizeBytes
    }
    
    // Only include batchDelay if explicitly provided
    if (batchDelayMs !== undefined) {
        config.batchDelayMs = batchDelayMs
    }
    
    return config
}

module.exports = {
    createExternalDataField,
}
