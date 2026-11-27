const { PLUGIN_KEY_PREFIX } = require('./constants')

function buildQuotaKey (identityPrefix, identity) {
    return [PLUGIN_KEY_PREFIX, identityPrefix, identity].join(':')
}

function resolveQuotaIdentity ({ isAuthed, userId, ip }) {
    const identityPrefix = isAuthed ? 'user' : 'ip'
    const identifier = isAuthed ? userId : ip

    return {
        isAuthed,
        identityPrefix,
        identifier,
        key: buildQuotaKey(identityPrefix, identifier),
    }
}

function resolveAllowedQuota ({ isAuthed, identifier, authedQuota, nonAuthedQuota, customQuotas = {} }) {
    if (Object.prototype.hasOwnProperty.call(customQuotas, identifier)) {
        return customQuotas[identifier]
    }

    return isAuthed ? authedQuota : nonAuthedQuota
}

function extractQuotaKeyFromRequest (requestContext) {
    const isAuthed = Boolean(requestContext.context.authedItem)
    const userId = isAuthed ? requestContext.context.authedItem.id : null
    const ip = requestContext.context.req.ip
    const { key, identifier } = resolveQuotaIdentity({ isAuthed, userId, ip })

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
    resolveQuotaIdentity,
    resolveAllowedQuota,
    addComplexity,
    buildQuotaKey,
}
