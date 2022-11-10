const express = require('express')

const get = require('lodash/get')
const { SuggestionProviderDetector } = require('@address-service/domains/common/utils/services/suggest/SuggestionProviderDetector')

class SuggestionKeystoneApp {
    /**
     * @param {{ keystone, distDir, dev }} params
     * @returns {Express}
     */
    prepareMiddleware (params) {
        const app = express()
        const providerDetector = new SuggestionProviderDetector()

        function setNoCache (req, res, next) {
            res.set('Pragma', 'no-cache')
            res.set('Cache-Control', 'no-cache, no-store')
            next()
        }

        app.get('/suggest', setNoCache, async (req, res, next) => {
            /**
             * Using to detect a proper suggestion provider
             * @type {string}
             */
            const geo = String(get(req, ['query', 'geo'], null))

            /**
             * User's search string
             * @type {?string}
             */
            const s = get(req, ['query', 's'])

            /**
             * To skip normalization of results. If true - returns raw provider's result
             * @type {boolean}
             */
            const bypass = Boolean(get(req, ['query', 'bypass'], false))

            /**
             * Sometimes we need to use different query parameters to providers
             * depending on different clients (mobile app, backend job, user runtime)
             * @type {string}
             */
            const context = String(get(req, ['query', 'context'], ''))

            /**
             * Number of results to return
             * @type {number|NaN}
             */
            const count = Number(get(req, ['query', 'count'], undefined))

            if (!s) {
                res.send(400)
                return
            }

            // 1. Detect the suggestion provider
            const suggestionProvider = providerDetector.getProvider(geo)

            // 2. Get suggestions array
            const denormalizedSuggestions = await suggestionProvider.get({ query: s, context, count })
            const suggestions = bypass ? denormalizedSuggestions : suggestionProvider.normalize(denormalizedSuggestions)

            // 3. Inject some data not presented in provider
            if (!bypass) {
                const normalizedInjectingData = suggestionProvider.getInjections(s)
                suggestions.push(...normalizedInjectingData)
            }

            res.json(suggestions)
        })

        return app
    }
}

module.exports = { SuggestionKeystoneApp }
