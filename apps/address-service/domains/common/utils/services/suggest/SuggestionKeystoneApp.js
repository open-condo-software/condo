const express = require('express')

const get = require('lodash/get')
const { SuggestionProviderDetector } = require('@address-service/domains/common/utils/services/suggest/SuggestionProviderDetector')

class SuggestionKeystoneApp {
    /**
     * @param params
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
             * We need different query parameters for server side and for client side
             * At least for dadata
             * @type {boolean}
             */
            const serverSide = Boolean(get(req, ['query', 'serverSide'], false))

            /**
             * Number of results to return
             * @type {number}
             */
            const count = Number(get(req, ['query', 'count'], 20))

            if (!s) {
                res.send(400)
                return
            }

            // 1. Detect the suggestion provider
            const suggestionProvider = providerDetector.getProvider(geo)

            // 2. Get suggestions array
            const denormalizedSuggestions = await suggestionProvider.get({ query: s, isServerSide: serverSide, count })
            const suggestions = bypass ? denormalizedSuggestions : suggestionProvider.normalize(denormalizedSuggestions)

            // 3. Inject some data not presented in provider
            const normalizedInjectingData = suggestionProvider.getInjections(s)
            suggestions.push(...(bypass ? suggestionProvider.denormalize(normalizedInjectingData) : normalizedInjectingData))

            res.json(suggestions)
        })

        return app
    }
}

module.exports = { SuggestionKeystoneApp }
