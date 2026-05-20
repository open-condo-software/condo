/**
 * Apollo Server Plugin for Token Scopes Validation
 *
 * This plugin validates incoming requests against token scopes
 * to ensure proper authorization based on declarative scope rules.
 */

const { GQLError } = require('../../errors')
const { extractQueriesAndMutationsFromRequest } = require('../utils/requests')

/**
 * @deprecated This is an experimental module - use at your own risk
 * @implements {import('apollo-server-plugin-base').ApolloServerPlugin}
 */
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

    async #processIncomingRequest (requestContext) {
        const { mutations, queries } = extractQueriesAndMutationsFromRequest(requestContext)

        // Token meta is stored in session, accessible via authedItem
        const tokenMeta = requestContext?.context?.req?.session?.keystoneSessionMeta
        const tokenScopes = tokenMeta?._scopes

        // If no token scopes are provided - request will continue as is
        if (!tokenScopes) {
            return
        }

        if (!Array.isArray(tokenScopes)) {
            throw new GQLError({
                code: 'INTERNAL_ERROR',
                type: 'INTERNAL_ERROR',
                message: 'Request is rejected because current session scopes are misconfigured',
            }, requestContext.context)
        }

        const operations = [
            ...mutations.map(m => ({ type: 'mutation', name: m.name })),
            ...queries.map(q => ({ type: 'query', name: q.name })),
        ]

        // Validate each operation against the token scopes
        for (const op of operations) {
            let allowed = false

            for (const scope of tokenScopes) {
                const scopeType = scope.gqlOperationType || scope.gqlOperationName
                if (!scopeType) continue
                if (scopeType !== op.type) continue

                const allowedNames = scope.gqlOperationNames
                if (!allowedNames || allowedNames.length === 0) {
                    allowed = true
                    break
                }

                if (allowedNames.includes(op.name)) {
                    allowed = true
                    break
                }
            }

            if (!allowed) {
                throw new GQLError({
                    code: 'FORBIDDEN',
                    type: 'FORBIDDEN',
                    message: 'Request is rejected because it contains queries or mutations, not allowed for current session scopes',
                }, requestContext.context)
            }
        }
    }

    requestDidStart () {
        return {
            didResolveOperation: async (requestContext) => {
                await this.#processIncomingRequest(requestContext)
            },
        }
    }
}

module.exports = {
    ApolloTokenScopesPlugin,
}
