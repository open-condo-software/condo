const { generateAddressKey } = require('@address-service/domains/common/utils/addressKeyUtils')
const { SearchProviderDetector } = require('@address-service/domains/common/utils/services/search/SearchProviderDetector')
const express = require('express')
const get = require('lodash/get')
const { Address } = require('@address-service/domains/address/utils/serverSchema')

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
    prepareMiddleware ({ keystone, dev, distDir }) {
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
            const geo = String(get(req, ['query', 'geo'], ''))

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

            const denormalizedSuggestions = await searchProvider.get({ query: s, context })
            if (denormalizedSuggestions.length === 0) {
                res.send(404)
                return
            }
            const searchResult = searchProvider.normalize(denormalizedSuggestions)

            const addressKey = generateAddressKey(searchResult[0])

            const godContext = await keystone.createContext({ skipAccessControl: true })

            const addresses = await Address.getAll(godContext, { key: addressKey })

            let addressItem
            if (addresses.length === 0) {
                addressItem = await Address.create(godContext, {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'address-service' },
                    source: s,
                    address: searchResult[0].value,
                    key: addressKey,
                    meta: {
                        provider: {
                            name: searchProvider.getProviderName(),
                            rawData: denormalizedSuggestions[0],
                        },
                        data: get(searchResult, [0, 'data'], {}),
                    },
                })
            } else {
                addressItem = addresses[0]
            }

            res.json({
                addressSource: addressItem.source,
                address: addressItem.address,
                addressKey: addressItem.key,
                addressMeta: addressItem.meta, // todo return meta, normalized to dadata format
            })
        })

        return app
    }
}

module.exports = { SearchKeystoneApp }
