const Big = require('big.js')
const dayjs = require('dayjs')
const { get, isEmpty, pick } = require('lodash')

const { AbstractDataLoader } = require('@condo/domains/analytics/utils/services/dataLoaders/AbstractDataLoader')
const { GqlWithKnexLoadList } = require('@condo/domains/common/utils/serverSchema')

const PERIOD_DATE_FORMAT = 'YYYY-MM-DD'

class PaymentDataLoader extends AbstractDataLoader {
    async get ({ where, groupBy }) {
        // explicitFee explicitServiceCharge amount status
        const paymentMonthSumLoader = new GqlWithKnexLoadList({
            listKey: 'Payment',
            fields: 'id',
            where: {
                ...pick(where, ['organization', 'status_in']),
                AND: [{ period_gte: dayjs().startOf('month').format(PERIOD_DATE_FORMAT) }, { period_lte: dayjs().endOf('month').format(PERIOD_DATE_FORMAT) }],
            },
        })

        const paymentIds = await paymentMonthSumLoader.load()
        const sumAggregate = await paymentMonthSumLoader.loadAggregate('SUM(amount) as "amountSum"', paymentIds.map(({ id })=> id))

        const sum = Big(sumAggregate.amountSum || 0).toFixed(2)

        const paymentLoader = new GqlWithKnexLoadList({
            listKey: 'Payment',
            fields: 'id amount createdAt period',
            where,
            sortBy: ['period_ASC'],
        })

        const payments = await paymentLoader.load()

        return { sum, payments }
    }
}

module.exports = { PaymentDataLoader }
