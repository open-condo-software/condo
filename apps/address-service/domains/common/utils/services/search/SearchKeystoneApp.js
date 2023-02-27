const express = require('express')
const get = require('lodash/get')
const set = require('lodash/set')

const { OVERRIDING_ROOT } = require('@address-service/domains/address/constants')

const { createReturnObject } = require('./searchServiceUtils')

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

        app.get(
            '/search',
            setNoCache,

            /**
             * @typedef {Object} ReqShapeQueryType
             * @property {string} [geo] Parameter to detect external data provider
             * @property {string} s search string
             * @property {string} [context] search context {@see apps/address-service/domains/common/constants/contexts.js}
             */

            /**
             * @param {{ query: ReqShapeQueryType }} req
             * @param res
             * @param next
             * @returns {Promise<void>}
             */
            async (req, res, next) => {
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
                const pluginParams = { searchContext, keystoneContext }

                const plugins = this.plugins.filter((plugin) => plugin.isEnabled(s, pluginParams))
                if (plugins.length === 0) {
                    // There is no plugins to process search request ¯\_(ツ)_/¯
                    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422
                    res.send(422)
                    return
                }

                let searchResult = null
                for (const plugin of plugins) {
                    // Return the first not empty plugin's result
                    // So, the plugins order is mandatory for performance
                    if (searchResult) {
                        break
                    }

                    searchResult = await plugin.prepare(pluginParams).search(s)
                }

                if (!searchResult) {
                    // Nothing found
                    res.send(404)
                    return
                }

                // Override the values if overrides were set
                let overridden = {}
                Object.entries(get(searchResult, 'overrides', {}) || {}).forEach(([path, value]) => {
                    // 1. Keep overridden value
                    set(overridden, path, get(searchResult, `${OVERRIDING_ROOT}.${path}`))
                    // 2. Do override
                    set(searchResult, `${OVERRIDING_ROOT}.${path}`, value)
                })

                res.json(await createReturnObject({
                    context: keystoneContext.sudo(),
                    addressModel: searchResult,
                    overridden,
                }))
            },
        )

        return app
    }
}

module.exports = { SearchKeystoneApp }
