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
        payments: Boolean!
        meters: Boolean!
        tickets: Boolean!
        news: Boolean!
        marketplace: Boolean!
        support: Boolean!
        ai: Boolean!
        customization: Boolean!
        enabledB2BApps: [String!]!
        enabledB2CApps: [String!]!
        daysRemaining: Int
        planName: String
        planId: String
        canBePromoted: Boolean
        priority: Int
        isTrial: Boolean
        startAt: String
        endAt: String
    }
`

const FULL_ACCESS_FEATURES = {
    payments: true,
    meters: true,
    tickets: true,
    news: true,
    marketplace: true,
    support: true,
    ai: true,
    customization: true,
    enabledB2BApps: [],
    enabledB2CApps: [],
    daysRemaining: null,
    planName: null,
    planId: null,
    canBePromoted: null,
    priority: null,
    isTrial: false,
    startAt: null,
    endAt: null,
}

const ORGANIZATION_SUBSCRIPTION_FIELD = {
    schemaDoc: 'Subscription feature flags for this organization. Returns feature availability based on active subscription. ' +
        'If no subscription plans exist for organization type, returns all features enabled. Returns null if plans exist but no active subscription.',
    type: 'Virtual',
    extendGraphQLTypes: SUBSCRIPTION_FEATURES_GRAPHQL_TYPES,
    graphQLReturnType: SUBSCRIPTION_FEATURES_TYPE_NAME,
    graphQLReturnFragment: '{ payments meters tickets news marketplace support ai customization enabledB2BApps enabledB2CApps daysRemaining planName planId canBePromoted priority isTrial startAt endAt }',
    resolver: async (organization, args, context) => {
        const hasSubscriptionFeature = await featureToggleManager.isFeatureEnabled(context, SUBSCRIPTIONS, { 
            userId: context.authedItem?.id || null,
        })
        if (!enableSubscriptions || !hasSubscriptionFeature) {
            return FULL_ACCESS_FEATURES
        }
        const plansForType = await find('SubscriptionPlan', {
            organizationType: organization.type,
            deletedAt: null,
        })
        if (plansForType.length === 0) {
            return FULL_ACCESS_FEATURES
        }

        const now = new Date().toISOString()

        const activeContexts = await find('SubscriptionContext', {
            organization: { id: organization.id },
            startAt_lte: now,
            deletedAt: null,
            endAt_gt: now,
        })
        if (activeContexts.length === 0) {
            return null
        }

        const planIds = [...new Set(activeContexts.map(c => c.subscriptionPlan).filter(Boolean))]
        const plans = await find('SubscriptionPlan', { id_in: planIds, deletedAt: null })
        const planMap = Object.fromEntries(plans.map(p => [p.id, p]))
        const enrichedContexts = activeContexts.map(ctx => ({
            ...ctx,
            subscriptionPlan: planMap[ctx.subscriptionPlan] || null,
        }))

        const bestContext = selectBestSubscriptionContext(enrichedContexts)
        const plan = bestContext?.subscriptionPlan
        if (!plan) {
            return null
        }

        let daysRemaining = null
        if (bestContext.endAt) {
            const endDate = dayjs(bestContext.endAt)
            const startDate = dayjs(now)
            const diffInHours = endDate.diff(startDate, 'hour', true)
            daysRemaining = Math.max(0, Math.ceil(diffInHours / 24))
        }

        return {
            payments: plan.payments,
            meters: plan.meters,
            tickets: plan.tickets,
            news: plan.news,
            marketplace: plan.marketplace,
            support: plan.support,
            ai: plan.ai,
            customization: plan.customization,
            enabledB2BApps: plan.enabledB2BApps || [],
            enabledB2CApps: plan.enabledB2CApps || [],
            daysRemaining,
            planName: plan.name,
            planId: plan.id,
            priority: plan.priority,
            isTrial: bestContext.isTrial,
            startAt: bestContext.startAt,
            endAt: bestContext.endAt,
            canBePromoted: plan.canBePromoted,
        }
    },
}

module.exports = {
    ORGANIZATION_SUBSCRIPTION_FIELD,
}
