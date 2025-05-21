const express = require('express')
const camelCase = require('lodash/camelCase')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const metrics = require('@open-condo/keystone/metrics')

const { DEFAULT_HEALTHCHECK_URL } = require('./healthCheck')

const X_TARGET_OPTIONS_VAR_NAME = 'X_TARGET_OPTIONS'
const ACCESS_TOKEN_VAR_NAME = 'RUNTIME_STATS_ACCESS_TOKEN'
const ENABLED_VAR_NAME = 'RUNTIME_STATS_ENABLE'

const IS_BUILD_PHASE = conf.PHASE === 'build'
const IS_WORKER_PROCESS = conf.PHASE === 'worker'

const logger = getLogger('runtime-stats')

class RuntimeStatsMiddleware {
    constructor ({
        statsUrl = '/api/runtime-stats',
    } = {}) {
        this.statsUrl = statsUrl
    }

    async prepareMiddleware ({ keystone }) {
        if (conf[ENABLED_VAR_NAME] !== 'true') {
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
            activeRequestsCountByType: {},
            activeRequestsCountByTarget: {},
            totalRequestsCount: 0,
            totalRequestsCountByType: {},
            totalRequestsCountByTarget: {},
        }

        if (!IS_BUILD_PHASE && !IS_WORKER_PROCESS) {
            setInterval(function sendRuntimeMetrics () {
                const { activeRequestsIds, ...otherStats } = runtimeStats

                logger.info({
                    msg: 'current values',
                    runtimeStats: { activeRequestsIds: Array.from(activeRequestsIds.keys()), ...otherStats },
                })

                metrics.gauge({ name: 'runtimeStats.requestsCount.total', value: runtimeStats.totalRequestsCount })

                for (const type of Object.keys(runtimeStats.totalRequestsCountByType)) {
                    metrics.gauge({
                        name: `runtimeStats.requestsCount.type.${camelCase(type)}.total`,
                        value: runtimeStats.totalRequestsCountByType[type],
                    })
                }

                for (const target of Object.keys(runtimeStats.totalRequestsCountByTarget)) {
                    metrics.gauge({
                        name: `runtimeStats.requestsCount.target.${camelCase(target)}.total`,
                        value: runtimeStats.totalRequestsCountByTarget[target],
                    })
                }
            }, 1000)
        }

        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()

        app.use(function runtimeStatsMiddleware (req, res, next) {
            try {
                const url = new URL(`${conf['SERVER_URL']}${req.url}`).pathname
                const method = (req.method || 'get').toLowerCase()

                const possibleXTargetValues = (conf[X_TARGET_OPTIONS_VAR_NAME] || '').split(',').filter(Boolean)
                const xTargetHeader = req.headers['x-target']

                const xTarget = possibleXTargetValues.includes(xTargetHeader) ? xTargetHeader : 'other'

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

                runtimeStats.activeRequestsIds.add(req.id)

                runtimeStats.activeRequestsCountByType[requestType] = (runtimeStats.activeRequestsCountByType[requestType] || 0) + 1
                runtimeStats.activeRequestsCountByTarget[xTarget] = (runtimeStats.activeRequestsCountByTarget[xTarget] || 0) + 1

                runtimeStats.totalRequestsCount = (runtimeStats.totalRequestsCount || 0) + 1
                runtimeStats.totalRequestsCountByType[requestType] = (runtimeStats.totalRequestsCountByType[requestType] || 0) + 1
                runtimeStats.totalRequestsCountByTarget[xTarget] = (runtimeStats.totalRequestsCountByTarget[xTarget] || 0) + 1

                res.on('close', () => {
                    if (requestType) {
                        runtimeStats.activeRequestsIds.delete(req.id)
                        runtimeStats.activeRequestsCountByType[requestType] = Math.max(0, runtimeStats.activeRequestsCountByType[requestType] - 1)
                        runtimeStats.activeRequestsCountByTarget[xTarget] = Math.max(0, runtimeStats.activeRequestsCountByTarget[xTarget] - 1)
                    }
                })
            } catch (error) {
                logger.error({
                    msg: 'runtimeStatsMiddleware error',
                    error,
                    data: { url: req.url, method: req.method, runtimeStats },
                })
            }

            next()
        })

        if (conf[ACCESS_TOKEN_VAR_NAME]) {
            app.get(this.statsUrl, (req, res) => {
                const token = req.query['token']
                const reqIds = req.query['reqIds']
                const accessToken = conf[ACCESS_TOKEN_VAR_NAME]
                if (!!accessToken && accessToken === token) {
                    res.json({
                        activeRequestsCount: runtimeStats.activeRequestsIds.size,
                        activeRequestsCountByType: runtimeStats.activeRequestsCountByType,
                        activeRequestsCountByTarget: runtimeStats.activeRequestsCountByTarget,
                        totalRequestsCount: runtimeStats.totalRequestsCount,
                        totalRequestsCountByType: runtimeStats.totalRequestsCountByType,
                        totalRequestsCountByTarget: runtimeStats.totalRequestsCountByTarget,
                        ...reqIds ? { reqIds: Array.from(runtimeStats.activeRequestsIds.keys()) } : {},
                    })
                } else {
                    res.status(403).send()
                }
            })
        } else {
            logger.warn({
                msg: 'Runtime stats url disabled. It\'s impossible to get stats using GET query',
                data: { howToEnable: `Add the ${ACCESS_TOKEN_VAR_NAME} variable to env` },
            })
        }

        return app
    }
}


module.exports = {
    RuntimeStatsMiddleware,
}
