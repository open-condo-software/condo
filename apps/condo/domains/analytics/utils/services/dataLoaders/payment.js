const Big = require('big.js')
const { get, isEmpty } = require('lodash')

const { AbstractDataLoader } = require('@condo/domains/analytics/utils/services/dataLoaders/AbstractDataLoader')
const { GqlWithKnexLoadList } = require('@condo/domains/common/utils/serverSchema')

class PaymentDataLoader extends AbstractDataLoader {
    async get ({ where, groupBy }) {
        // explicitFee explicitServiceCharge amount status
        const paymentLoader = new GqlWithKnexLoadList({
            listKey: 'Payment',
            fields: 'id',
            where: where,
        })

        const paymentIds = await paymentLoader.load()
        const sumAggregate = await paymentLoader.loadAggregate('SUM(amount) as "amountSum"', paymentIds.map(({ id })=> id))

        const sum = Big(sumAggregate.amountSum || 0).toFixed(2)

        return { sum }
    }
}

module.exports = { PaymentDataLoader }
