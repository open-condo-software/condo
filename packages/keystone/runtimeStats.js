const crypto = require('crypto')

const express = require('express')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const metrics = require('@open-condo/keystone/metrics')

const { DEFAULT_HEALTHCHECK_URL } = require('./healthCheck')

const SEND_METRICS_INTERVAL_IN_MS = 1000

const X_TARGET_OPTIONS_VAR_NAME = 'X_TARGET_OPTIONS'
const RUNTIME_STATS_ACCESS_TOKEN_VAR_NAME = 'RUNTIME_STATS_ACCESS_TOKEN'
const RUNTIME_STATS_ENABLE_VAR_NAME = 'RUNTIME_STATS_ENABLE'

const IS_BUILD_PHASE = conf.PHASE === 'build'
const IS_WORKER_PROCESS = conf.PHASE === 'worker'

const logger = getLogger('runtime-stats')

class RuntimeStatsMiddleware {
    constructor ({
        statsUrl = '/api/runtime-stats',
    } = {}) {
        this.statsUrl = statsUrl
        this.requestTargetOptions = (conf[X_TARGET_OPTIONS_VAR_NAME] || '').split(',').filter(Boolean)
        this.requestTypeOptions = ['api', 'graphql', 'oidc', 'wellKnown', 'healthCheck', 'other']
        this.metricsIntervalId = null
    }

    /**
     * @private
     * @param req
     * @returns {'api'|'graphql'|'oidc'|'wellKnown'|'healthCheck'|'other'}
     */
    detectRequestType (req) {
        const url = new URL(`${conf['SERVER_URL']}${req.url}`).pathname

        const method = (req.method || 'get').toLowerCase()
        const isPost = method === 'post'

        const isAdminApiUrl = url === '/admin/api'
        const isApiUrl = url.startsWith('/api')
        const isOidcUrl = url.startsWith('/oidc')
        const isWellKnownUrl = url.startsWith('/.well-known')
        const isHealthCheckUrl = url.startsWith(DEFAULT_HEALTHCHECK_URL)

        /** @type {'api' | 'graphql' | 'oidc' | 'wellKnown' | 'healthCheck' | 'other'} */
        let requestType = 'other'

        if (isPost && isAdminApiUrl) {
            requestType = 'graphql'
        } else if (isApiUrl) {
            requestType = 'api'
        } else if (isOidcUrl) {
            requestType = 'oidc'
        } else if (isWellKnownUrl) {
            requestType = 'wellKnown'
        } else if (isHealthCheckUrl) {
            requestType = 'healthCheck'
        }

        return requestType
    }

    /**
     * @private
     * @param req
     * @returns {string}
     */
    detectRequestTarget (req) {
        const xTargetHeader = req.headers['x-target']

        return this.requestTargetOptions.includes(xTargetHeader) ? xTargetHeader : 'other'
    }

    async prepareMiddleware ({ keystone }) {
        if (conf[RUNTIME_STATS_ENABLE_VAR_NAME] !== 'true') {
            logger.info({ msg: 'runtime stats disabled' })
            return
        }

        if (!conf[X_TARGET_OPTIONS_VAR_NAME]) {
            logger.warn({
                msg: 'There are no options for x-target header. All queries will relate to the `other` group.',
                data: { howToFix: `Add the ${X_TARGET_OPTIONS_VAR_NAME} variable to env. For example: 'condo-app,billing,cc-app'` },
            })
        }

        const runtimeStats = {
            activeRequestsIds: new Set(),
            activeRequestsDetails: new Map(),
            activeRequestsCountByType: {},
            activeRequestsCountByTarget: {},
            totalRequestsCount: 0,
            totalRequestsCountByType: Object.fromEntries(this.requestTypeOptions.map((k) => [k, 0])),
            totalRequestsCountByTarget: Object.fromEntries([...this.requestTargetOptions, 'other'].map((k) => [k, 0])),
        }

        if (!IS_BUILD_PHASE && !IS_WORKER_PROCESS) {
            if (this.metricsIntervalId) {
                clearInterval(this.metricsIntervalId)
            }

            this.metricsIntervalId = setInterval(function sendRuntimeMetrics () {
                const { activeRequestsIds, activeRequestsDetails, ...otherStats } = runtimeStats

                logger.info({
                    msg: 'current values',
                    runtimeStats: { ...otherStats, activeRequestsCount: activeRequestsIds.size },
                    data: {
                        activeRequestsIds: Array.from(activeRequestsIds.keys()).slice(0, 200),
                        activeRequestsDetails: Array.from(activeRequestsDetails.entries()).slice(0, 200).map(([id, details]) => ({ id, ...details })),
                    },
                })

                metrics.gauge({ name: 'runtimeStats.requestsCount.total', value: runtimeStats.totalRequestsCount })
                metrics.gauge({ name: 'runtimeStats.activeRequestsCount.total', value: runtimeStats.activeRequestsIds.size })

                for (const type of Object.keys(runtimeStats.totalRequestsCountByType)) {
                    metrics.gauge({
                        name: 'runtimeStats.requestsCount.byType',
                        value: runtimeStats.totalRequestsCountByType[type],
                        tags: { type },
                    })

                    metrics.gauge({
                        name: 'runtimeStats.activeRequestsCount.byType',
                        value: runtimeStats.activeRequestsCountByType[type] || 0,
                        tags: { type },
                    })
                }

                for (const target of Object.keys(runtimeStats.totalRequestsCountByTarget)) {
                    metrics.gauge({
                        name: 'runtimeStats.requestsCount.byTarget',
                        value: runtimeStats.totalRequestsCountByTarget[target],
                        tags: { target },
                    })

                    metrics.gauge({
                        name: 'runtimeStats.activeRequestsCount.byTarget',
                        value: runtimeStats.activeRequestsCountByTarget[target] || 0,
                        tags: { target },
                    })
                }
            }, SEND_METRICS_INTERVAL_IN_MS)
        }

        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()

        const detectRequestType = this.detectRequestType.bind(this)
        const detectRequestTarget = this.detectRequestTarget.bind(this)

        app.use(function runtimeStatsMiddleware (req, res, next) {
            let requestTarget
            let requestType

            let cleaned = false
            const cleanup = () => {
                if (cleaned) return
                cleaned = true

                runtimeStats.activeRequestsIds.delete(req.id)
                runtimeStats.activeRequestsDetails.delete(req.id)
                runtimeStats.activeRequestsCountByType[requestType] = Math.max(0, runtimeStats.activeRequestsCountByType[requestType] - 1)
                runtimeStats.activeRequestsCountByTarget[requestTarget] = Math.max(0, runtimeStats.activeRequestsCountByTarget[requestTarget] - 1)
            }

            try {
                if (!req.id) {
                    logger.warn({ msg: 'Request has no ID, skipping runtime stats tracking', data: { url: req.url, method: req.method } })
                    return next()
                }

                requestTarget = detectRequestTarget(req)
                requestType = detectRequestType(req)

                res.on('close', cleanup)
                res.on('finish', cleanup)

                runtimeStats.activeRequestsIds.add(req.id)
                runtimeStats.activeRequestsDetails.set(req.id, {
                    type: requestType,
                    target: requestTarget,
                    url: req.url,
                    method: req.method,
                    timestamp: new Date().toISOString(),
                })

                runtimeStats.activeRequestsCountByType[requestType] = (runtimeStats.activeRequestsCountByType[requestType] || 0) + 1
                runtimeStats.activeRequestsCountByTarget[requestTarget] = (runtimeStats.activeRequestsCountByTarget[requestTarget] || 0) + 1

                runtimeStats.totalRequestsCount = (runtimeStats.totalRequestsCount || 0) + 1
                runtimeStats.totalRequestsCountByType[requestType] = (runtimeStats.totalRequestsCountByType[requestType] || 0) + 1
                runtimeStats.totalRequestsCountByTarget[requestTarget] = (runtimeStats.totalRequestsCountByTarget[requestTarget] || 0) + 1
            } catch (err) {
                logger.error({
                    msg: 'runtimeStatsMiddleware error',
                    err,
                    data: { url: req.url, method: req.method, runtimeStats },
                })
            }

            next()
        })

        if (conf[RUNTIME_STATS_ACCESS_TOKEN_VAR_NAME]) {
            app.get(this.statsUrl, (req, res) => {
                const token = req.query['token']
                const reqIds = req.query['reqIds']
                const accessToken = conf[RUNTIME_STATS_ACCESS_TOKEN_VAR_NAME]

                const isTokenOk = !!token && !!accessToken
                    && token.length === accessToken.length
                    && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(accessToken))

                if (isTokenOk) {
                    res.json({
                        activeRequestsCount: runtimeStats.activeRequestsIds.size,
                        activeRequestsCountByType: runtimeStats.activeRequestsCountByType,
                        activeRequestsCountByTarget: runtimeStats.activeRequestsCountByTarget,
                        totalRequestsCount: runtimeStats.totalRequestsCount,
                        totalRequestsCountByType: runtimeStats.totalRequestsCountByType,
                        totalRequestsCountByTarget: runtimeStats.totalRequestsCountByTarget,
                        ...reqIds ? {
                            reqIds: Array.from(runtimeStats.activeRequestsIds.keys()),
                            activeRequests: Array.from(runtimeStats.activeRequestsDetails.entries()).map(([id, details]) => ({ id, ...details })),
                        } : {},
                    })
                } else {
                    res.status(403).send()
                }
            })
        } else {
            logger.warn({
                msg: 'Runtime stats url disabled. It\'s impossible to get stats using GET query',
                data: { howToEnable: `Add the ${RUNTIME_STATS_ACCESS_TOKEN_VAR_NAME} variable to env` },
            })
        }

        return app
    }
}


module.exports = {
    RuntimeStatsMiddleware,
}
