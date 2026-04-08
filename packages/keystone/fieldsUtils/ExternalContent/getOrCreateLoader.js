const { FileContentLoader } = require('./FileContentLoader')

// WeakMap to store unique loader keys per adapter instance
// This prevents loader key collisions when multiple adapters have the same folder name
const adapterLoaderKeys = new WeakMap()

/**
 * Get or create a FileContentLoader for the given adapter.
 * 
 * Implements lazy initialization: creates loader on first access and reuses it for subsequent calls.
 * Each adapter instance gets its own unique loader (keyed by adapter instance via WeakMap).
 * 
 * @param {Object} context - GraphQL context object
 * @param {Object} adapter - File adapter instance
 * @param {number} [batchDelayMs] - Time window in milliseconds to collect requests before executing batch
 * @returns {FileContentLoader} Loader instance for this adapter
 */
function getOrCreateLoader (context, adapter, batchDelayMs) {
    // Initialize loaders map if not exists
    if (!context._externalContentLoaders) {
        context._externalContentLoaders = new Map()
    }
    
    // Use adapter instance as key via WeakMap to prevent collisions
    // This ensures different adapter instances get different loaders even if they have the same folder
    if (!adapterLoaderKeys.has(adapter)) {
        adapterLoaderKeys.set(adapter, Symbol('loader'))
    }
    const loaderKey = adapterLoaderKeys.get(adapter)
    
    // Return existing loader or create new one
    if (!context._externalContentLoaders.has(loaderKey)) {
        const options = batchDelayMs === undefined ? undefined : { batchDelayMs }
        context._externalContentLoaders.set(loaderKey, new FileContentLoader(adapter, options))
    }
    
    return context._externalContentLoaders.get(loaderKey)
}

module.exports = {
    getOrCreateLoader,
}
