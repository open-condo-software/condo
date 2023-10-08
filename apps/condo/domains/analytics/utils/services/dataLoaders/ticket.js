const dayjs = require('dayjs')
const { get, isEmpty, find } = require('lodash')

const conf = require('@open-condo/config')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { extractReqLocale } = require('@open-condo/locales/extractReqLocale')
const { i18n } = require('@open-condo/locales/loader')

const {
    sortStatusesByType,
    TicketGqlToKnexAdapter,
    getCombinations,
    enumerateDaysBetweenDates,
} = require('@condo/domains/analytics/utils/serverSchema/analytics.helper')
const { AbstractDataLoader } = require('@condo/domains/analytics/utils/services/dataLoaders/AbstractDataLoader')
const { GqlWithKnexLoadList } = require('@condo/domains/common/utils/serverSchema')
const { GqlToKnexBaseAdapter } = require('@condo/domains/common/utils/serverSchema/GqlToKnexBaseAdapter')
const { DATE_DISPLAY_FORMAT } = require('@condo/domains/ticket/constants/common')
const { QUALITY_CONTROL_VALUES } = require('@condo/domains/ticket/constants/qualityControl')
const { TicketStatus: TicketStatusServerUtils } = require('@condo/domains/ticket/utils/serverSchema')

const createPropertyRange = async (organizationWhereInput, whereIn) => {
    const gqlLoaderOptions = {
        listKey: 'Property',
        fields: 'id address',
        where: { organization: organizationWhereInput, deletedAt: null },
    }
    const propertyFilter = get(whereIn, 'property', false)
    if (propertyFilter) {
        gqlLoaderOptions['where']['id_in'] = propertyFilter.flatMap(id => id)
    }
    const propertyLoader = new GqlWithKnexLoadList(gqlLoaderOptions)
    const properties = await propertyLoader.load()
    return properties.map(property => ({ label: property.address, value: property.id }))
}

const createStatusRange = async (context, organizationWhereInput, labelKey = 'name') => {
    const statuses = await TicketStatusServerUtils.getAll(context, {
        OR: [
            { organization: organizationWhereInput },
            { organization_is_null: true },
        ],
    })
    // We use organization specific statuses if they exists
    // or default if there is no organization specific status with a same type
    const allStatuses = statuses.filter(status => {
        if (!status.organization) {
            return true
        }
        return !statuses
            .find(organizationStatus => organizationStatus.organization !== null && organizationStatus.type === status.type)
    })
    return sortStatusesByType(allStatuses).map(status => ({
        label: status[labelKey],
        value: status.id,
        type: status.type,
        color: status.colors.primary,
    }))
}

const createCategoryClassifierRange = async (organizationWhereInput, whereIn) => {
    const gqlLoaderOptions = {
        listKey: 'TicketCategoryClassifier',
        fields: 'id name organization',
    }
    const categoryClassifierFilter = get(whereIn, 'categoryClassifier', false)
    if (categoryClassifierFilter) {
        gqlLoaderOptions['where'] = {
            id_in: categoryClassifierFilter.flatMap(id => id),
        }
    }
    const categoryClassifierLoader = new GqlWithKnexLoadList(gqlLoaderOptions)
    const classifiers = await categoryClassifierLoader.load()
    return classifiers.map(classifier => ({ label: classifier.name, value: classifier.id }))
}

const createExecutorRange = async (organizationWhereInput, whereIn) => {
    const gqlLoaderOptions = {
        listKey: 'OrganizationEmployee',
        fields: 'id name',
        singleRelations: [['User', 'user', 'id']],
        where: { organization: organizationWhereInput, role: { canBeAssignedAsExecutor: true } },
    }
    const executorFilter = get(whereIn, 'executor', false)
    const executorLoader = new GqlWithKnexLoadList(gqlLoaderOptions)
    const executors = await executorLoader.load()
    const executorLambda = (executor) => ({ label: executor.name, value: executor.user })

    if (executorFilter) {
        const executorIds = executorFilter.flatMap(id => id)
        return executors.filter(executor => executorIds.includes(executor.user)).map(executorLambda)
    }
    return executors.map(executorLambda)
}

const createAssigneeRange = async (organizationWhereInput, whereIn) => {
    const gqlLoaderOptions = {
        listKey: 'OrganizationEmployee',
        fields: 'id name',
        singleRelations: [['User', 'user', 'id']],
        where: { organization: organizationWhereInput, role: { canBeAssignedAsResponsible: true } },
    }
    const assigneeFilter = get(whereIn, 'assignee', false)
    const assigneeLoader = new GqlWithKnexLoadList(gqlLoaderOptions)
    const assignees = await assigneeLoader.load()
    const assigneeLambda = (assignee) => ({ label: assignee.name, value: assignee.user })

    if (assigneeFilter) {
        const assigneeIds = assigneeFilter.flatMap(id => id)
        return assignees.filter(assignee => assigneeIds.includes(assignee.user)).map(assigneeLambda)
    }
    return assignees.map(assigneeLambda)
}

class TicketDataLoader extends AbstractDataLoader {
    #nullableGroupKeys = ['categoryClassifier', 'executor', 'assignee']

    async get ({ where, groupBy, extraLabels = {}, nullReplaces = {} }) {
        const translates = {}
        const options = {
            count: [0],
            property: [null],
            categoryClassifier: [null],
            executor: [null],
            assignee: [null],
            dayGroup: [dayjs().format('DD.MM.YYYY')],
        }

        const ticketGqlToKnexAdapter = new TicketGqlToKnexAdapter(where, groupBy)
        await ticketGqlToKnexAdapter.loadData()

        for (const group of groupBy) {
            switch (group) {
                case 'property':
                    translates[group] = await createPropertyRange(where.organization, ticketGqlToKnexAdapter.whereIn)
                    options[group] = translates[group].map(({ label }) => label)
                    break
                case 'status':
                    translates[group] = await createStatusRange(
                        this.context, where.organization, isEmpty(extraLabels) ? 'name' : extraLabels[group],
                    )
                    options[group] = translates[group].map(({ label }) => label)
                    break
                case 'day':
                case 'week':
                    options['dayGroup'] = enumerateDaysBetweenDates(
                        ticketGqlToKnexAdapter.dateRange.from, ticketGqlToKnexAdapter.dateRange.to, group,
                    )
                    break
                case 'categoryClassifier':
                    translates[group] = await createCategoryClassifierRange(
                        where.organization, ticketGqlToKnexAdapter.whereIn,
                    )
                    options[group] = translates[group].map(({ label }) => label)
                    break
                case 'executor':
                    translates[group] = await createExecutorRange(where.organization, ticketGqlToKnexAdapter.whereIn)
                    options[group] = translates[group].map(({ label }) => label)
                    break
                case 'assignee':
                    translates[group] = await createAssigneeRange(where.organization, ticketGqlToKnexAdapter.whereIn)
                    options[group] = translates[group].map(({ label }) => label)
                    break
                default:
                    break
            }
        }

        const ticketGqlResult = ticketGqlToKnexAdapter
            .getResult(({ count, dayGroup, ...searchResult }) => {
                if (!isEmpty(translates)) {
                    Object.entries(searchResult).forEach(([groupName, value]) => {
                        const translateMapping = get(translates, groupName, false)
                        if (translateMapping) {
                            const translation = translateMapping.find(translate => translate.value === value)
                            searchResult[groupName] = get(translation, 'label', null)
                        }
                    })
                    return {
                        ...searchResult,
                        dayGroup: dayGroup ? dayGroup : dayjs().format(DATE_DISPLAY_FORMAT),
                        count: parseInt(count),
                    }
                }
                return {
                    ...searchResult,
                    dayGroup: dayGroup ? dayGroup : dayjs().format(DATE_DISPLAY_FORMAT),
                    count: parseInt(count),
                }
            })
            // This is hack to process old database records with tickets with user organization and property from another org
            .filter(ticketCount => ticketCount.property !== null)

        const fullCombinationsResult = getCombinations({ options })

        const ticketMap = new Map()
        const transformedGroupBy = groupBy.map(group => ['day', 'week', 'month'].includes(group) ? 'dayGroup' : group)
        fullCombinationsResult.concat(ticketGqlResult).forEach(ticketCount => {
            const [mainGroup, childGroup] = transformedGroupBy
            const mapKey = (ticketCount[mainGroup] + ticketCount[childGroup]).toString()
            ticketMap.set(mapKey, ticketCount)
        })

        const ticketCounts = Array.from(ticketMap.values())
            .map(ticketCount => {
                if (groupBy.some(group => this.#nullableGroupKeys.includes(group))) {
                    const categoryClassifier = ticketCount.categoryClassifier !== null
                        ? ticketCount.categoryClassifier
                        : get(nullReplaces, 'categoryClassifier')
                    const executor = ticketCount.executor !== null ? ticketCount.executor : get(nullReplaces, 'executor')
                    const assignee = ticketCount.assignee !== null ? ticketCount.assignee : get(nullReplaces, 'assignee')
                    return {
                        ...ticketCount,
                        categoryClassifier,
                        executor,
                        assignee,
                    }
                }
                return ticketCount
            })
            .sort((a, b) =>
                dayjs(a.dayGroup, DATE_DISPLAY_FORMAT).unix() - dayjs(b.dayGroup, DATE_DISPLAY_FORMAT).unix(),
            )
        return { ticketCounts, translates }
    }
}

class TicketQualityControlGqlLoader extends GqlToKnexBaseAdapter {
    aggregateBy = []
    constructor (where, groupBy) {
        super('Ticket', where, groupBy)
        this.aggregateBy = ['dayGroup', ...this.groups]
    }

    async loadData () {
        this.result = null

        const { keystone } = await getSchemaCtx(this.domainName)
        const knex = keystone.adapter.knex

        this.extendAggregationWithFilter(this.aggregateBy)

        const query = knex(this.domainName).count('id')
            .select(knex.raw(`to_char(date_trunc('${this.dayGroup}',  "createdAt"), 'DD.MM.YYYY') as "dayGroup"`))
            .select(knex.raw('COALESCE("feedbackValue", "qualityControlValue") as "qualityControlComputedValue"'))
            .where(this.knexWhere)
            .andWhere(function () {
                this.whereIn('qualityControlValue', QUALITY_CONTROL_VALUES)
                    .orWhereIn('feedbackValue', QUALITY_CONTROL_VALUES)
            })


        const propertyFilter = get(find(this.where, 'property', {}), 'property.id_in', [])

        if (!isEmpty(propertyFilter)) {
            query.whereIn('property', propertyFilter)
        }

        this.result = await query
            .groupBy(this.aggregateBy)
            .whereBetween('createdAt', [this.dateRange.from, this.dateRange.to])
    }
}

class TicketQualityControlDataLoader extends AbstractDataLoader {
    async get ({ where, groupBy }) {
        const locale = extractReqLocale(this.context.req) || conf.DEFAULT_LOCALE
        const translationMapping = Object.fromEntries(QUALITY_CONTROL_VALUES.map(value => [value, i18n(`ticket.qualityControl.${value}`, { locale })]))

        const ticketQualityControlLoader = new TicketQualityControlGqlLoader(where, groupBy)

        await ticketQualityControlLoader.loadData()
        const tickets = await ticketQualityControlLoader.getResult(({ qualityControlComputedValue, ...searchResult }) => ({
            ...searchResult,
            qualityControlValue: translationMapping[qualityControlComputedValue],
        }))

        return { tickets, translations: QUALITY_CONTROL_VALUES.map(value => ({ value, key: i18n(`ticket.qualityControl.${value}`, { locale }) })) }
    }
}

module.exports = { TicketDataLoader, TicketQualityControlDataLoader }
