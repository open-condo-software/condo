const { extractQueriesAndMutationsFromRequest } = require('./request.utils')
const { extractPossibleArgsFromSchemaQueries, extractKeystoneListsData } = require('./schema.utils')

/** @implements {import('apollo-server-plugin-base').ApolloServerPlugin} */
class ApolloRateLimitingPlugin {
    /** @type {import('@keystonejs/keystone').Keystone} */
    #keystone = null
    /** @type {Record<string, string>} */
    #listReadQueries = {}
    /** @type {Record<string, string>} */
    #listMetaReadQueries = {}
    /** @type {Record<string, Array<string>>} */
    #queriesArgList = {}
    /** @type {Record<string, Array<{ fieldName: string, listKey: string }>>} */
    #listRelations = {}

    /**
     * @param keystone {import('@keystonejs/keystone').Keystone} keystone instance
     * @param opts {Record<string, never>} plugin options
     */
    constructor (keystone, opts = {}) {
        this.#keystone = keystone
        const { listRelations, listMetaQueries, listQueries } = extractKeystoneListsData(keystone)
        this.#listReadQueries = listQueries
        this.#listMetaReadQueries = listMetaQueries
        this.#listRelations = listRelations
    }

    serverWillStart (service) {
        const { schema } = service
        this.#queriesArgList = extractPossibleArgsFromSchemaQueries(schema)
    }

    requestDidStart () {
        return {
            didResolveOperation: (requestContext) => {
                const res = extractQueriesAndMutationsFromRequest(requestContext)
                console.log(JSON.stringify(res, null, 2))
            },
        }
    }
}

module.exports = {
    ApolloRateLimitingPlugin,
}