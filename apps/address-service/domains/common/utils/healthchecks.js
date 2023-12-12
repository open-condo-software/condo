const { v4: uuid } = require('uuid')

const { DADATA_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { getSuggestionsProvider } = require('@address-service/domains/common/utils/services/providerDetectors')

const prepareAddressServiceHealthcheck = () => {
    const provider = getSuggestionsProvider({ req: { id: uuid() } })

    return provider.getProviderName() === DADATA_PROVIDER ? provider : null
}

const getAddressProviderBalanceHealthCheck = () => ({
    name: 'address-provider-balance',
    run: async () => {
        const provider = prepareAddressServiceHealthcheck()
        if (!provider) return false

        return await provider.profileBalance()
    },
})

const getAddressProviderLimitHealthCheck = () => ({
    name: 'address-provider-daily-limit',
    run: async () => {
        const provider = prepareAddressServiceHealthcheck()
        if (!provider) return false

        return await provider.dailyStatistics()
    },
})

module.exports = {
    getAddressProviderBalanceHealthCheck,
    getAddressProviderLimitHealthCheck,
}
