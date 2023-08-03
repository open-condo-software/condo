const Big = require('big.js')
const { get, pick } = require('lodash')

const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS } = require('@condo/domains/acquiring/constants/payment')
const { AbstractDataLoader } = require('@condo/domains/analytics/utils/services/dataLoaders/AbstractDataLoader')
const { GqlWithKnexLoadList } = require('@condo/domains/common/utils/serverSchema')
const { GqlToKnexBaseAdapter } = require('@condo/domains/common/utils/serverSchema/GqlToKnexBaseAdapter')

class BillingResidentKnexLoader extends GqlToKnexBaseAdapter {
    constructor (where, groupBy = []) {
        super('Resident', where, groupBy)
        this.where = where
    }

    async loadData () {
        const { keystone } = await getSchemaCtx(this.domainName)
        const knex = keystone.adapter.knex


        this.result = await knex(this.domainName).select(['id', 'address', 'user']).where(this.where)
    }
}

const createBillingPropertyRange = async (organizationWhereInput) => {
    const billingResidentLoader = new BillingResidentKnexLoader({ organization: get(organizationWhereInput, 'organization.id'), deletedAt: null })
    await billingResidentLoader.loadData()

    return billingResidentLoader
        .getResult((billingResident) => ({ label: billingResident.address, value: billingResident.user }))
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

        this.where.filter(this.isWhereInCondition).reduce((filter, currentFilter) => {
            const [groupName] = Object.entries(currentFilter)[0]
            const [filterEntities] = filter

            if (!this.aggregateBy.includes(groupName)) {
                this.aggregateBy.push(groupName)
            }
            filterEntities.push(groupName)
        }, [[], []])

        const query = knex(this.domainName).count('id').sum('amount').select(this.groups)
        query.select(knex.raw('to_char("period", \'01.MM.YYYY\') as "dayGroup"'))
        const knexWhere = where.reduce((acc, curr) => ({ ...acc, ...curr }), {})

        this.result = await query.groupBy(this.aggregateBy)
            .where(knexWhere)
            .whereIn(...this.whereIn)
            .whereBetween('period', [this.dateRange.from, this.dateRange.to])
            .orderBy('dayGroup', 'asc')
    }
}

class PaymentDataLoader extends AbstractDataLoader {
    async get ({ where, groupBy, totalFilter }) {
        const paymentSumLoader = new GqlWithKnexLoadList({
            listKey: 'Payment',
            fields: 'id',
            where: {
                ...pick(where, ['organization']),
                status_in: [PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS],
                deletedAt: null,
                AND: totalFilter,
            },
        })

        const paymentIds = await paymentSumLoader.load()
        const sumAggregate = await paymentSumLoader.loadAggregate('SUM(amount) as "amountSum"', paymentIds.map(({ id })=> id))

        const sum = new Big(sumAggregate.amountSum || 0).toFixed(2)

        const paymentGqlKnexLoader = new PaymentGqlKnexLoader(where, groupBy)
        await paymentGqlKnexLoader.loadData()
        const payments = paymentGqlKnexLoader.getResult(({ sum, ...searchResult }) => ({
            sum: new Big(sum || 0).toFixed(2),
            ...searchResult,
        }))

        for (const group of groupBy) {
            let groupByLabels = []
            switch (group) {
                case 'createdBy':
                    groupByLabels = await createBillingPropertyRange(pick(where, ['organization']))
                    payments.forEach(payment => {
                        const foundMapping = groupByLabels.find(e => e.value === payment[group])
                        if (foundMapping) {
                            payment[group] = foundMapping.label
                        }
                    })
                    break
                default:
                    break
            }
        }

        return { sum, payments }
    }
}

module.exports = { PaymentDataLoader }
