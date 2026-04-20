const dayjs = require('dayjs')

const conf = require('@open-condo/config')
const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { find } = require('@open-condo/keystone/schema')

const { SUBSCRIPTIONS } = require('@condo/domains/common/constants/featureflags')
const { SUBSCRIPTION_CONTEXT_STATUS, SUBSCRIPTION_PAYMENT_BUFFER_DAYS, SUBSCRIPTION_PLAN_TYPE_SERVICE, SUBSCRIPTION_PLAN_FEATURES } = require('@condo/domains/subscription/constants')
const { selectBestSubscriptionContext } = require('@condo/domains/subscription/utils/subscriptionContext')


const enableSubscriptions = conf['ENABLE_SUBSCRIPTIONS'] === 'true'

const SUBSCRIPTION_FEATURES_TYPE_NAME = 'OrganizationSubscriptionFeatures'

const SUBSCRIPTION_FEATURES_GRAPHQL_TYPES = `
    type SubscriptionApp {
        id: String!
        endAt: String
    }
    type ${SUBSCRIPTION_FEATURES_TYPE_NAME} {
        paymentsEndAt: String
        metersEndAt: String
        ticketsEndAt: String
        newsEndAt: String
        marketplaceEndAt: String
        supportEndAt: String
        aiEndAt: String
        customizationEndAt: String
        propertiesEndAt: String
        analyticsEndAt: String
        b2bApps: [SubscriptionApp!]!
        b2cApps: [SubscriptionApp!]!
        activeSubscriptionContextId: String
        activeSubscriptionEndAt: String
    }
`

function getAppsFromPlans (plans, appFieldName, date) {
    const appIds = new Set()
    
    plans.forEach(plan => {
        const apps = plan[appFieldName]
        if (apps && Array.isArray(apps)) {
            apps.forEach(appId => appIds.add(appId))
        }
    })
    
    return Array.from(appIds).map(id => ({ id, endAt: date }))
}

async function buildSubscriptionResponse (date = null) {
    let b2bApps = []
    let b2cApps = []
    
    if (date) {
        const allPlans = await find('SubscriptionPlan', { deletedAt: null, isHidden: false })
        b2bApps = getAppsFromPlans(allPlans, 'enabledB2BApps', date)
        b2cApps = getAppsFromPlans(allPlans, 'enabledB2CApps', date)
    }
    
    return {
        paymentsEndAt: date,
        metersEndAt: date,
        ticketsEndAt: date,
        newsEndAt: date,
        marketplaceEndAt: date,
        supportEndAt: date,
        aiEndAt: date,
        customizationEndAt: date,
        propertiesEndAt: date,
        analyticsEndAt: date,
        b2bApps,
        b2cApps,
        activeSubscriptionContextId: null,
        activeSubscriptionEndAt: date,
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

function addBufferDaysToDate (dateString, isTrial) {
    if (isTrial || !dateString) return dateString
    return dayjs(dateString).add(SUBSCRIPTION_PAYMENT_BUFFER_DAYS, 'day').format('YYYY-MM-DD')
}

function filterActiveContexts (contexts, now) {
    const nowDate = dayjs(now).startOf('day')
    return contexts.filter(ctx => {
        if (!ctx.startAt || !ctx.endAt) return false
        if (ctx.status !== SUBSCRIPTION_CONTEXT_STATUS.DONE) return false
        const startAt = dayjs(ctx.startAt).startOf('day')
        const endAtWithBuffer = addBufferDaysToDate(ctx.endAt, ctx.isTrial)
        const endAt = dayjs(endAtWithBuffer).startOf('day')
        return (startAt.isBefore(nowDate) || startAt.isSame(nowDate)) && endAt.isAfter(nowDate)
    })
}

function findLatestEndAt (sortedContexts, now, filterFn) {
    const nowDate = dayjs(now).startOf('day')
    const filteredContexts = sortedContexts.filter(filterFn)
    
    if (filteredContexts.length === 0) {
        return null
    }
    
    let maxEndAt = null
    let lastEndDate = null
    
    for (const ctx of filteredContexts) {
        const startAt = dayjs(ctx.startAt).startOf('day')
        const endAtWithBuffer = addBufferDaysToDate(ctx.endAt, ctx.isTrial)
        const endAt = dayjs(endAtWithBuffer).startOf('day')
        const isActiveOrFuture = endAt.isAfter(nowDate)
        
        if (isActiveOrFuture) {
            if (lastEndDate) {
                const prevEndDate = dayjs(lastEndDate).startOf('day')
                const prevEndDateWithBuffer = addBufferDaysToDate(lastEndDate, ctx.isTrial)
                const prevEndDateBuffered = dayjs(prevEndDateWithBuffer).startOf('day')
                if (startAt.isAfter(prevEndDateBuffered, 'day')) {
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
        
        const endAtToCompare = addBufferDaysToDate(ctx.endAt, ctx.isTrial)
        if (!maxEndAt || endAtToCompare > maxEndAt) {
            maxEndAt = endAtToCompare
        }
    }
    
    return maxEndAt
}

function findLatestEndAtForFeature (feature, sortedContexts, now) {
    return findLatestEndAt(sortedContexts, now, (ctx) => {
        const contextPlan = ctx.subscriptionPlan
        return contextPlan && contextPlan[feature]
    })
}

function calculateFeatureExpirationDates (sortedContexts, now) {
    return SUBSCRIPTION_PLAN_FEATURES.reduce((acc, feature) => {
        acc[feature] = findLatestEndAtForFeature(feature, sortedContexts, now)
        return acc
    }, {})
}

function calculateSubscriptionEndAt (sortedContexts, bestActiveContext, now) {
    if (!bestActiveContext || !bestActiveContext.subscriptionPlan) {
        return { activeSubscriptionEndAt: null }
    }

    const activePlanId = bestActiveContext.subscriptionPlan.id
    const contextsWithActivePlan = sortedContexts.filter(ctx => 
        ctx.subscriptionPlan && ctx.subscriptionPlan.id === activePlanId
    )

    if (contextsWithActivePlan.length === 0) {
        return { activeSubscriptionEndAt: null }
    }

    const nowDate = dayjs(now).startOf('day')
    let maxEndAt = null
    let lastEndDate = null

    for (const ctx of contextsWithActivePlan) {
        const startAt = dayjs(ctx.startAt).startOf('day')
        const endAtWithBuffer = addBufferDaysToDate(ctx.endAt, ctx.isTrial)
        const endAt = dayjs(endAtWithBuffer).startOf('day')
        const isActiveOrFuture = endAt.isAfter(nowDate)

        if (isActiveOrFuture) {
            if (lastEndDate) {
                const prevEndDateWithBuffer = addBufferDaysToDate(lastEndDate, ctx.isTrial)
                const prevEndDateBuffered = dayjs(prevEndDateWithBuffer).startOf('day')
                if (startAt.isAfter(prevEndDateBuffered, 'day')) {
                    break
                }
            } else {
                if (startAt.isAfter(nowDate, 'day')) {
                    break
                }
            }

            lastEndDate = ctx.endAt
            const endAtToCompare = addBufferDaysToDate(ctx.endAt, ctx.isTrial)
            if (!maxEndAt || endAtToCompare > maxEndAt) {
                maxEndAt = endAtToCompare
            }
        }
    }

    return {
        activeSubscriptionEndAt: maxEndAt,
    }
}

function collectAppsFromPlans (plans, organizationType, appField) {
    const allAppIds = new Set()
    const appsInOrgTypePlans = new Set()
    
    plans.forEach(plan => {
        const apps = plan[appField]
        if (apps && Array.isArray(apps)) {
            apps.forEach(appId => {
                allAppIds.add(appId)
                if (plan.organizationType === organizationType) {
                    appsInOrgTypePlans.add(appId)
                }
            })
        }
    })
    
    return { allAppIds, appsInOrgTypePlans }
}

function calculateAppExpirations (allAppIds, appsInOrgTypePlans, appField, sortedContexts, now, futureDate) {
    const appsMap = new Map()
    
    allAppIds.forEach(appId => {
        if (appsInOrgTypePlans.has(appId)) {
            const endAt = findLatestEndAtForApp(appId, appField, sortedContexts, now)
            appsMap.set(appId, endAt)
        } else {
            appsMap.set(appId, futureDate)
        }
    })
    
    return Array.from(appsMap.entries()).map(([id, endAt]) => ({ id, endAt }))
}

async function calculateAppsExpiration (sortedContexts, now, organizationType) {
    const allPlans = await find('SubscriptionPlan', { deletedAt: null, isHidden: false })
    const futureDate = dayjs().add(100, 'years').format('YYYY-MM-DD')
    
    const { allAppIds: b2bAppIds, appsInOrgTypePlans: b2bAppsInOrgTypePlans } = collectAppsFromPlans(
        allPlans, organizationType, 'enabledB2BApps'
    )
    const { allAppIds: b2cAppIds, appsInOrgTypePlans: b2cAppsInOrgTypePlans } = collectAppsFromPlans(
        allPlans, organizationType, 'enabledB2CApps'
    )
    
    return {
        b2bApps: calculateAppExpirations(b2bAppIds, b2bAppsInOrgTypePlans, 'enabledB2BApps', sortedContexts, now, futureDate),
        b2cApps: calculateAppExpirations(b2cAppIds, b2cAppsInOrgTypePlans, 'enabledB2CApps', sortedContexts, now, futureDate),
    }
}

function findLatestEndAtForApp (appId, appField, sortedContexts, now) {
    return findLatestEndAt(sortedContexts, now, (ctx) => {
        const contextPlan = ctx.subscriptionPlan
        return contextPlan && (contextPlan[appField] || []).includes(appId)
    })
}

function findLastServiceContext (sortedContexts) {
    const serviceContexts = sortedContexts.filter(ctx =>
        ctx.subscriptionPlan?.planType === SUBSCRIPTION_PLAN_TYPE_SERVICE
    )
    if (serviceContexts.length === 0) return null
    return serviceContexts.reduce((latest, ctx) => {
        if (!latest) return ctx
        return dayjs(ctx.endAt).isAfter(dayjs(latest.endAt)) ? ctx : latest
    }, null)
}


const ORGANIZATION_SUBSCRIPTION_FIELD = {
    schemaDoc: 'Subscription information for this organization. Returns feature expiration dates (ISO strings or null), ' +
        'enabled apps from active contexts, active subscription end date and active context ID. ' +
        'Features available until expiration date (exclusive).',
    type: 'Virtual',
    extendGraphQLTypes: SUBSCRIPTION_FEATURES_GRAPHQL_TYPES,
    graphQLReturnType: SUBSCRIPTION_FEATURES_TYPE_NAME,
    graphQLReturnFragment: '{ paymentsEndAt metersEndAt ticketsEndAt newsEndAt marketplaceEndAt supportEndAt aiEndAt customizationEndAt propertiesEndAt analyticsEndAt b2bApps { id endAt } b2cApps { id endAt } activeSubscriptionContextId activeSubscriptionEndAt }',
    resolver: async (organization, args, context) => {
        const hasSubscriptionFeature = await featureToggleManager.isFeatureEnabled(context, SUBSCRIPTIONS, { 
            userId: context.authedItem?.id || null,
        })
        const futureDate = dayjs().add(100, 'years').format('YYYY-MM-DD')
        if (!enableSubscriptions || !hasSubscriptionFeature) {
            return await buildSubscriptionResponse(futureDate)
        }
        const plansForType = await find('SubscriptionPlan', {
            organizationType: organization.type,
            deletedAt: null,
        })
        if (plansForType.length === 0) {
            return await buildSubscriptionResponse(futureDate)
        }

        const allContexts = await find('SubscriptionContext', {
            organization: { id: organization.id },
            status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
            deletedAt: null,
        })
        if (allContexts.length === 0) {
            return await buildSubscriptionResponse(null)
        }

        const now = new Date().toISOString()
        const contextsWithPlans = await enrichContextsWithPlans(allContexts)
        const activeContexts = filterActiveContexts(contextsWithPlans, now)
        const activeServiceContexts = activeContexts.filter(ctx =>
            ctx.subscriptionPlan?.planType === SUBSCRIPTION_PLAN_TYPE_SERVICE
        )
        const bestActiveServiceContext = activeServiceContexts.length > 0
            ? selectBestSubscriptionContext(activeServiceContexts)
            : null

        const sortedContexts = [...contextsWithPlans].sort((a, b) => {
            if (!a.startAt || !b.startAt) return 0
            return dayjs(a.startAt).diff(dayjs(b.startAt))
        })

        const featureExpirationDates = calculateFeatureExpirationDates(sortedContexts, now)
        const { activeSubscriptionEndAt } = calculateSubscriptionEndAt(sortedContexts, bestActiveServiceContext, now)
        const { b2bApps, b2cApps } = await calculateAppsExpiration(sortedContexts, now, organization.type)

        let activeSubscriptionContextId = bestActiveServiceContext?.id || null
        let finalActiveSubscriptionEndAt = activeSubscriptionEndAt

        if (!bestActiveServiceContext) {
            const lastServiceCtx = findLastServiceContext(sortedContexts)
            if (lastServiceCtx) {
                activeSubscriptionContextId = lastServiceCtx.id
                finalActiveSubscriptionEndAt = addBufferDaysToDate(lastServiceCtx.endAt, lastServiceCtx.isTrial)
            }
        }

        return {
            paymentsEndAt: featureExpirationDates.payments,
            metersEndAt: featureExpirationDates.meters,
            ticketsEndAt: featureExpirationDates.tickets,
            newsEndAt: featureExpirationDates.news,
            marketplaceEndAt: featureExpirationDates.marketplace,
            supportEndAt: featureExpirationDates.support,
            aiEndAt: featureExpirationDates.ai,
            customizationEndAt: featureExpirationDates.customization,
            propertiesEndAt: featureExpirationDates.properties,
            analyticsEndAt: featureExpirationDates.analytics,
            b2bApps,
            b2cApps,
            activeSubscriptionContextId,
            activeSubscriptionEndAt: finalActiveSubscriptionEndAt,
        }
    },
}

module.exports = {
    ORGANIZATION_SUBSCRIPTION_FIELD,
}
