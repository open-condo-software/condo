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

function calculateDaysUntilDate (date, now) {
    if (!date) return 0
    const endDate = dayjs(date)
    const startDate = dayjs(now)
    const diffInHours = endDate.diff(startDate, 'hour', true)
    return Math.max(0, Math.ceil(diffInHours / 24))
}

function buildSubscriptionResponse (date = null) {
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

async function enrichContextsWithPlans (contexts) {
    const planIds = [...new Set(contexts.map(c => c.subscriptionPlan).filter(Boolean))]
    const plans = await find('SubscriptionPlan', { id_in: planIds, deletedAt: null })
    const planMap = Object.fromEntries(plans.map(p => [p.id, p]))
    return contexts.map(ctx => ({
        ...ctx,
        subscriptionPlan: planMap[ctx.subscriptionPlan] || null,
    }))
}

function filterActiveContexts (contexts, now) {
    const nowDate = dayjs(now).startOf('day')
    return contexts.filter(ctx => {
        if (!ctx.startAt || !ctx.endAt) return false
        const startAt = dayjs(ctx.startAt).startOf('day')
        const endAt = dayjs(ctx.endAt).startOf('day')
        return (startAt.isBefore(nowDate) || startAt.isSame(nowDate)) && endAt.isAfter(nowDate)
    })
}

function findLatestEndAtForFeature (feature, sortedContexts, now) {
    const nowDate = dayjs(now).startOf('day')
    const contextsWithFeature = sortedContexts.filter(ctx => {
        const contextPlan = ctx.subscriptionPlan
        return contextPlan && contextPlan[feature]
    })
    if (contextsWithFeature.length === 0) {
        return null
    }
    
    let maxEndAt = null
    let lastEndDate = null
    
    for (const ctx of contextsWithFeature) {
        const startAt = dayjs(ctx.startAt).startOf('day')
        const endAt = dayjs(ctx.endAt).startOf('day')
        const isActiveOrFuture = endAt.isAfter(nowDate)
        
        if (isActiveOrFuture) {
            if (lastEndDate) {
                const prevEndDate = dayjs(lastEndDate).startOf('day')
                // If there's a gap, stop extending
                if (startAt.isAfter(prevEndDate, 'day')) {
                    break
                }
            } else {
                // First active/future context must cover or start from now
                if (startAt.isAfter(nowDate, 'day')) {
                    break
                }
            }
            
            lastEndDate = ctx.endAt
        }
        
        if (!maxEndAt || ctx.endAt > maxEndAt) {
            maxEndAt = ctx.endAt
        }
    }
    
    return maxEndAt
}

function calculateFeatureExpirationDates (sortedContexts, now) {
    const features = ['payments', 'meters', 'tickets', 'news', 'marketplace', 'support', 'ai', 'customization']
    
    return features.reduce((acc, feature) => {
        acc[feature] = findLatestEndAtForFeature(feature, sortedContexts, now)
        return acc
    }, {})
}

function calculateDaysRemaining (featureExpirationDates, now) {
    const featureDates = Object.values(featureExpirationDates)
    const validDates = featureDates.filter(date => date !== null)
    const latestEndAt = validDates.length > 0 ? validDates.sort().pop() : null
    
    return calculateDaysUntilDate(latestEndAt, now)
}

function collectEnabledApps (activeContexts) {
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

        const featureExpirationDates = calculateFeatureExpirationDates(sortedContexts, now)
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
