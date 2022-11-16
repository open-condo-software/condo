const { AbstractSearchPlugin } = require('@address-service/domains/common/utils/services/search/AbstractSearchPlugin')
const { Address } = require('@address-service/domains/address/utils/serverSchema')
const { InjectionsSeeker } = require('@address-service/domains/common/utils/services/InjectionsSeeker')
const { AddressInjection } = require('@address-service/domains/address/utils/serverSchema')
const get = require('lodash/get')
const { generateAddressKey } = require('@address-service/domains/common/utils/addressKeyUtils')
const { INJECTIONS_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { validate: validateUuid } = require('uuid')

const SEPARATOR = ':'

class SearchByInjectionId extends AbstractSearchPlugin {

    /**
     * @param {String} s
     * @param {SearchPluginParams} params
     * @returns {boolean}
     */
    isEnabled (s, params) {
        const [type, id] = s.split(SEPARATOR, 2)

        return type === 'injectionId' && validateUuid(id)
    }

    /**
     * @param {String} s
     * @returns {Promise<Object[]>}
     */
    async search (s) {
        const [, id] = s.split(SEPARATOR, 2)
        const injectionsSeeker = new InjectionsSeeker(s)
        const godContext = this.keystoneContext.sudo()
        const dvSender = {
            dv: 1,
            sender: { dv: 1, fingerprint: `address-service-search-${this.constructor.name}` },
        }

        const injection = await AddressInjection.getOne(this.keystoneContext.sudo(), { id })
        const searchResult = injectionsSeeker.normalize([injection])

        const addressKey = generateAddressKey(searchResult[0])

        const addressFoundByKey = await Address.getOne(godContext, { key: addressKey })

        let addressItem
        if (addressFoundByKey) {
            addressItem = addressFoundByKey
            if (!addressFoundByKey.sources.map(({ source }) => source).includes(s)) {
                addressItem = await Address.update(
                    godContext,
                    addressFoundByKey.id,
                    {
                        sources: { create: { source: s, ...dvSender } },
                        ...dvSender,
                    },
                )
            }
        } else {
            addressItem = await Address.create(
                godContext,
                {
                    ...dvSender,
                    source: s,
                    address: searchResult[0].label,
                    key: addressKey,
                    meta: {
                        provider: {
                            name: INJECTIONS_PROVIDER,
                            rawData: injection,
                        },
                        data: get(searchResult, [0, 'data'], {}),
                    },
                },
            )
        }

        return [addressItem]
    }
}

module.exports = { SearchByInjectionId }
