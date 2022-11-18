const express = require('express')
const get = require('lodash/get')
const { generateAddressKey } = require('@address-service/domains/common/utils/addressKeyUtils')
const { Address } = require('@address-service/domains/address/utils/serverSchema')

class MainKeystoneApp {

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

        function setNoCache (req, res, next) {
            res.set('Pragma', 'no-cache')
            res.set('Cache-Control', 'no-cache, no-store')
            next()
        }

        /**
         * This endpoint used to create a new property or update the existing one
         */
        app.post('/add', setNoCache, async (req, res, next) => {
            /**
             * Using to detect a proper suggestion provider
             * @type {{source: string, value: Object, token: string}}
             */
            const data = get(req, 'body')

            /**
             * token used for base security purposes. It restricts to add a new address from outside
             * @type {string}
             */
            const token = get(data, 'token')

            // TODO(AleX83Xpert) maybe add token to .env and use it to backend-backend queries

            /**
             * The address source
             * @type {string}
             */
            const source = get(data, 'source')

            if (!source) {
                throw new Error('body.source is empty')
            }

            /**
             * Normalized data got from suggestion service via frontend
             * The `address` field got from apps/condo/domains/property/components/AddressSuggestionsSearchInput.tsx:66
             * @type {{address: string} & NormalizedBuilding}
             */
            const value = get(data, 'value')

            if (!value) {
                throw new Error('body.value is empty')
            }

            const keystoneContext = await keystone.createContext()
            const godContext = keystoneContext.sudo()
            const dvSender = {
                dv: 1,
                sender: { dv: 1, fingerprint: `address-service-${this.constructor.name}` },
            }

            const addressKey = generateAddressKey(value)

            const addressFoundByKey = await Address.getOne(godContext, { key: addressKey, deletedAt: null })

            let addressItem
            if (addressFoundByKey) {
                addressItem = addressFoundByKey
                if (!addressFoundByKey.sources.map(({ source }) => source).includes(source)) {
                    addressItem = await Address.update(
                        godContext,
                        addressFoundByKey.id,
                        {
                            sources: { create: { source, ...dvSender } },
                            ...dvSender,
                        },
                    )
                }
            } else {
                addressItem = await Address.create(
                    godContext,
                    {
                        ...dvSender,
                        sources: {
                            create: {
                                source,
                                ...dvSender,
                            },
                        },
                        address: value.value,
                        key: addressKey,
                        meta: value,
                    },
                )
            }


            res.json(this.createReturnObject(addressItem))
        })

        return app
    }
}

module.exports = { MainKeystoneApp }
