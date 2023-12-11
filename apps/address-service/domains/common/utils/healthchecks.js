const { get } = require('lodash')

const conf = require('@open-condo/config')

const { DADATA_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { DadataSuggestionProvider } = require('@address-service/domains/common/utils/services/suggest/providers/DadataSuggestionProvider')

const getAddressProviderBalanceHealthCheck = () => {
    return {
        name: 'address-provider-balance',
        prepare: () => {
            const provider = get(conf, 'PROVIDER')

            if (provider === DADATA_PROVIDER) {
                this.addressProvider = new DadataSuggestionProvider()
            } else {
                this.addressProvider = null
            }
        },
        run: async () => {
            if (!this.addressProvider) return false

            return await this.addressProvider.profileBalance()
        },
    }
}

const getAddressProviderLimitHealthCheck = () => {
    return {
        name: 'address-provider-daily-limit',
        prepare: () => {
            const provider = get(conf, 'PROVIDER')
            if (provider === DADATA_PROVIDER) {
                this.addressProvider = new DadataSuggestionProvider()
            } else {
                this.addressProvider = null
            }
        },
        run: async () => {
            if (!this.addressProvider) return false

            return await this.addressProvider.dailyStatistics()
        },
    }
}

module.exports = {
    getAddressProviderBalanceHealthCheck,
    getAddressProviderLimitHealthCheck,
}
