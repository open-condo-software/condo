const ms = require('ms')

const { GQLError, GQLErrorCode: { TOO_MANY_REQUESTS } } = require('@open-condo/keystone/errors')
const { getKVClient } = require('@open-condo/keystone/kv')

const { validatePluginOptions } = require('./config.utils')
const {
    DEFAULT_MAX_TOTAL_RESULTS,
    DEFAULT_MUTATION_WEIGHT,
    DEFAULT_QUERY_WEIGHT,
    DEFAULT_QUOTA_WINDOW,
    DEFAULT_AUTHED_QUOTA,
    DEFAULT_NON_AUTHED_QUOTA,
    DEFAULT_WHERE_COMPLEXITY_FACTOR,
    DEFAULT_PAGE_LIMIT,
    ERROR_TYPE,
} = require('./constants')
const { extractWhereComplexityFactor, extractRelationsComplexityFactor } = require('./query.utils')
const { extractQuotaKeyFromRequest, addComplexity, buildQuotaKey } = require('./request.utils')
const { extractPossibleArgsFromSchemaQueries, extractKeystoneListsData } = require('./schema.utils')

const { extractQueriesAndMutationsFromRequest } = require('../utils/requests')

/** @implements {import('apollo-server-plugin-base').ApolloServerPlugin} */
class ApolloRateLimitingPlugin {
    /** @type {import('@open-keystone/keystone').Keystone} */
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
    #redisClient = getKVClient()
    #pageLimit = DEFAULT_PAGE_LIMIT
    #customQuotas = {}

    /**
     * @param keystone {import('@open-keystone/keystone').Keystone} keystone instance
     * @param opts {{
     * queryWeight?: number,
     * mutationWeight?: number,
     * window?: string,
     * authedQuota?: number,
     * nonAuthedQuota?: number,
     * whereScalingFactor?: number,
     * pageLimit?: number,
     * customQuotas?: Record<string, number>,
     * identifiersWhiteList?: Array<string>
     * }} plugin options
     */
    constructor (keystone, opts = {}) {
        opts = validatePluginOptions(opts)

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
        if (opts.customQuotas) {
            this.#customQuotas = opts.customQuotas
        }
    }

    static buildQuotaKey = buildQuotaKey

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

                /** @type {Array<{ name: string, complexity: number }>} */
                const queriesComplexity = []
                /** @type {Array<{ name: string, complexity: number }>} */
                const mutationsComplexity = []

                for (const query of queries) {
                    // Not include introspection queries in complexity.
                    // Since they're disabled in production and not the part of original request
                    if (query.name.startsWith('__')) {
                        continue
                    }
                    const complexity = this.#getQueryComplexity(query)

                    queriesComplexity.push({ name: query.name, complexity })
                }

                for (const mutation of mutations) {
                    const complexity = this.#getMutationComplexity(mutation)

                    mutationsComplexity.push({ name: mutation.name, complexity })
                }

                const totalQueriesComplexity = queriesComplexity.reduce((acc, curr) => acc + curr.complexity, 0)
                const totalMutationsComplexity = mutationsComplexity.reduce((acc, curr) => acc + curr.complexity, 0)
                const requestComplexity = totalQueriesComplexity + totalMutationsComplexity

                // NOTE: Exists in cases of batched requests
                const existingComplexity = requestContext.context.req.complexity

                requestContext.context.req.complexity = addComplexity(existingComplexity, {
                    details: {
                        queries: queriesComplexity,
                        mutations: mutationsComplexity,
                    },
                    queries: totalQueriesComplexity,
                    mutations: totalMutationsComplexity,
                    total: requestComplexity,
                })

                const { isAuthed, key, identifier } = extractQuotaKeyFromRequest(requestContext)

                let allowedQuota = isAuthed ? this.#authedQuota : this.#nonAuthedQuota

                if (this.#customQuotas.hasOwnProperty(identifier)) {
                    allowedQuota = this.#customQuotas[identifier]
                }


                // NOTE: Request in batch are executed via Promise.all (probably),
                // that's why we need an atomic way to increment counters / set TTLs
                // So some magic with Redis transactions will be used below

                const [
                    [incrError, incrValue],
                    [ttlError, ttlValueInSec],
                ] = await this.#redisClient
                    .multi()
                    .incrby(key, requestComplexity)
                    .ttl(key)
                    .exec()

                if (incrError || ttlError) {
                    throw (incrError || ttlError)
                }

                const nowTimestampInMs = (new Date()).getTime()

                // NOTE: If TTL is less than zero,
                // it means that incrby has created a clean record in the database without expiration time.
                // So we need to set its TTL explicitly.
                // This operation is separated from main atomic transaction above,
                // so it can potentially be called multiple times (by multiple pods / requests in batch)
                // but the difference of a couple of ms is not very important for us
                // ("expire" accepts seconds, "pexpire" - milliseconds)
                if (ttlValueInSec < 0) {
                    await this.#redisClient.pexpire(key, this.#quotaWindowInMS)
                }

                // NOTE: Each sub-request in batched request execute "incrBy/ttl" + "pexpire" and executed concurrently
                // So we need to take largest incrBy result
                const savedIncrValue = requestContext.context.req.complexity?.quota?.used || 0
                const maxIncrValue = Math.max(savedIncrValue, incrValue)

                const ttlValueInMs = ttlValueInSec < 0 ? this.#quotaWindowInMS : ttlValueInSec * 1000
                const resetTimestampInSec = Math.ceil((nowTimestampInMs + ttlValueInMs) / 1000)

                Object.assign(requestContext.context.req.complexity, {
                    quota: {
                        limit: allowedQuota,
                        remaining: Math.max(allowedQuota - maxIncrValue, 0),
                        used: Math.min(maxIncrValue, allowedQuota),
                        reset: resetTimestampInSec,
                    },
                })

                if (incrValue > allowedQuota) {
                    throw new GQLError({
                        code: TOO_MANY_REQUESTS,
                        type: ERROR_TYPE,
                        message: 'You\'ve made too many requests recently, try again later',
                        messageForUser: `api.global.rateLimit.${ERROR_TYPE}`,
                        messageInterpolation: {
                            resetTime: resetTimestampInSec,
                        },
                    }, requestContext.context)
                }
            },

            willSendResponse: (requestContext) => {
                const res = requestContext.context.req.res
                const quotaInfo = requestContext.context.req?.complexity?.quota || {}

                for (const [key, value] of Object.entries(quotaInfo)) {
                    res.setHeader(`x-rate-limit-complexity-${key}`, value)
                }
            },
        }
    }
}

module.exports = {
    ApolloRateLimitingPlugin,
}
