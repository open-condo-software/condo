/**
 * This service defines custom api handle which will output health status of defined services
 *
 *
 * ## Simple usage:
 *
 * Go to <url>
 *
 * Example: if all checks pass:
 * 200
 * {
 *     postgres: pass
 *     redis: pass
 *     apollo: pass
 * }
 *
 * Example: if any check fails
 * 500
 * {
 *     postgres: pass
 *     redis: pass
 *     apollo: fail
 * }
 *
 *
 * ## Advanced usage:
 *
 * API supports to filter checks you need via query string
 *
 * Syntax: <url>?checks=<check1>,<check2>,...,<checkN>
 *
 * Configuration example - available checks: postgres, redis, apollo, postgres pass, apollo fails.
 *
 * Request: <url>?checks=postgres
 * 200
 * {
 *      postgres: pass
 * }
 *
 * Request <url>?checks=postgres,redis
 * 500
 * {
 *      postgres: pass,
 *      redis: fail
 * }
 *
 * Note: if configured, non specified checks are ignored. That means, if redis and apollo fails, output will be 200OK, since only postgres was specified
 *
 * ## Response codes:
 *
 * API will output 500 if ANY check fails
 * API will output 200 if EVERY check passes
 * API will output 400 if checks=... is badly configured
 *
 *
 * ## Create own checks:
 *
 * Check is JS object with some required keys:
 *
 * {
 *     *name: "postgres"                        // name of the check
 *     *run: () => {bool}                       // check function. should output boolean
 *     prepare: async ({ keystone }) => {...}   // prepare function. is called during prepareMiddleware() stage
 * }
 *
 */

const express = require('express')
const LRUCache = require('lru-cache')

const { getRedisClient } = require('./redis')

const DEFAULT_HEALTHCHECK_URL = '/server-health'
const DEFAULT_INTERVAL = 1000 // 1s
const DEFAULT_TIMEOUT = 5000 // 5s
const PASS = 'pass'
const FAIL = 'fail'

const BAD_REQUEST = 400
const OK = 200
const INTERNAL_SERVER_ERROR = 500

const getRedisHealthCheck = (clientName = 'healthcheck') => {
    return {
        name: 'redis',
        prepare: () => {
            this.redisClient = getRedisClient(clientName)
        },
        run: async () => {
            try {
                const client = this.redisClient
                const res = await client.ping()
                return res === 'PONG'
            } catch (e) { return false }
        },
    }
}

const getPostgresHealthCheck = () => {
    return {
        name: 'postgres',
        prepare: ({ keystone }) => {
            this.keystone = keystone
        },
        run: async () => {
            try {
                const res = await this.keystone.adapter.knex.raw('SELECT 1')
                if (res) { return true }
            } catch (e) { return false }
        },
    }
}

class HealthCheck {
    cache
    url
    checks
    preparedChecks

    constructor ({
        interval = DEFAULT_INTERVAL,
        url = DEFAULT_HEALTHCHECK_URL,
        checks = [],
    }) {
        this.url = url
        this.checks = checks
        this.preparedChecks = {}

        for (const check of this.checks) {
            if (!check.name) {
                throw new Error('One of the checks did not have a name!')
            }
            if (!check.run) {
                throw new Error(`Check ${check.name} do not have check.run boolean function!`)
            }
        }

        this.cache = new LRUCache({ ttl: interval, ttlAutopurge: true })
    }

    prepareChecks = async ({ keystone }) => {
        for (const check of this.checks) {
            if (this.preparedChecks[check.name]) {
                continue
            }
            if (typeof check.prepare === 'function') {
                await check.prepare({ keystone })
            }
            this.preparedChecks[check.name] = check
        }
    }

    /**
     * Runs check against timeout
     * Uses TTL cache with interval
     * @param {{name, run, prepare}} check
     * @returns {Promise<*>}
     */
    runCheck = async (check) => {
        if (this.cache.has(check.name)) {
            return this.cache.get(check.name)
        }

        const checkResult = await Promise.race([
            check.run(),
            new Promise(r => { setTimeout(r, DEFAULT_TIMEOUT) }).then(() => false),
        ])

        if (typeof checkResult !== 'boolean') {
            throw new Error(`Check.run function output non bool value for check named ${check.name}`)
        }
        this.cache.set(check.name, checkResult)

        return checkResult
    }

    async prepareMiddleware ({ keystone }) {
        // this route can not be used for csrf attack (because no cookies and tokens are used in a public route)
        // also, all operations behind route are read only
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()

        await this.prepareChecks({ keystone })

        app.use(this.url, async (req, res) => {

            const customChecksConfigured = typeof req.query.checks === 'string'

            let customChecks = null

            if (customChecksConfigured) {
                customChecks = req.query.checks.trim().split(',')

                if (!Array.isArray(customChecks)) {
                    return res.status(BAD_REQUEST).json({ error: 'Can\'t parse custom checks' })
                }
                const nonExistingChecks = customChecks.filter(checkName => !this.preparedChecks[checkName])
                if (nonExistingChecks.length > 0) {
                    return res.status(BAD_REQUEST).json({ error: `Non existing checks found! ${nonExistingChecks}` })
                }
            }

            const selectedChecks = customChecksConfigured ? customChecks : Object.keys(this.preparedChecks)

            const result = {}
            let allSelectedChecksPassed = true
            await Promise.all(
                selectedChecks.map(
                    async checkName => {
                        const checkPassed = await this.runCheck(this.preparedChecks[checkName])
                        if (!checkPassed) { allSelectedChecksPassed = false }
                        result[checkName] = checkPassed ? PASS : FAIL
                    }
                )
            )

            const status = allSelectedChecksPassed ? OK : INTERNAL_SERVER_ERROR
            res.status(status).json(result)
        })

        return app
    }
}

module.exports = {
    HealthCheck,
    getRedisHealthCheck,
    getPostgresHealthCheck,
}