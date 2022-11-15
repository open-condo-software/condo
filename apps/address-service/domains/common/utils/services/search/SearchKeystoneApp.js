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
     * @param {AbstractSearchPlugin[]} plugins
     */
    constructor (plugins) {
        this.plugins = plugins
    }

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
        if (this.plugins.length === 0) {
            throw new Error('You must add at least one search plugin!')
        }

        const app = express()

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
            const searchContext = String(get(req, ['query', 'context'], ''))

            if (!s) {
                res.send(400)
                return
            }

            const keystoneContext = await keystone.createContext()
            const pluginParams = { geo, searchContext, keystoneContext }

            const plugins = this.plugins.filter((plugin) => plugin.isEnabled(s, pluginParams))
            if (plugins.length === 0) {
                // There is no plugins to process search request ¯\_(ツ)_/¯
                // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422
                res.send(422)
                return
            }

            const searchResult = []
            for (const plugin of plugins) {
                // Return the first not empty plugin's result
                // So, the plugins order is mandatory for performance
                if (searchResult.length > 0) {
                    break
                }
                const pluginResult = await plugin.prepare(pluginParams).search(s)
                searchResult.push(...pluginResult)
            }

            if (searchResult.length === 0) {
                // Nothing found
                res.send(404)
                return
            }

            res.json(searchResult.map(this.createReturnObject))
        })

        return app
    }
}

module.exports = { SearchKeystoneApp }
