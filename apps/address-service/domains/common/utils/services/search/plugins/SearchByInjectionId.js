const { AbstractSearchPlugin } = require('@address-service/domains/common/utils/services/search/AbstractSearchPlugin')
const { Address } = require('@address-service/domains/address/utils/serverSchema')
const { InjectionsSeeker } = require('@address-service/domains/common/utils/services/InjectionsSeeker')
const { AddressInjection } = require('@address-service/domains/address/utils/serverSchema')
const get = require('lodash/get')
const { generateAddressKey } = require('@address-service/domains/common/utils/addressKeyUtils')

const SEPARATOR = ':'
const UUID_REGEX = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/

class SearchByInjectionId extends AbstractSearchPlugin {

    isEnabled (s, params) {
        const [type, id] = s.split(SEPARATOR, 2)

        return type === 'injectionId' && UUID_REGEX.test(id)
    }

    /**
     * @param s
     * @returns {Promise<Object[]>}
     */
    async search (s) {
        const [, id] = s.split(SEPARATOR, 2)
        const injectionsSeeker = new InjectionsSeeker(s)
        const godContext = this.keystoneContext.sudo()

        const injection = await AddressInjection.getOne(this.keystoneContext.sudo(), { id })
        const searchResult = injectionsSeeker.normalize([injection])

        const addressKey = generateAddressKey(searchResult[0])

        const addressFoundByKey = await Address.getOne(godContext, { key: addressKey })

        let addressItem
        if (addressFoundByKey) {
            // todo(AleX83Xpert): Update existing model or not? That's the question.
            addressItem = addressFoundByKey
        } else {
            addressItem = await Address.create(
                godContext,
                {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'address-service' },
                    source: s,
                    address: searchResult[0].label,
                    key: addressKey,
                    meta: {
                        provider: {
                            name: 'injection',
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
