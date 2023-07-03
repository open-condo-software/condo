/**
 * This service defines custom api handle which will output health status of defined services
 *
 * Example:
 * {
 *     postgres: pass
 *     redis: pass
 *     apollo: fail
 * }
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
const get = require('lodash/get')
const LRUCache = require('lru-cache')

const { getRedisClient } = require('./redis')

const DEFAULT_HEALTHCHECK_URL = '/.well-known/keystone/server-health'
const DEFAULT_INTERVAL = 1000 // 1s
const DEFAULT_TIMEOUT = 5000 // 1s
const PASS = 'pass'
const FAIL = 'fail'

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
                if (res === 'PONG') { return true }
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
        timeout = DEFAULT_TIMEOUT,
        url = DEFAULT_HEALTHCHECK_URL,
        checks = [],
    }) {
        this.url = url
        this.checks = checks
        this.preparedChecks = []

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
            if (typeof check.prepare === 'function') {
                await check.prepare({ keystone })
            }
            this.preparedChecks.push(check)
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

        const checkResult = await check.run()

        if (typeof checkResult !== 'boolean') {
            throw new Error(`Check.run function output non bool value for check named ${check.name}`)
        }
        this.cache.set(check.name, checkResult)

        return checkResult
    }

    async prepareMiddleware ({ keystone }) {
        const app = express()

        await this.prepareChecks({ keystone })

        app.use(this.url, async (req, res) => {

            const result = {}

            await Promise.all(
                this.preparedChecks.map(
                    async check => {
                        const checkPassed = await this.runCheck(check)
                        result[check.name] = checkPassed ? PASS : FAIL
                    }
                )
            )

            res.status(200).json(result)
        })

        return app
    }
}

module.exports = {
    HealthCheck,
    getRedisHealthCheck,
    getPostgresHealthCheck,
}