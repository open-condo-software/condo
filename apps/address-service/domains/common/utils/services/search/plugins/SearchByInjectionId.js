const get = require('lodash/get')
const { validate: validateUuid } = require('uuid')

const { AddressInjection } = require('@address-service/domains/address/utils/serverSchema')
const { Address, AddressSource } = require('@address-service/domains/address/utils/serverSchema')
const { INJECTIONS_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { generateAddressKey } = require('@address-service/domains/common/utils/addressKeyUtils')
const { InjectionsSeeker } = require('@address-service/domains/common/utils/services/InjectionsSeeker')
const { createOrUpdateAddressWithSource } = require('@address-service/domains/common/utils/services/search/searchServiceUtils')

const { AbstractSearchPlugin } = require('./AbstractSearchPlugin')

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
     * @returns {Promise<?Object>}
     */
    async search (s) {
        const [, id] = s.split(SEPARATOR, 2)
        const injectionsSeeker = new InjectionsSeeker(s)
        const godContext = this.keystoneContext.sudo()
        const dvSender = this.getDvAndSender(this.constructor.name)

        const injection = await AddressInjection.getOne(this.keystoneContext.sudo(), { id, deletedAt: null })
        if (!injection) {
            return null
        }

        const searchResult = injectionsSeeker.normalize([injection])

        const addressKey = generateAddressKey(searchResult[0])

        const addressData = {
            address: searchResult[0].value,
            key: addressKey,
            meta: {
                provider: {
                    name: INJECTIONS_PROVIDER,
                    rawData: injection,
                },
                value: searchResult[0].value,
                unrestricted_value: searchResult[0].unrestricted_value,
                data: get(searchResult, [0, 'data'], {}),
            },
        }

        return await createOrUpdateAddressWithSource(
            godContext,
            Address,
            AddressSource,
            addressData,
            s,
            dvSender,
        )
    }
}

module.exports = { SearchByInjectionId }
