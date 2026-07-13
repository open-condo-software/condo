/**
 * Whether a provider should handle a find/itemsQuery for the given condition.
 * Providers with optional `matchFind` only delegate when it returns true.
 */
function providerSupportsFind (provider, condition = {}) {
    if (typeof provider?.find !== 'function') {
        return false
    }
    if (typeof provider.matchFind === 'function') {
        return provider.matchFind({ condition })
    }
    return true
}

function providerSupportsCreate (provider) {
    return typeof provider?.create === 'function'
}

function providerSupportsUpdate (provider) {
    return typeof provider?.update === 'function'
}

function providerSupportsDelete (provider) {
    return typeof provider?.delete === 'function'
}

module.exports = {
    providerSupportsFind,
    providerSupportsCreate,
    providerSupportsUpdate,
    providerSupportsDelete,
}
