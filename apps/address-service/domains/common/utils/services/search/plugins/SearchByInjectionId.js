const { AbstractSearchPlugin } = require('./AbstractSearchPlugin')
const { InjectionsSeeker } = require('@address-service/domains/common/utils/services/InjectionsSeeker')
const { AddressInjection } = require('@address-service/domains/address/utils/serverSchema')
const get = require('lodash/get')
const { generateAddressKey } = require('@address-service/domains/common/utils/addressKeyUtils')
const { INJECTIONS_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { validate: validateUuid } = require('uuid')
const { createOrUpdateAddressWithSource } = require('@address-service/domains/common/utils/services/search/searchServiceUtils')

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
        const dvSender = {
            dv: 1,
            sender: { dv: 1, fingerprint: `address-service-search-${this.constructor.name}` },
        }

        const injection = await AddressInjection.getOne(this.keystoneContext.sudo(), { id })
        if (!injection) {
            return null
        }

        const searchResult = injectionsSeeker.normalize([injection])

        const addressKey = generateAddressKey(searchResult[0])

        return await createOrUpdateAddressWithSource(
            godContext,
            {
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
            },
            s,
            dvSender,
        )
    }
}

module.exports = { SearchByInjectionId }
