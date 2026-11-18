const express = require('express')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const { BulkAddressNormalizer } = require('./BulkAddressNormalizer')
const { BulkNormalizeTimeout } = require('./bulkNormalizeAsync')
const { readBulkNormalizeRequest } = require('./bulkNormalizeInput')
const { BulkNormalizeStore } = require('./bulkNormalizeStore')

const ROUTE = '/bulkNormalize'
const INVALID_REQUEST = { error: 'Invalid bulk normalization request' }
const logger = getLogger('bulkNormalize')

function positiveInteger (key, defaultValue, max = Number.MAX_SAFE_INTEGER) {
    const value = Number(conf[key])
    return Number.isSafeInteger(value) && value > 0 ? Math.min(value, max) : defaultValue
}

function prepareBulkNormalizeBodyParser (app) {
    app.post(
        ROUTE,
        express.json({ limit: '512kb' }),
        // Express detects a parser error handler by its four arguments.
        (err, req, res, next) => {
            if (err.status >= 400 && err.status < 500) {
                return res.status(400).json(INVALID_REQUEST)
            }
            return next(err)
        }
    )
}

class BulkNormalizeKeystoneApp {
    prepareMiddleware ({ keystone }) {
        const maxItems = positiveInteger('BULK_NORMALIZE_MAX_ITEMS', 100, 1000)
        const timeout = positiveInteger('BULK_NORMALIZE_TIMEOUT_MS', 25000)
        const providerConcurrency = positiveInteger('BULK_NORMALIZE_PROVIDER_CONCURRENCY', 6, 1000)
        const limits = {
            pullenti: positiveInteger('BULK_NORMALIZE_PULLENTI_CONCURRENCY', 10, 1000),
            fias: positiveInteger('BULK_NORMALIZE_FIAS_CONCURRENCY', 6, 1000),
            dadata: providerConcurrency,
            resolve: Math.max(providerConcurrency, 10),
            persist: positiveInteger('BULK_NORMALIZE_PERSIST_CONCURRENCY', 3, 1000),
            providerTimeout: positiveInteger('BULK_NORMALIZE_PROVIDER_TIMEOUT_MS', 3500),
        }
        // This service endpoint follows the same cookie-independent flow as /bulkSearch.
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()

        app.post(ROUTE, async (req, res) => {
            res.set('Pragma', 'no-cache')
            res.set('Cache-Control', 'no-cache, no-store')
            const request = req.is('application/json') && readBulkNormalizeRequest(req.body, maxItems)
            if (!request) return res.status(400).json(INVALID_REQUEST)

            const { items, helpers } = request
            const controller = new AbortController()
            let timer
            const timeoutResult = new Promise((resolve, reject) => {
                timer = setTimeout(() => {
                    const error = new BulkNormalizeTimeout('Bulk normalization deadline exceeded')
                    controller.abort(error)
                    reject(error)
                }, timeout)
            })

            try {
                const normalizer = new BulkAddressNormalizer({
                    req,
                    store: new BulkNormalizeStore(keystone.createContext().sudo()),
                    helpers,
                    signal: controller.signal,
                    deadline: Date.now() + timeout,
                    limits,
                })
                const result = await Promise.race([normalizer.normalize(items), timeoutResult])
                return res.json(result)
            } catch (err) {
                logger.error({ msg: 'Bulk normalize request failed', err, count: items.length })
                const status = err instanceof BulkNormalizeTimeout ? 504 : 500
                return res.status(status).json({ error: 'Unable to normalize address batch' })
            } finally {
                clearTimeout(timer)
            }
        })

        return app
    }
}

module.exports = { BulkNormalizeKeystoneApp, prepareBulkNormalizeBodyParser }
