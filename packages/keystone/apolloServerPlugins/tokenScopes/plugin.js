/**
 * Apollo Server Plugin for Token Scopes Validation
 * 
 * This plugin validates incoming requests against token scopes
 * to ensure proper authorization based on declarative scope rules.
 */

const { getSchemaCtx } = require('../../schema')
const { extractQueriesAndMutationsFromRequest } = require('../utils/requests')

/** @implements {import('apollo-server-plugin-base').ApolloServerPlugin} */
class ApolloTokenScopesPlugin {
    /** @type {import('@open-keystone/keystone').Keystone} */
    #keystone = null

    /**
     * @param keystone {import('@open-keystone/keystone').Keystone} keystone instance
     * @param opts {Object} plugin options
     */
    constructor (keystone, opts = {}) {
        this.#keystone = keystone
    }

    /**
     * Logs incoming requests for debugging and monitoring
     * @param {Object} requestContext - Apollo request context
     */
    async #logIncomingRequest (requestContext) {
        const { mutations, queries } = extractQueriesAndMutationsFromRequest(requestContext)
        const complexity = requestContext.context.req?.complexity

        const keystone = getSchemaCtx('User').keystone
        
        const item = await keystone._sessionManager._getAuthedItem(requestContext.context.req, keystone)
        if (item) {
            console.log(item)
            // req.user = item
            // req.authedListKey = req.session.keystoneListKey
        }

        // Token meta is stored in session, accessible via authedItem
        const tokenMeta = requestContext?.context?.req?.session?.keystoneSessionMeta
        const tokenScopes = tokenMeta?.scopes

        console.log('[Token Scopes Plugin] Incoming Request:', {
            timestamp: new Date().toISOString(),
            queries: queries.map(q => ({ name: q.name, args: q.args })),
            mutations: mutations.map(m => ({ name: m.name, args: m.args })),
            complexity: complexity ? {
                queries: complexity.queries,
                mutations: complexity.mutations,
                total: complexity.total,
            } : null,
            tokenMeta: tokenMeta || null,
            tokenScopes: tokenScopes || null,
            user: requestContext.context.authedItem?.id || 'anonymous',
        })
    }

    serverWillStart (service) {
        console.log('[Token Scopes Plugin] Server starting with token scopes validation enabled')
    }

    requestDidStart () {
        return {
            didResolveOperation: async (requestContext) => {
                this.#logIncomingRequest(requestContext)
            },

            willSendResponse: (requestContext) => {
                const complexity = requestContext.context.req?.complexity
                if (complexity) {
                    console.log('[Token Scopes Plugin] Request completed:', {
                        timestamp: new Date().toISOString(),
                        complexityUsed: complexity.total,
                        quotaRemaining: complexity.quota?.remaining || null,
                    })
                }
            },
        }
    }
}

module.exports = {
    ApolloTokenScopesPlugin,
}
