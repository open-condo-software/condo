const { GQLError, GQLErrorCode: { FORBIDDEN } } = require('@open-condo/keystone/errors')

const { validatePluginConfig } = require('./config.utils')

const { extractQueriesAndMutationsFromRequest } = require('../utils/requests')

/** @implements {import('apollo-server-plugin-base').ApolloServerPlugin} */
class ApolloQueryBlockingPlugin {
    /** @type {Set<string>} */
    #blockedQueries = new Set()
    /** @type {Set<string>} */
    #blockedMutations = new Set()

    constructor (config) {
        config = validatePluginConfig(config || {})

        if (config.queries) {
            this.#blockedQueries = new Set(config.queries)
        }

        if (config.mutations) {
            this.#blockedMutations = new Set(config.mutations)
        }
    }

    requestDidStart () {
        return {
            didResolveOperation: async (requestContext) => {
                if (!this.#blockedQueries.size && !this.#blockedMutations.size) return
                
                const { mutations, queries } = extractQueriesAndMutationsFromRequest(requestContext)

                const blockedMutations = mutations
                    .map(mutation => mutation.name)
                    .filter(name => this.#blockedMutations.has(name))
                const blockedQueries = queries
                    .map(query => query.name)
                    .filter(name => this.#blockedQueries.has(name))

                if (blockedMutations.length || blockedQueries.length) {
                    throw new GQLError({
                        code: FORBIDDEN,
                        type: 'FORBIDDEN_REQUEST',
                        message: 'Request is rejected because it contains blocked queries / mutations: {blockedOperations}',
                        messageForUser: 'api.global.queryBlocking.FORBIDDEN_REQUEST',
                        messageInterpolation: {
                            blockedOperations: [...blockedMutations, ...blockedQueries].join(', '),
                        },
                    }, requestContext.context)
                }
            },
        }
    }
}

module.exports = {
    ApolloQueryBlockingPlugin,
}