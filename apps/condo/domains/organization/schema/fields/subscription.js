const { find } = require('@open-condo/keystone/schema')


const ORGANIZATION_SUBSCRIPTION_FIELD = {
    schemaDoc: 'Active subscription context for this organization. Returns the best active subscription ' +
        '(by plan priority, then by latest startAt). Returns null if no active subscription',
    type: 'Virtual',
    graphQLReturnType: 'SubscriptionContext',
    graphQLReturnFragment: '{ id organization { id } subscriptionPlan { id name trialDays priority news marketplace support ai passTickets canBePromoted } startAt endAt isTrial }',
    resolver: async (organization) => {
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

        let selectedContext = activeContexts[0]

        if (activeContexts.length > 1) {
            // Need to fetch subscription plans to sort by priority
            const planIds = [...new Set(activeContexts.map(c => c.subscriptionPlan).filter(Boolean))]
            const plans = await find('SubscriptionPlan', { id_in: planIds, deletedAt: null })
            const planPriorityMap = Object.fromEntries(plans.map(p => [p.id, p.priority || 0]))

            // Sort by plan priority (higher = better), then by startAt (later = better)
            const sorted = activeContexts.sort((a, b) => {
                const priorityA = planPriorityMap[a.subscriptionPlan] || 0
                const priorityB = planPriorityMap[b.subscriptionPlan] || 0

                if (priorityA !== priorityB) {
                    return priorityB - priorityA
                }

                return new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
            })

            selectedContext = sorted[0]
        }

        return selectedContext
    },
}

module.exports = {
    ORGANIZATION_SUBSCRIPTION_FIELD,
}
