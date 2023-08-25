const Big = require('big.js')
const dayjs = require('dayjs')
const { get, omit } = require('lodash')

const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { AbstractDataLoader } = require('@condo/domains/analytics/utils/services/dataLoaders/AbstractDataLoader')
const { BillingIntegrationOrganizationContext } = require('@condo/domains/billing/utils/serverSchema')
const { GqlWithKnexLoadList } = require('@condo/domains/common/utils/serverSchema')
const { GqlToKnexBaseAdapter } = require('@condo/domains/common/utils/serverSchema/GqlToKnexBaseAdapter')
const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/miniapp/constants')

const PERIOD_DATE_FORMAT = 'YYYY-MM-DD'

class ReceiptGqlKnexLoader extends GqlToKnexBaseAdapter {
    aggregateBy = []
    constructor (where, groupBy) {
        super('BillingReceipt', where, groupBy)
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

        const query = knex(this.domainName).count('id').sum('charge').select(this.groups)
        query.select(knex.raw('to_char("period", \'01.MM.YYYY\') as "dayGroup"'))
        const knexWhere = where.reduce((acc, curr) => ({ ...acc, ...curr }), {})

        this.result = await query.groupBy(this.aggregateBy)
            .where(knexWhere)
            .whereNotNull('charge')
            .whereIn(Object.keys(this.whereIn), Object.values(this.whereIn)[0])
            .whereBetween('period', [this.dateRange.from, this.dateRange.to])
            .orderBy('dayGroup', 'asc')
    }
}

class ReceiptDataLoader extends AbstractDataLoader {
    async get ({ where, groupBy }) {
        const billingIntegrationOrganizationContexts = await BillingIntegrationOrganizationContext.getAll(this.context, {
            organization: where.organization,
            status: CONTEXT_FINISHED_STATUS,
            deletedAt: null,
        })

        const billingReceiptContextWhereFilter = { context: { id_in: billingIntegrationOrganizationContexts.map(({ id }) => id) } }

        const receiptMonthSumLoader = new GqlWithKnexLoadList({
            listKey: 'BillingReceipt',
            fields: 'id',
            where: {
                AND: [
                    { period_gte: dayjs().startOf('month').format(PERIOD_DATE_FORMAT) },
                    { period_lte: dayjs().endOf('month').format(PERIOD_DATE_FORMAT) },
                ],
                charge_not: null,
                ...billingReceiptContextWhereFilter,
                deletedAt: null,
            },
        })

        const receiptIds = await receiptMonthSumLoader.load()
        const sumAggregate = await receiptMonthSumLoader.loadAggregate('SUM(charge) as "chargeSum"', receiptIds.map(({ id }) => id))
        const sum = new Big(sumAggregate.chargeSum || 0).toFixed(2)

        const receiptsLoader = new ReceiptGqlKnexLoader({
            ...omit(where, ['organization']),
            ...billingReceiptContextWhereFilter,
        }, groupBy)

        await receiptsLoader.loadData()
        const receipts = receiptsLoader.getResult(({ sum, ...searchResult }) => ({
            sum: new Big(sum || 0).toFixed(2),
            ...searchResult,
        }))

        return { sum, receipts }
    }
}

module.exports = { ReceiptDataLoader }
