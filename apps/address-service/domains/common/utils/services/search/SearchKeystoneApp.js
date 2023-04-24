const express = require('express')
const get = require('lodash/get')
const set = require('lodash/set')

const { getLogger } = require('@open-condo/keystone/logging')

const { OVERRIDING_ROOT } = require('@address-service/domains/address/constants')
const { AddressFromStringParser } = require('@address-service/domains/common/utils/parseAddressesFromString')
const { getSearchProvider } = require('@address-service/domains/common/utils/services/providerDetectors')

const { createReturnObject } = require('./searchServiceUtils')

const SEARCH_ERROR_COMMON = 'SEARCH_ERROR_COMMON'
const SEARCH_ERROR_NO_PLUGINS = 'SEARCH_ERROR_NO_PLUGINS'
const SEARCH_ERROR_NOT_FOUND = 'SEARCH_ERROR_NOT_FOUND'

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
        this.logger = getLogger(this.constructor.name)
    }

    /**
     * @param params
     * @returns {Express}
     */
    prepareMiddleware ({ keystone, dev, distDir }) {

        // check for provider is configured
        const provider = getSearchProvider()
        if (!provider) {
            this.logger.warn('⚠️ No provider set. Use only local database for addresses searching')
        }

        if (this.plugins.length === 0) {
            throw new Error('You must add at least one search plugin!')
        }

        let keystoneContext

        const app = express()

        function setNoCache (req, res, next) {
            res.set('Pragma', 'no-cache')
            res.set('Cache-Control', 'no-cache, no-store')
            next()
        }

        /**
         * @param {string} searchContext
         * @param {IncomingMessage & {id: string}} req
         * @param {string} s
         * @param {SuggestionHelpersType} helpers
         * @returns {Promise<{[err]: string, [data]: string|{address: string, addressKey: string, addressMeta: NormalizedBuilding, addressSources: string[]}}>}
         */
        const searchAddress = async ({ searchContext, req, s, helpers = {} }) => {
            if (!keystoneContext) {
                keystoneContext = await keystone.createContext()
            }

            const pluginParams = { searchContext, keystoneContext, req, helpers }

            const plugins = this.plugins.filter((plugin) => plugin.isEnabled(s, pluginParams))
            if (plugins.length === 0) {
                return { err: SEARCH_ERROR_NO_PLUGINS }
            }

            let searchResult = null
            try {
                for (const plugin of plugins) {
                    // Return the first not empty plugin's result
                    // So, the plugins order is mandatory for performance
                    if (searchResult) {
                        break
                    }

                    searchResult = await plugin.prepare(pluginParams).search(s)
                }
            } catch (e) {
                return { err: SEARCH_ERROR_COMMON, data: e.message }
            }

            if (!searchResult) {
                // Nothing found
                return { err: SEARCH_ERROR_NOT_FOUND }
            }

            // Override the values if overrides were set
            let overridden = {}
            Object.entries(get(searchResult, 'overrides', {}) || {}).forEach(([path, value]) => {
                // 1. Keep overridden value
                set(overridden, path, get(searchResult, `${OVERRIDING_ROOT}.${path}`))
                // 2. Do override
                set(searchResult, `${OVERRIDING_ROOT}.${path}`, value)
            })

            return {
                data: await createReturnObject({
                    context: keystoneContext.sudo(),
                    addressModel: searchResult,
                    overridden,
                }),
            }
        }

        app.get(
            '/search',
            setNoCache,

            /**
             * @typedef {Object} ReqShapeQueryType
             * @property {string} s search string
             * @property {string} [context] search context {@see apps/address-service/domains/common/constants/contexts.js}
             */

            /**
             * @param {{ query: ReqShapeQueryType } & IncomingMessage & {id: String}} req
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

                const searchResult = await searchAddress({ searchContext, req, s })
                const err = get(searchResult, 'err')
                if (err) {
                    switch (err) {
                        case SEARCH_ERROR_NO_PLUGINS:
                            // There is no plugins to process search request ¯\_(ツ)_/¯
                            // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422
                            res.sendStatus(422)
                            break
                        case SEARCH_ERROR_NOT_FOUND:
                            res.sendStatus(404)
                            break
                        default:
                            res.sendStatus(400)
                    }
                    return
                }

                res.json(get(searchResult, 'data'))
            },
        )

        app.post(
            '/bulkSearch',
            setNoCache,

            /**
             * @typedef {Object} BulkReqShapeQueryType
             * @property {string[]} items search string
             * @property {string} [context] search context {@see apps/address-service/domains/common/constants/contexts.js}
             */

            /**
             * @param {{ body: BulkReqShapeQueryType } & IncomingMessage & {id: String}} req
             * @param res
             * @param next
             * @returns {Promise<void>}
             */
            async (req, res, next) => {
                /** @type {String[]} */
                const items = get(req, ['body', 'items'])

                if (!items) {
                    res.sendStatus(400)
                    return
                }

                const searchContext = String(get(req, ['body', 'context'], ''))

                /**
                 * Additional parameters for improving of the searching
                 */
                const helpers = get(req, ['body', 'helpers'], {})

                let result = {}
                const parser = new AddressFromStringParser()

                for (const item of items) {
                    // Extract unitType and unitName
                    const { address, unit: unitName, unitType } = parser.parse(item)

                    result[item] = {
                        address: await searchAddress({ searchContext, req, s: address, helpers }),
                        unitType,
                        unitName,
                    }
                }

                res.json(result)
            },
        )

        return app
    }
}

module.exports = { SearchKeystoneApp }
