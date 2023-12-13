const { get } = require('lodash')

const conf = require('@open-condo/config')

const { DADATA_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { DadataHealthChecker } = require('@address-service/domains/common/utils/services/DadataHealthChecker')

const prepareAddressServiceHealthcheck = () => {
    const provider = get(conf, 'PROVIDER')

    if (provider === DADATA_PROVIDER) {
        this.healthChecker = new DadataHealthChecker()
    } else {
        this.healthChecker = null
    }
}

const getAddressProviderBalanceHealthCheck = () => ({
    name: 'address-provider-balance',
    prepare: prepareAddressServiceHealthcheck,
    run: async () => {
        if (!this.healthChecker) return true

        return await this.healthChecker.profileBalance()
    },
})

const getAddressProviderLimitHealthCheck = () => ({
    name: 'address-provider-daily-limit',
    prepare: prepareAddressServiceHealthcheck,
    run: async () => {
        if (!this.healthChecker) return true

        return await this.healthChecker.dailyStatistics()
    },
})

module.exports = {
    getAddressProviderBalanceHealthCheck,
    getAddressProviderLimitHealthCheck,
}
