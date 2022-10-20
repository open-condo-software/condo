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
     * Converts the `Address` model to service response
     * @param addressModel
     * @returns {{addressSource, address, addressKey, addressMeta}}
     */
    createReturnObject (addressModel) {
        return {
            addressSource: addressModel.source,
            address: addressModel.address,
            addressKey: addressModel.key,
            addressMeta: addressModel.meta,
        }
    }

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

            // Manually created internal context. The first rule is no rules.
            const godContext = await keystone.createContext({ skipAccessControl: true })

            // We want to return the same result for the same source. This is the address cache, baby!
            const addressFoundBySource = await Address.getOne(godContext, { source: s })
            if (addressFoundBySource) {
                res.json(this.createReturnObject(addressFoundBySource))
                return
            }

            const searchProvider = searchDetector.getProvider(geo)

            const denormalizedSuggestions = await searchProvider.get({ query: s, context })
            if (denormalizedSuggestions.length === 0) {
                res.send(404)
                return
            }
            const searchResult = searchProvider.normalize(denormalizedSuggestions)

            // Use the first result for a while
            const addressKey = generateAddressKey(searchResult[0])

            const addressFoundByKey = await Address.getOne(godContext, { key: addressKey })

            let addressItem
            if (addressFoundByKey) {
                // todo(nas): Update existing model or not? That's the question.
                addressItem = addressFoundByKey
            } else {
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
            }

            res.json(this.createReturnObject(addressItem))
        })

        return app
    }
}

module.exports = { SearchKeystoneApp }
