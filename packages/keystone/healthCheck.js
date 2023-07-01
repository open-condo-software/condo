const express = require('express')
const get = require('lodash/get')
const LRUCache = require('lru-cache')

const DEFAULT_HEALTHCHECK_URL = '/.well-known/keystone/server-health'
const PASS = 'pass'
const FAIL = 'fail'

class HealthCheck {
    cache
    url
    checks
    registeredChecks

    constructor ({
        interval = 1000,
        url = DEFAULT_HEALTHCHECK_URL,
        checks = [],
    }) {
        this.url = url
        this.checks = checks
        this.registeredChecks = []

        this.checks.forEach(check => {
            if (!check.name) {
                throw new Error('One of the checks did not have a name!')
            }
            if (!check.run) {
                throw new Error(`Check ${check.name} do not have check.run boolean function!`)
            }
        })

        this.cache = new LRUCache({ ttl: interval })
    }

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

        this.registeredChecks = this.checks

        app.use(this.url, async (req, res) => {

            const result = {}

            console.log(this.registeredChecks)

            await Promise.all(this.registeredChecks.map(async registeredCheck => {
                result[registeredCheck.name] = await this.runCheck(registeredCheck)
            }))

            res.status(200).json(result)
        })

        return app
    }
}

module.exports = {
    HealthCheck,
}
