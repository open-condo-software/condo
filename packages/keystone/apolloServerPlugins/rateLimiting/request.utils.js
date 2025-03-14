const { PLUGIN_KEY_PREFIX } = require('./constants')

function buildQuotaKey (identityPrefix, identity) {
    return [PLUGIN_KEY_PREFIX, identityPrefix, identity].join(':')
}

function extractQuotaKeyFromRequest (requestContext) {
    const isAuthed = Boolean(requestContext.context.authedItem)
    const identifier = isAuthed ? requestContext.context.authedItem.id : requestContext.context.req.ip
    const identityPrefix = isAuthed ? 'user' : 'ip'
    const key = buildQuotaKey(identityPrefix, identifier)

    return { isAuthed, key, identifier }
}

function addComplexity (existingComplexity, newComplexity) {
    if (!existingComplexity) {
        return newComplexity
    }

    return {
        ...existingComplexity,
        details: {
            queries: [...existingComplexity.details.queries, ...newComplexity.details.queries],
            mutations: [...existingComplexity.details.mutations, ...newComplexity.details.mutations],
        },
        queries: existingComplexity.queries + newComplexity.queries,
        mutations: existingComplexity.mutations + newComplexity.mutations,
        total: existingComplexity.total + newComplexity.total,
    }
}

module.exports = {
    extractQuotaKeyFromRequest,
    addComplexity,
    buildQuotaKey,
}
