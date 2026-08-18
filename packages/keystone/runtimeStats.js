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
const RUNTIME_STATS_MAX_ACTIVE_REQUESTS_VAR_NAME = 'RUNTIME_STATS_MAX_ACTIVE_REQUESTS'

function isAccessTokenValid (token) {
    const accessToken = conf[RUNTIME_STATS_ACCESS_TOKEN_VAR_NAME]
    if (!token || !accessToken) return false
    if (token.length !== accessToken.length) return false

    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(accessToken))
}

function parseMaxActiveRequests (value) {
    const parsed = parseInt(value, 10)
    if (!Number.isFinite(parsed) || parsed <= 0) return 0
    return parsed
}

const IS_BUILD_PHASE = conf.PHASE === 'build'
const IS_WORKER_PROCESS = conf.PHASE === 'worker'

const logger = getLogger('runtime-stats')

class RuntimeStatsMiddleware {
    constructor ({
        statsUrl = '/api/runtime-stats',
        maxActiveRequests,
    } = {}) {
        this.statsUrl = statsUrl
        this.maxActiveRequests = parseMaxActiveRequests(
            maxActiveRequests !== undefined
                ? maxActiveRequests
                : conf[RUNTIME_STATS_MAX_ACTIVE_REQUESTS_VAR_NAME],
        )
        this.requestTargetOptions = (conf[X_TARGET_OPTIONS_VAR_NAME] || '').split(',').filter(Boolean)
        this.requestTypeOptions = ['api', 'graphql', 'oidc', 'wellKnown', 'healthCheck', 'other']
        this.metricsIntervalId = null
        this.wasReady = true
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

    /**
     * Balancer scrapes /api/runtime-stats and kube probes hit health URLs.
     * Those must not inflate activeRequestsCount.
     * @private
     * @param req
     * @returns {boolean}
     */
    shouldSkipTracking (req) {
        let pathname
        try {
            pathname = new URL(`${conf['SERVER_URL']}${req.url}`).pathname
        } catch (err) {
            pathname = String(req.url || '').split('?')[0]
        }

        if (pathname === this.statsUrl || pathname === `${this.statsUrl}/`) {
            return true
        }

        if (pathname === '/.well-known/apollo/server-health') {
            return true
        }

        if (pathname === DEFAULT_HEALTHCHECK_URL || pathname.startsWith(`${DEFAULT_HEALTHCHECK_URL}/`)) {
            return true
        }

        return false
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

        if (this.maxActiveRequests > 0) {
            logger.info({
                msg: 'max active requests enabled',
                data: { maxActiveRequests: this.maxActiveRequests, statsUrl: this.statsUrl },
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
        const shouldSkipTracking = this.shouldSkipTracking.bind(this)

        app.use(function runtimeStatsMiddleware (req, res, next) {
            let requestTarget
            let requestType

            let cleaned = false
            const cleanup = () => {
                if (cleaned) return
                cleaned = true

                runtimeStats.activeRequestsIds.delete(req.id)
                runtimeStats.activeRequestsDetails.delete(req.id)

                if (requestType && runtimeStats.activeRequestsCountByType[requestType] !== undefined) {
                    runtimeStats.activeRequestsCountByType[requestType] = Math.max(0, runtimeStats.activeRequestsCountByType[requestType] - 1)
                } else {
                    logger.warn({
                        msg: 'Cleanup called but requestType not set or counter undefined',
                        reqId: req.id,
                        url: req.url,
                        data: { requestType, hasCounter: runtimeStats.activeRequestsCountByType[requestType] !== undefined },
                    })
                }

                if (requestTarget && runtimeStats.activeRequestsCountByTarget[requestTarget] !== undefined) {
                    runtimeStats.activeRequestsCountByTarget[requestTarget] = Math.max(0, runtimeStats.activeRequestsCountByTarget[requestTarget] - 1)
                } else {
                    logger.warn({
                        msg: 'Cleanup called but requestTarget not set or counter undefined',
                        reqId: req.id,
                        url: req.url,
                        data: { requestTarget, hasCounter: runtimeStats.activeRequestsCountByTarget[requestTarget] !== undefined },
                    })
                }
            }

            try {
                if (shouldSkipTracking(req)) {
                    return next()
                }

                if (!req.id) {
                    logger.warn({ msg: 'Request has no ID, skipping runtime stats tracking', data: { url: req.url, method: req.method } })
                    return next()
                }

                requestTarget = detectRequestTarget(req)
                requestType = detectRequestType(req)

                runtimeStats.totalRequestsCount = (runtimeStats.totalRequestsCount || 0) + 1
                runtimeStats.totalRequestsCountByType[requestType] = (runtimeStats.totalRequestsCountByType[requestType] || 0) + 1
                runtimeStats.totalRequestsCountByTarget[requestTarget] = (runtimeStats.totalRequestsCountByTarget[requestTarget] || 0) + 1

                // SSR race condition: Check if response finished during type/target detection
                // For SSR requests (e.g., Next.js /property), the response may be sent while we're
                // detecting request type/target. If we register cleanup handlers after 'finish' has
                // already fired, the handlers will never execute, causing counters to never decrement.
                if (res.writableEnded) {
                    logger.warn({
                        msg: 'Response already finished before cleanup handlers registered',
                        reqId: req.id,
                        url: req.url,
                        data: { method: req.method, requestType, requestTarget },
                    })
                    return next()
                }

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
            } catch (err) {
                logger.error({
                    msg: 'runtimeStatsMiddleware error',
                    err,
                    data: { url: req.url, method: req.method, runtimeStats },
                })
            }

            next()
        })

        const sendRuntimeStats = (req, res) => {
            const activeRequestsCount = runtimeStats.activeRequestsIds.size
            const maxActiveRequests = this.maxActiveRequests
            const ready = maxActiveRequests <= 0 || activeRequestsCount < maxActiveRequests
            const token = req.query['token']

            if (ready !== this.wasReady) {
                logger.warn({
                    msg: ready
                        ? 'active requests below max, pod ready'
                        : 'active requests at max, pod not ready',
                    data: { activeRequestsCount, maxActiveRequests },
                })
                this.wasReady = ready
            }

            const status = ready ? 200 : 503

            if (!token) {
                // Kube httpGet probes cannot send a token from env. Status alone is
                // enough for readiness; do not leak counters without a valid token.
                return res.status(status).end()
            }

            if (!isAccessTokenValid(token)) {
                return res.status(403).send()
            }

            const reqIds = req.query['reqIds']

            return res.status(status).json({
                ready,
                maxActiveRequests,
                activeRequestsCount,
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
        }

        app.get(this.statsUrl, sendRuntimeStats)

        if (!conf[RUNTIME_STATS_ACCESS_TOKEN_VAR_NAME]) {
            logger.warn({
                msg: 'Runtime stats token is not set. GET /api/runtime-stats without a token returns only a status code',
                data: { howToEnable: `Add the ${RUNTIME_STATS_ACCESS_TOKEN_VAR_NAME} variable to env` },
            })
        }

        return app
    }
}


module.exports = {
    RuntimeStatsMiddleware,
}
