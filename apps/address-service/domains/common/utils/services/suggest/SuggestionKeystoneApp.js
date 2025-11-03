const express = require('express')
const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging')

const { INJECTIONS_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { appendDbAddressesToSuggestions } = require('@address-service/domains/common/utils/services/appendDbAddressesToSuggestions')
const { InjectionsSeeker } = require('@address-service/domains/common/utils/services/InjectionsSeeker')
const { getSuggestionsProvider } = require('@address-service/domains/common/utils/services/providerDetectors')

/**
 * @typedef {Object} NormalizedSuggestion
 * @property {string} value
 * @property {string} rawValue
 */

const SUGGEST_ENDPOINT = '/suggest'

/**
 * @param {IncomingMessage} req express request
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
        // this route can not be used for csrf attack (a public route)
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()

        function setNoCache (req, res, next) {
            res.set('Pragma', 'no-cache')
            res.set('Cache-Control', 'no-cache, no-store')
            next()
        }

        const processRequest = async (req, res, next) => {
            const godContext = await params.keystone.createContext({ skipAccessControl: true })

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
             * The language code, indicating in which language the results should be returned, if possible.
             * Searches are also biased to the selected language; results in the selected language may be given a higher ranking.
             * If language is not supplied, the Places service will attempt to use the native language of the domain from which the request is sent.
             */
            const language = String(getReqParam(req, 'language', ''))

            /**
             * Number of results to return
             * @type {number|NaN}
             */
            const count = Number(getReqParam(req, 'count'))

            /**
             * Additional parameters for improving of the searching
             */
            const helpers = getReqJson(req, 'helpers', {})

            /**
             * Whether the suggestion provider should include addresses from the DB
             * in addition to the address suggestions.
             * Default: false
             * @type {boolean}
             */
            const includeDbAddress = getReqParam(req, 'include_db_address', 'false') === 'true'

            if (!s) {
                this.logger.warn({ msg: 'No string to search suggestions', reqId: req.id })
                res.sendStatus(400)
                return
            }

            let suggestions = []

            // 1. Detect the suggestion provider
            const suggestionProvider = getSuggestionsProvider({ req })

            // 2. Get suggestions array
            if (suggestionProvider) {
                const denormalizedSuggestions = await suggestionProvider.get({
                    query: s,
                    session,
                    context,
                    language,
                    count,
                    helpers,
                })

                // TODO(DOMA-7276): Think about splitting the address string to tokens, compile 2nd variant of address and pass to suggestion provider

                suggestions = bypass ? denormalizedSuggestions : suggestionProvider.normalize(denormalizedSuggestions)
            }

            // 3. Inject some data not presented in provider
            if (!bypass) {
                const injectionsSeeker = new InjectionsSeeker(s)
                const denormalizedInjections = await injectionsSeeker.getInjections(godContext)

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

            // 4. Augment suggestions with DB addresses the provider did not return
            if (includeDbAddress) {
                suggestions = await appendDbAddressesToSuggestions(godContext, suggestions)
            }

            res.json(suggestions)
        }

        app.get(SUGGEST_ENDPOINT, setNoCache, processRequest)
        app.post(SUGGEST_ENDPOINT, setNoCache, processRequest)

        return app
    }
}

module.exports = { SuggestionKeystoneApp }
