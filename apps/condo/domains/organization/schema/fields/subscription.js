const { find } = require('@open-condo/keystone/schema')

const { selectBestSubscriptionContext } = require('@condo/domains/subscription/utils/subscriptionContext')

// GraphQL type name for subscription features
const SUBSCRIPTION_FEATURES_TYPE_NAME = 'OrganizationSubscriptionFeatures'

// GraphQL type definition for subscription features
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
        disabledB2BApps: [String!]!
        disabledB2CApps: [String!]!
    }
`

// Full access features returned when no subscription plans exist for organization type
const FULL_ACCESS_FEATURES = {
    payments: true,
    meters: true,
    tickets: true,
    news: true,
    marketplace: true,
    support: true,
    ai: true,
    customization: true,
    disabledB2BApps: [],
    disabledB2CApps: [],
}

const ORGANIZATION_SUBSCRIPTION_FIELD = {
    schemaDoc: 'Subscription feature flags for this organization. Returns feature availability based on active subscription. ' +
        'If no subscription plans exist for organization type, returns all features enabled. Returns null if plans exist but no active subscription.',
    type: 'Virtual',
    extendGraphQLTypes: SUBSCRIPTION_FEATURES_GRAPHQL_TYPES,
    graphQLReturnType: SUBSCRIPTION_FEATURES_TYPE_NAME,
    graphQLReturnFragment: '{ payments meters tickets news marketplace support ai customization disabledB2BApps disabledB2CApps }',
    resolver: async (organization) => {
        const plansForType = await find('SubscriptionPlan', {
            organizationType: organization.type,
            deletedAt: null,
        })
        // If no plans exist for this organization type, return full access
        if (plansForType.length === 0) {
            return FULL_ACCESS_FEATURES
        }

        const now = new Date().toISOString()

        const activeContexts = await find('SubscriptionContext', {
            organization: { id: organization.id },
            startAt_lte: now,
            deletedAt: null,
            OR: [
                { endAt: null },
                { endAt_gt: now },
            ],
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

        return {
            payments: plan.payments,
            meters: plan.meters,
            tickets: plan.tickets,
            news: plan.news,
            marketplace: plan.marketplace,
            support: plan.support,
            ai: plan.ai,
            customization: plan.customization,
            disabledB2BApps: plan.disabledB2BApps || [],
            disabledB2CApps: plan.disabledB2CApps || [],
        }
    },
}

module.exports = {
    ORGANIZATION_SUBSCRIPTION_FIELD,
}
