const ms = require('ms')

const {
    DEFAULT_MAX_TOTAL_RESULTS,
    DEFAULT_MUTATION_WEIGHT,
    DEFAULT_QUERY_WEIGHT,
    DEFAULT_QUOTA_WINDOW,
    DEFAULT_AUTHED_QUOTA,
    DEFAULT_NON_AUTHED_QUOTA,
} = require('./constants')
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
    #queryWeight = DEFAULT_QUERY_WEIGHT
    #mutationWeight = DEFAULT_MUTATION_WEIGHT
    #maxTotalResults = DEFAULT_MAX_TOTAL_RESULTS
    #authedQuota = DEFAULT_AUTHED_QUOTA
    #nonAuthedQuota = DEFAULT_NON_AUTHED_QUOTA
    #quotaWindowInMS = ms(DEFAULT_QUOTA_WINDOW)

    /**
     * @param keystone {import('@keystonejs/keystone').Keystone} keystone instance
     * @param opts {{ queryWeight?: number, mutationWeight?: number, window?: string, authedQuota?: number, nonAuthedQuota?: number }} plugin options
     */
    constructor (keystone, opts = {}) {
        this.#keystone = keystone
        const { listRelations, listMetaQueries, listQueries } = extractKeystoneListsData(keystone)
        this.#listReadQueries = listQueries
        this.#listMetaReadQueries = listMetaQueries
        this.#listRelations = listRelations

        if (opts.queryWeight) {
            this.#queryWeight = opts.queryWeight
        }
        if (opts.mutationWeight) {
            this.#mutationWeight = opts.mutationWeight
        }
        if (keystone.queryLimits && keystone.queryLimits.maxTotalResults) {
            this.#maxTotalResults = keystone.queryLimits.maxTotalResults
        }
        if (opts.window) {
            this.#quotaWindowInMS = ms(opts.window)
        }
        if (opts.authedQuota) {
            this.#authedQuota = opts.authedQuota
        }
        if (opts.nonAuthedQuota) {
            this.#nonAuthedQuota = opts.nonAuthedQuota
        }
    }

    serverWillStart (service) {
        const { schema } = service
        this.#queriesArgList = extractPossibleArgsFromSchemaQueries(schema)
    }

    requestDidStart () {
        return {
            didResolveOperation: (requestContext) => {
                const { mutations, queries } = extractQueriesAndMutationsFromRequest(requestContext)
            },
        }
    }
}

module.exports = {
    ApolloRateLimitingPlugin,
}