const { get, isEmpty } = require('lodash')

const { AbstractDataLoader } = require('@condo/domains/analytics/utils/services/dataLoaders/AbstractDataLoader')
const { GqlWithKnexLoadList } = require('@condo/domains/common/utils/serverSchema')

class PaymentDataLoader extends AbstractDataLoader {
    async get ({ where, groupBy }) {
        const residentLoader = new GqlWithKnexLoadList({
            listKey: 'Payment',
            fields: 'explicitFee explicitServiceCharge amount status',
            where: where,
        })

        return await residentLoader.load()
    }
}

module.exports = { PaymentDataLoader }
