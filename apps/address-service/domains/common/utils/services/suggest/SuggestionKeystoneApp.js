const express = require('express')

const get = require('lodash/get')
const { getSuggestionsProvider } = require('@address-service/domains/common/utils/services/providerDetectors')
const { InjectionsSeeker } = require('@address-service/domains/common/utils/services/InjectionsSeeker')

const ALLOWED_METHODS = ['GET', 'POST']

class SuggestionKeystoneApp {
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

            const reqQuery = get(req, 'query', {})
            const reqBody = get(req, 'body', {})

            /**
             * @param {string} param Parameter to extract from body or query
             * @param {*} [defaultValue] Default value
             */
            const getParam = (param, defaultValue) => get(reqBody, param, get(reqQuery, param, defaultValue))

            /**
             * Using to detect a proper suggestion provider
             * @type {string}
             */
            const geo = String(getParam('geo', null))

            /**
             * User's search string
             * @type {?string}
             */
            const s = getParam('s')

            /**
             * To skip normalization of results. If true - returns raw provider's result
             * @type {boolean}
             */
            const bypass = Boolean(getParam('bypass', false))

            /**
             * Sometimes we need to use different query parameters to providers
             * depending on different clients (mobile app, backend job, user runtime)
             * @type {string}
             */
            const context = String(getParam('context', ''))

            /**
             * Number of results to return
             * @type {number|NaN}
             */
            const count = Number(getParam('count'))

            /**
             * Additional parameters for improving of the searching
             */
            const helpers = getParam('helpers', {})

            if (!s) {
                res.send(400)
                return
            }

            // 1. Detect the suggestion provider
            const suggestionProvider = getSuggestionsProvider(geo)

            // 2. Get suggestions array
            const denormalizedSuggestions = await suggestionProvider.get({ query: s, context, count, helpers })
            const suggestions = bypass ? denormalizedSuggestions : suggestionProvider.normalize(denormalizedSuggestions)

            // 3. Inject some data not presented in provider
            if (!bypass) {
                const injectionsSeeker = new InjectionsSeeker(s)
                const denormalizedInjections = await injectionsSeeker.getInjections(await params.keystone.createContext({ skipAccessControl: true }))

                suggestions.unshift(...injectionsSeeker.normalize(denormalizedInjections))
            }

            res.json(suggestions)
        })

        return app
    }
}

module.exports = { SuggestionKeystoneApp }
