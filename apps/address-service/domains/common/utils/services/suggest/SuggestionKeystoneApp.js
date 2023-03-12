const express = require('express')
const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging')

const { INJECTIONS_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { InjectionsSeeker } = require('@address-service/domains/common/utils/services/InjectionsSeeker')
const { getSuggestionsProvider } = require('@address-service/domains/common/utils/services/providerDetectors')

/**
 * @typedef {Object} NormalizedSuggestion
 * @property {string} value
 * @property {string} rawValue
 */

const ALLOWED_METHODS = ['GET', 'POST']

/**
 * @param {Request} req express request
 * @param {string} param Parameter to extract from body or query
 * @param {*} [defaultValue] Default value
 */
const getReqParam = (req, param, defaultValue) => {
    const reqQuery = get(req, 'query', {})
    const reqBody = get(req, 'body', {})
    return get(reqBody, param, get(reqQuery, param, defaultValue))
}

const getReqJson = (req, param, defaultValue) => {
    const val = getReqParam(req, param)
    if (!val || typeof val !== 'string') return defaultValue
    try {
        return JSON.parse(val)
    } catch (e) {
        return defaultValue
    }
}

class SuggestionKeystoneApp {
    constructor () {
        this.logger = getLogger(this.constructor.name)
    }

    /**
     * @param {{ keystone, distDir, dev }} params
     * @returns {Express}
     */
    prepareMiddleware (params) {
        const app = express()

        function setNoCache (req, res, next) {
            res.set('Pragma', 'no-cache')
            res.set('Cache-Control', 'no-cache, no-store')
            next()
        }

        app.all('/suggest', setNoCache, async (req, res, next) => {
            if (!ALLOWED_METHODS.includes(req.method)) {
                res.send(404)
            }

            /**
             * User's search string
             * @type {?string}
             */
            const s = getReqParam(req, 's')

            /**
             * To skip normalization of results. If true - returns raw provider's result
             * @type {boolean}
             */
            const bypass = Boolean(getReqParam(req, 'bypass', false))

            /**
             * Sometimes we need to use different query parameters to providers
             * depending on different clients (mobile app, backend job, user runtime)
             * Examples:
             *   - `suggestHouse` -- used for create property from web
             * @type {string}
             */
            const context = String(getReqParam(req, 'context', ''))

            /**
             * Providers can improve results if they can connect multiple queries related to one client
             * @type {string}
             */
            const session = String(getReqParam(req, 'session', ''))

            /**
             * Number of results to return
             * @type {number|NaN}
             */
            const count = Number(getReqParam(req, 'count'))

            /**
             * Additional parameters for improving of the searching
             */
            const helpers = getReqJson(req, 'helpers', {})

            if (!s) {
                res.send(400)
                return
            }

            let suggestions = []

            // 1. Detect the suggestion provider
            const suggestionProvider = getSuggestionsProvider()

            // 2. Get suggestions array
            if (suggestionProvider) {
                const denormalizedSuggestions = await suggestionProvider.get({ query: s, session, context, count, helpers })
                suggestions = bypass ? denormalizedSuggestions : suggestionProvider.normalize(denormalizedSuggestions)
            }

            // 3. Inject some data not presented in provider
            if (!bypass) {
                const injectionsSeeker = new InjectionsSeeker(s)
                const denormalizedInjections = await injectionsSeeker.getInjections(await params.keystone.createContext({ skipAccessControl: true }))

                suggestions.unshift(...injectionsSeeker.normalize(denormalizedInjections))
                suggestions.sort((a, b) => {
                    // Sort only injections, because we try to keep the provider's sort ordering.
                    if (
                        get(a, ['provider', 'name']) === INJECTIONS_PROVIDER
                        || get(b, ['provider', 'name']) === INJECTIONS_PROVIDER
                    ) {
                        if (a.value < b.value) {
                            return -1
                        }

                        if (a.value > b.value) {
                            return 1
                        }
                    }

                    return 0
                })
            }

            res.json(suggestions)
        })

        return app
    }
}

module.exports = { SuggestionKeystoneApp }
