/**
 * Apollo Server Plugin for Token Scopes Validation
 *
 * This plugin validates incoming requests against token scopes
 * to ensure proper authorization based on declarative scope rules.
 */

const { z } = require('zod')

const { GQLError, GQLErrorCode: { FORBIDDEN, INTERNAL_ERROR  } } = require('@open-condo/keystone/errors')

const { extractQueriesAndMutationsFromRequest } = require('../utils/requests')

const tokenScopeSchema = z.object({
    gqlOperationType: z.enum(['query', 'mutation']),
    gqlOperationNames: z.array(z.string()).optional(),
})

const tokenScopesSchema = z.union([
    z.undefined(),
    z.array(tokenScopeSchema),
])

/**
 * // TODO: DOMA-13291 make scoped tokens more secure -> remove deprecation
 * @deprecated This is an experimental module - use at your own risk
 * @implements {import('apollo-server-plugin-base').ApolloServerPlugin}
 */
class ApolloTokenScopesPlugin {
    /** @type {import('@open-keystone/keystone').Keystone} */
    #keystone = null

    /**
     * @param keystone {import('@open-keystone/keystone').Keystone} keystone instance
     */
    constructor (keystone) {
        this.#keystone = keystone
    }

    async #processIncomingRequest (requestContext) {
        const { mutations, queries } = extractQueriesAndMutationsFromRequest(requestContext)

        // Token meta is stored in session, accessible via authedItem
        const tokenMeta = requestContext?.context?.req?.session?.keystoneSessionMeta
        const tokenScopes = tokenMeta?._scopes

        try {
            tokenScopesSchema.parse(tokenScopes)
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new GQLError({
                    code: INTERNAL_ERROR,
                    type: INTERNAL_ERROR,
                    message: 'Request is rejected because current session scopes are misconfigured',
                    messageForUser: 'api.global.tokenScopes.INTERNAL_ERROR',
                }, requestContext.context)
            }
            throw error
        }

        // If no token scopes are provided - request will continue as is
        if (!tokenScopes) {
            return
        }

        const operations = [
            ...mutations.map(m => ({ type: 'mutation', name: m.name })),
            ...queries.map(q => ({ type: 'query', name: q.name })),
        ]

        // Validate each operation against every token scope
        for (const op of operations) {
            let allowed = false

            for (const scope of tokenScopes) {
                const allowedOperationType = scope.gqlOperationType
                if (allowedOperationType !== op.type) {
                    continue
                }

                const allowedOperationNames = scope.gqlOperationNames
                if (!allowedOperationNames) {
                    allowed = true
                    break
                } else if (allowedOperationNames.includes(op.name)) {
                    allowed = true
                    break
                }
            }

            if (!allowed) {
                throw new GQLError({
                    code: FORBIDDEN,
                    type: FORBIDDEN,
                    message: 'Request is rejected because it contains queries or mutations, not allowed for current session scopes',
                    messageForUser: 'api.global.tokenScopes.FORBIDDEN',
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
