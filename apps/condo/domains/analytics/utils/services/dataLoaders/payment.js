const Big = require('big.js')
const { get, pick, isEmpty } = require('lodash')

const { getDatabaseAdapter, isPrismaAdapter, castUuidParams, convertPrismaBigInts } = require('@open-condo/keystone/databaseAdapters/utils')
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
        const adapter = getDatabaseAdapter(keystone)

        const propertyIds = get(this.where, 'property.id_in', [])

        if (isPrismaAdapter(keystone)) {
            const whereParts = []
            const params = []
            let paramIdx = 1

            if (!isEmpty(propertyIds)) {
                const simpleWhere = pick(this.where, ['organization', 'deletedAt'])
                for (const [key, val] of Object.entries(simpleWhere)) {
                    if (val === null) {
                        whereParts.push(`"${key}" IS NULL`)
                    } else {
                        whereParts.push(`"${key}" = $${paramIdx++}`)
                        params.push(val)
                    }
                }
                const ph = propertyIds.map(v => { params.push(v); return `$${paramIdx++}` }).join(', ')
                whereParts.push(`"property" IN (${ph})`)
            } else {
                for (const [key, val] of Object.entries(this.where)) {
                    if (val === null) {
                        whereParts.push(`"${key}" IS NULL`)
                    } else if (typeof val === 'object' && val.id_in) {
                        continue
                    } else {
                        whereParts.push(`"${key}" = $${paramIdx++}`)
                        params.push(val)
                    }
                }
            }

            const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : ''
            const sql = `SELECT "id", "address", "user" FROM "${this.domainName}" ${whereClause}`
            this.result = convertPrismaBigInts(await adapter.prisma.$queryRawUnsafe(castUuidParams(sql, params), ...params))
        } else {
            const { knex } = adapter
            if (!isEmpty(propertyIds)) {
                this.result = await knex(this.domainName)
                    .select(['id', 'address', 'user'])
                    .where(pick(this.where, ['organization', 'deletedAt']))
                    .whereIn('property', propertyIds)
            } else {
                this.result = await knex(this.domainName)
                    .select(['id', 'address', 'user'])
                    .where(this.where)
            }
        }
    }
}

const createBillingPropertyRange = async (organizationWhereInput, propertyFilter = []) => {
    const billingResidentLoader = new BillingResidentKnexLoader({
        organization: get(organizationWhereInput, 'organization.id'),
        deletedAt: null,
        ...(!isEmpty(propertyFilter) && { property: { id_in: propertyFilter } }),
    }, ['address', 'user'])
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
        const adapter = getDatabaseAdapter(keystone)

        this.extendAggregationWithFilter(this.aggregateBy)

        if (isPrismaAdapter(keystone)) {
            const selectParts = [
                'COUNT("id") as "count"',
                'SUM("amount") as "sum"',
                ...this.groups.map(g => `"${g}"`),
                'to_char("period", \'01.MM.YYYY\') as "dayGroup"',
            ]
            const groupByCols = this.aggregateBy.map(g => `"${g}"`).join(', ')

            const whereParts = []
            const params = []
            let paramIdx = 1

            for (const [key, val] of Object.entries(this.knexWhere)) {
                if (val === null) {
                    whereParts.push(`"${key}" IS NULL`)
                } else {
                    whereParts.push(`"${key}" = $${paramIdx++}`)
                    params.push(val)
                }
            }

            if (this.whereIn[0]) {
                const [col, values] = this.whereIn[0]
                const ph = values.map(v => { params.push(v); return `$${paramIdx++}` }).join(', ')
                whereParts.push(`"${col}" IN (${ph})`)
            }

            if (this.dateRange.from && this.dateRange.to) {
                whereParts.push(`"period" BETWEEN $${paramIdx++} AND $${paramIdx++}`)
                params.push(this.dateRange.from, this.dateRange.to)
            }

            const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : ''
            const sql = `SELECT ${selectParts.join(', ')} FROM "${this.domainName}" ${whereClause} GROUP BY ${groupByCols} ORDER BY "dayGroup" ASC`
            this.result = convertPrismaBigInts(await adapter.prisma.$queryRawUnsafe(castUuidParams(sql, params), ...params))
        } else {
            const { knex } = adapter
            const query = knex(this.domainName).count('id').sum('amount').select(this.groups)
            query.select(knex.raw('to_char("period", \'01.MM.YYYY\') as "dayGroup"'))

            this.result = await query.groupBy(this.aggregateBy)
                .where(this.knexWhere)
                .whereIn(...this.whereIn[0])
                .whereBetween('period', [this.dateRange.from, this.dateRange.to])
                .orderBy('dayGroup', 'asc')
        }
    }
}

class PaymentDataLoader extends AbstractDataLoader {
    async get ({ where, groupBy, totalFilter, extraFilter }) {
        const hasPropertyFilter = !isEmpty(extraFilter.propertyIds)
        let paymentPropertyLabels = []

        for (const group of groupBy) {
            if (group === 'createdBy') {
                paymentPropertyLabels = await createBillingPropertyRange(pick(where, ['organization']), extraFilter.propertyIds)
            }
        }

        const paymentSumLoader = new GqlWithKnexLoadList({
            listKey: 'Payment',
            fields: 'id',
            where: {
                ...pick(where, ['organization']),
                status_in: [PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS],
                deletedAt: null,
                invoice_is_null: true,
                AND: totalFilter,
                ...(hasPropertyFilter && { createdBy: { id_in: paymentPropertyLabels.map(({ value }) => value) } }),
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

        payments.forEach(payment => {
            const foundMapping = paymentPropertyLabels.find(e => e.value === payment['createdBy'])
            if (foundMapping) {
                payment['createdBy'] = foundMapping.label
            } else if (!isEmpty(extraFilter.propertyIds)) {
                payment['createdBy'] = null
            }
        })

        return { sum, payments: isEmpty(extraFilter.propertyIds) ? payments : payments.filter(payment => payment.createdBy !== null) }
    }
}

module.exports = { PaymentDataLoader }
