const Big = require('big.js')
const dayjs = require('dayjs')
const { get, isEmpty, groupBy, pick } = require('lodash')

const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { AbstractDataLoader } = require('@condo/domains/analytics/utils/services/dataLoaders/AbstractDataLoader')
const { GqlWithKnexLoadList } = require('@condo/domains/common/utils/serverSchema')
const { GqlToKnexBaseAdapter } = require('@condo/domains/common/utils/serverSchema/GqlToKnexBaseAdapter')

const PERIOD_DATE_FORMAT = 'YYYY-MM-DD'
const DATE_FORMAT = {
    day: 'DD.MM.YYYY',
    week: 'DD.MM.YYYY',
    month: 'MMM, YYYY',
}

class PaymentGqlKnexLoader extends GqlToKnexBaseAdapter {
    aggregateBy = []
    constructor (where, groupBy) {
        super('Payment', where, groupBy)
        this.aggregateBy = ['dayGroup', ...this.groups]
    }

    async loadData () {
        this.result = null
        const { keystone } = await getSchemaCtx(this.domainName)
        const knex = keystone.adapter.knex

        const where = this.where.filter(condition => !this.isWhereInCondition(condition)).map(condition => {
            return Object.fromEntries(
                Object.entries(condition).map(([field, query]) => (
                    get(query, 'id') ? [field, query.id] : [field, query]
                ))
            )
        })
        this.whereIn = {}

        this.where.filter(this.isWhereInCondition).reduce((filter, currentFilter) => {
            const [groupName, groupCondition] = Object.entries(currentFilter)[0]
            const groupIdArray = get(groupCondition, 'id_in')
            const [filterEntities, filterValues] = filter

            if (!this.aggregateBy.includes(groupName)) {
                this.aggregateBy.push(groupName)
            }

            this.whereIn[groupName] = groupIdArray.map(id => [id])
            filterEntities.push(groupName)
            filterValues.push(...groupIdArray.map(id => [id]))
        }, [[], []])

        const query = knex(this.domainName).count('id').sum('amount').select(this.groups)
        query.select(knex.raw(`date_trunc('${this.dayGroup}', "createdAt") as "dayGroup"`))
        const knexWhere = where.reduce((acc, curr) => ({ ...acc, ...curr }), {})

        this.result = await query.groupBy(this.aggregateBy)
            .where(knexWhere)
            .whereBetween('createdAt', [this.dateRange.from, this.dateRange.to])
            .orderBy('dayGroup', 'asc')
    }
}

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

        const paymentGqlKnexLoader = new PaymentGqlKnexLoader(where, groupBy)
        await paymentGqlKnexLoader.loadData()
        const aggregatedPayments = paymentGqlKnexLoader.getResult()

        const payments = await paymentLoader.load()

        return { sum, payments, aggregatedPayments }
    }
}

module.exports = { PaymentDataLoader }
