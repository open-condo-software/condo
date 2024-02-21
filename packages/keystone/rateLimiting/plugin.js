const ms = require('ms')

const { getRedisClient } = require('@open-condo/keystone/redis')

const {
    DEFAULT_MAX_TOTAL_RESULTS,
    DEFAULT_MUTATION_WEIGHT,
    DEFAULT_QUERY_WEIGHT,
    DEFAULT_QUOTA_WINDOW,
    DEFAULT_AUTHED_QUOTA,
    DEFAULT_NON_AUTHED_QUOTA,
    DEFAULT_WHERE_COMPLEXITY_FACTOR,
    DEFAULT_PAGE_LIMIT,
} = require('./constants')
const { extractWhereComplexityFactor, extractRelationsComplexityFactor } = require('./query.utils')
const { extractQueriesAndMutationsFromRequest, extractQuotaKeyFromRequest } = require('./request.utils')
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
    /** @type {Record<string, Record<string, string>>} */
    #listRelations = {}
    #queryWeight = DEFAULT_QUERY_WEIGHT
    #mutationWeight = DEFAULT_MUTATION_WEIGHT
    #maxTotalResults = DEFAULT_MAX_TOTAL_RESULTS
    #authedQuota = DEFAULT_AUTHED_QUOTA
    #nonAuthedQuota = DEFAULT_NON_AUTHED_QUOTA
    #quotaWindowInMS = ms(DEFAULT_QUOTA_WINDOW)
    #whereScalingFactor = DEFAULT_WHERE_COMPLEXITY_FACTOR
    #redisClient = getRedisClient()
    #pageLimit = DEFAULT_PAGE_LIMIT

    /**
     * @param keystone {import('@keystonejs/keystone').Keystone} keystone instance
     * @param opts {{ queryWeight?: number, mutationWeight?: number, window?: string, authedQuota?: number, nonAuthedQuota?: number, whereScalingFactor?: number, pageLimit?: number }} plugin options
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
        if (opts.whereScalingFactor) {
            this.#whereScalingFactor = opts.whereScalingFactor
        }
        if (opts.pageLimit) {
            this.#pageLimit = opts.pageLimit
        }
    }

    /**
     * Calculates complexity coefficient of the query
     * @param {import('./request.utils').FieldInfo} query
     * @return {number}
     */
    #getQueryComplexity (query) {
        // all<Objects> queries
        if (this.#listReadQueries[query.name]) {
            const listKey = this.#listReadQueries[query.name]
            const first = query.args.first || this.#maxTotalResults
            const where = query.args.where || {}

            const whereFactor = extractWhereComplexityFactor(where, this.#whereScalingFactor, this.#pageLimit)
            const selectionFactor = extractRelationsComplexityFactor(query.selectionSet, listKey, this.#listRelations)
            const paginationFactor = Math.max(1.0, Math.ceil(first / this.#pageLimit))
            // TODO: Obtain custom weights overrides for query if needed
            const totalComplexity = this.#queryWeight * paginationFactor * (whereFactor + (selectionFactor - 1))

            return Math.ceil(totalComplexity)
        }

        // all<Object>Meta queries
        if (this.#listMetaReadQueries[query.name]) {
            const where = query.args.where || {}
            const whereFactor = extractWhereComplexityFactor(where, this.#whereScalingFactor, this.#pageLimit)
            const maxPaginationFactor = Math.ceil(this.#maxTotalResults / this.#pageLimit)

            // TODO: Obtain custom weights overrides for query if needed
            return this.#queryWeight * whereFactor * maxPaginationFactor
        }

        // custom queries
        // TODO: Obtain custom weights overrides for query if needed
        return this.#queryWeight
    }

    /**
     * Calculates complexity coefficient of the query
     * @param {import('./request.utils').FieldInfo} mutation
     * @return {number}
     */
    #getMutationComplexity (mutation) {
        // TODO: Obtain custom override values later if needed
        return this.#mutationWeight
    }

    serverWillStart (service) {
        const { schema } = service
        this.#queriesArgList = extractPossibleArgsFromSchemaQueries(schema)
    }

    requestDidStart () {
        return {
            didResolveOperation: async (requestContext) => {
                const { mutations, queries } = extractQueriesAndMutationsFromRequest(requestContext)

                /** @type {Record<string, number>} */
                const queriesComplexity = {}
                /** @type {Record<string, number>} */
                const mutationsComplexity = {}

                for (const query of queries) {
                    // Not include introspection queries in complexity.
                    // Since they're disabled in production and not the part of original request
                    if (query.name.startsWith('__')) {
                        continue
                    }
                    const complexity = this.#getQueryComplexity(query)
                    // TODO: Check override query quota if needed
                    queriesComplexity[query.name] ??= 0
                    queriesComplexity[query.name] += complexity
                }

                for (const mutation of mutations) {
                    const complexity = this.#getMutationComplexity(mutation)
                    // TODO: Check override mutation quota if needed
                    mutationsComplexity[mutation.name] ??= 0
                    mutationsComplexity[mutation.name] += complexity
                }

                const allQueriesComplexity = Object.values(queriesComplexity).reduce((acc, curr) => acc + curr, 0)
                const allMutationsComplexity = Object.values(mutationsComplexity).reduce((acc, curr) => acc + curr, 0)
                const requestComplexity = allQueriesComplexity + allMutationsComplexity

                requestContext.context.req.complexity = {
                    details: {
                        queries: queriesComplexity,
                        mutations: mutationsComplexity,
                    },
                    queries: allQueriesComplexity,
                    mutations: allMutationsComplexity,
                    total: requestComplexity,
                }

                const { isAuthed, key } = extractQuotaKeyFromRequest(requestContext)
                const maxQuota = isAuthed ? this.#authedQuota : this.#nonAuthedQuota

                /** @type {string | null} */
                const currentValue = await this.#redisClient.get(key)
                const usedQuota = parseInt(currentValue) || 0

                if (usedQuota + requestComplexity > maxQuota) {
                    // TODO: Throw error instead here
                    return
                }

                if (currentValue === null) {
                    await this.#redisClient.set(key, requestComplexity, 'PX', this.#quotaWindowInMS)
                } else {
                    await this.#redisClient.incrby(key, requestComplexity)
                }
            },
        }
    }
}

module.exports = {
    ApolloRateLimitingPlugin,
}