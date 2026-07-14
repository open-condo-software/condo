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

function providerSupportsItemsQuery (provider, args = {}) {
    if (!providerSupportsFind(provider, args.where || {})) {
        return false
    }
    if (args.search) {
        return false
    }
    return true
}

function applyItemsQueryToRows (rows, args = {}) {
    let result = [...rows]
    const sortBy = args.sortBy || (args.orderBy ? [args.orderBy] : null)

    if (sortBy?.length) {
        result.sort((left, right) => {
            for (const sortKey of sortBy) {
                const [field, direction = 'ASC'] = sortKey.split('_')
                const leftValue = left?.[field]
                const rightValue = right?.[field]

                if (leftValue === rightValue) continue
                // PostgreSQL default: NULLS LAST for ASC, NULLS FIRST for DESC
                if (leftValue == null) return direction === 'ASC' ? 1 : -1
                if (rightValue == null) return direction === 'ASC' ? -1 : 1
                if (leftValue < rightValue) return direction === 'ASC' ? -1 : 1
                if (leftValue > rightValue) return direction === 'ASC' ? 1 : -1
            }
            return 0
        })
    }

    if (args.skip) {
        result = result.slice(args.skip)
    }
    if (args.first != null) {
        result = result.slice(0, args.first)
    }

    return result
}

module.exports = {
    providerSupportsFind,
    providerSupportsCreate,
    providerSupportsUpdate,
    providerSupportsDelete,
    providerSupportsItemsQuery,
    applyItemsQueryToRows,
}
