const dayjs = require('dayjs')

const conf = require('@open-condo/config')
const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { find } = require('@open-condo/keystone/schema')

const { SUBSCRIPTIONS } = require('@condo/domains/common/constants/featureflags')
const { selectBestSubscriptionContext } = require('@condo/domains/subscription/utils/subscriptionContext')


const enableSubscriptions = conf['ENABLE_SUBSCRIPTIONS'] === 'true'

const SUBSCRIPTION_FEATURES_TYPE_NAME = 'OrganizationSubscriptionFeatures'

const SUBSCRIPTION_FEATURES_GRAPHQL_TYPES = `
    type ${SUBSCRIPTION_FEATURES_TYPE_NAME} {
        payments: String
        meters: String
        tickets: String
        news: String
        marketplace: String
        support: String
        ai: String
        customization: String
        enabledB2BApps: [String!]!
        enabledB2CApps: [String!]!
        daysRemaining: Int
        activeSubscriptionContextId: String
    }
`

const calculateDaysUntilDate = (date, now) => {
    if (!date) return 0
    const endDate = dayjs(date)
    const startDate = dayjs(now)
    const diffInHours = endDate.diff(startDate, 'hour', true)
    return Math.max(0, Math.ceil(diffInHours / 24))
}

const buildSubscriptionResponse = (date = null) => {
    const now = new Date().toISOString()
    const daysRemaining = calculateDaysUntilDate(date, now)
    
    return {
        payments: date,
        meters: date,
        tickets: date,
        news: date,
        marketplace: date,
        support: date,
        ai: date,
        customization: date,
        enabledB2BApps: [],
        enabledB2CApps: [],
        daysRemaining,
        activeSubscriptionContextId: null,
    }
}

const enrichContextsWithPlans = async (contexts) => {
    const planIds = [...new Set(contexts.map(c => c.subscriptionPlan).filter(Boolean))]
    const plans = await find('SubscriptionPlan', { id_in: planIds, deletedAt: null })
    const planMap = Object.fromEntries(plans.map(p => [p.id, p]))
    return contexts.map(ctx => ({
        ...ctx,
        subscriptionPlan: planMap[ctx.subscriptionPlan] || null,
    }))
}

const filterActiveContexts = (contexts, now) => {
    const nowDate = dayjs(now).startOf('day')
    return contexts.filter(ctx => {
        if (!ctx.startAt) return false
        const startAt = dayjs(ctx.startAt).startOf('day')
        const endAt = dayjs(ctx.endAt).startOf('day')
        return (startAt.isBefore(nowDate) || startAt.isSame(nowDate)) && endAt.isAfter(nowDate)
    })
}

const calculateFeatureExpirationDates = (sortedContexts) => {
    const featureExpirationDates = {
        payments: null,
        meters: null,
        tickets: null,
        news: null,
        marketplace: null,
        support: null,
        ai: null,
        customization: null,
    }
    
    for (const feature of Object.keys(featureExpirationDates)) {
        let latestEndAt = null
        let lastEndDate = null
        
        for (const ctx of sortedContexts) {
            const contextPlan = ctx.subscriptionPlan
            if (!contextPlan || !contextPlan[feature]) continue
            
            const contextStartAt = ctx.startAt
            const contextEndAt = ctx.endAt
            
            if (lastEndDate && contextStartAt) {
                const startDate = dayjs(contextStartAt)
                const endDate = dayjs(lastEndDate)
                if (startDate.isAfter(endDate, 'day')) {
                    break
                }
            }
            
            if (!latestEndAt || contextEndAt > latestEndAt) {
                latestEndAt = contextEndAt
                lastEndDate = contextEndAt
            }
        }
        
        featureExpirationDates[feature] = latestEndAt
    }
    
    return featureExpirationDates
}

const calculateDaysRemaining = (featureExpirationDates, now) => {
    const featureDates = Object.values(featureExpirationDates)
    const validDates = featureDates.filter(date => date !== null)
    const latestEndAt = validDates.length > 0 ? validDates.sort().pop() : null
    
    return calculateDaysUntilDate(latestEndAt, now)
}

const collectEnabledApps = (activeContexts) => {
    const allEnabledB2BApps = new Set()
    const allEnabledB2CApps = new Set()
    
    for (const ctx of activeContexts) {
        const contextPlan = ctx.subscriptionPlan
        if (!contextPlan) continue
        
        const b2bApps = contextPlan.enabledB2BApps || []
        const b2cApps = contextPlan.enabledB2CApps || []
        b2bApps.forEach(appId => allEnabledB2BApps.add(appId))
        b2cApps.forEach(appId => allEnabledB2CApps.add(appId))
    }
    
    return {
        enabledB2BApps: Array.from(allEnabledB2BApps),
        enabledB2CApps: Array.from(allEnabledB2CApps),
    }
}

const ORGANIZATION_SUBSCRIPTION_FIELD = {
    schemaDoc: 'Subscription information for this organization. Returns feature expiration dates (ISO strings or null), ' +
        'enabled apps from active contexts, days remaining, and active context ID. ' +
        'Features available until expiration date (exclusive).',
    type: 'Virtual',
    extendGraphQLTypes: SUBSCRIPTION_FEATURES_GRAPHQL_TYPES,
    graphQLReturnType: SUBSCRIPTION_FEATURES_TYPE_NAME,
    graphQLReturnFragment: '{ payments meters tickets news marketplace support ai customization enabledB2BApps enabledB2CApps daysRemaining activeSubscriptionContextId }',
    resolver: async (organization, args, context) => {
        const hasSubscriptionFeature = await featureToggleManager.isFeatureEnabled(context, SUBSCRIPTIONS, { 
            userId: context.authedItem?.id || null,
        })
        const futureDate = dayjs().add(100, 'years').format('YYYY-MM-DD')
        if (!enableSubscriptions || !hasSubscriptionFeature) {
            return buildSubscriptionResponse(futureDate)
        }
        const plansForType = await find('SubscriptionPlan', {
            organizationType: organization.type,
            deletedAt: null,
        })
        if (plansForType.length === 0) {
            return buildSubscriptionResponse(futureDate)
        }

        const allContexts = await find('SubscriptionContext', {
            organization: { id: organization.id },
            deletedAt: null,
        })
        if (allContexts.length === 0) {
            return buildSubscriptionResponse(null)
        }

        const now = new Date().toISOString()
        const contextsWithPlans = await enrichContextsWithPlans(allContexts)
        const activeContexts = filterActiveContexts(contextsWithPlans, now)
        const bestActiveContext = activeContexts.length > 0 ? selectBestSubscriptionContext(activeContexts) : null

        const sortedContexts = [...contextsWithPlans].sort((a, b) => {
            if (!a.startAt || !b.startAt) return 0
            return dayjs(a.startAt).diff(dayjs(b.startAt))
        })

        const featureExpirationDates = calculateFeatureExpirationDates(sortedContexts)
        const daysRemaining = calculateDaysRemaining(featureExpirationDates, now)
        const { enabledB2BApps, enabledB2CApps } = collectEnabledApps(activeContexts)

        return {
            payments: featureExpirationDates.payments,
            meters: featureExpirationDates.meters,
            tickets: featureExpirationDates.tickets,
            news: featureExpirationDates.news,
            marketplace: featureExpirationDates.marketplace,
            support: featureExpirationDates.support,
            ai: featureExpirationDates.ai,
            customization: featureExpirationDates.customization,
            enabledB2BApps,
            enabledB2CApps,
            daysRemaining,
            activeSubscriptionContextId: bestActiveContext?.id || null,
        }
    },
}

module.exports = {
    ORGANIZATION_SUBSCRIPTION_FIELD,
}
