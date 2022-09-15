const { generateAddressKey } = require('@address-service/domains/common/utils/addressKeyUtils')
const { SearchProviderDetector } = require('@address-service/domains/common/utils/services/search/SearchProviderDetector')
const express = require('express')
const get = require('lodash/get')

/**
 * @typedef {Object} AddressSearchResult
 * @property {string} addressSource
 * @property {string} address
 * @property {string} addressKey
 * @property {Object} addressMeta
 */

class SearchKeystoneApp {
    /**
     * @param params
     * @returns {Express}
     */
    prepareMiddleware (params) {
        const app = express()
        const searchDetector = new SearchProviderDetector()

        function setNoCache (req, res, next) {
            res.set('Pragma', 'no-cache')
            res.set('Cache-Control', 'no-cache, no-store')
            next()
        }

        app.get('/search', setNoCache, async (req, res, next) => {
            /**
             * Using to detect a proper suggestion provider
             * @type {string}
             */
            const geo = String(get(req, ['query', 'geo'], null))

            /**
             * User's search string
             * @type {string}
             */
            const s = get(req, ['query', 's'])

            /**
             * Sometimes we need to use different query parameters to providers
             * depending on different clients (mobile app, backend job, user runtime)
             * @type {string}
             */
            const context = String(get(req, ['query', 'context'], ''))

            if (!s) {
                res.send(400)
                return
            }

            const searchProvider = searchDetector.getProvider(geo)

            const denormalizedSuggestions = await searchProvider.get({ query: s, context, count: 1 })
            if (denormalizedSuggestions.length === 0) {
                res.send(404)
                return
            }
            const searchResult = searchProvider.normalize(denormalizedSuggestions)

            const addressKey = generateAddressKey(searchResult[0])

            //TODO(nas) save model to the database after schema will be created
            
            //TODO(nas) search in database by address key

            res.json({
                addressSource: s,
                address: searchResult[0].value,
                addressKey,
                addressMeta: {
                    provider: {
                        name: searchProvider.getProviderName(),
                        data: denormalizedSuggestions[0],
                    },
                },
            })
        })

        return app
    }
}

module.exports = { SearchKeystoneApp }
