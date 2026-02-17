const dayjs = require('dayjs')

const { find } = require('@open-condo/keystone/schema')

const { Organization } = require('@condo/domains/organization/utils/serverSchema')


function groupPlansByOrgType (plans) {
    const plansByOrgType = {}
    for (const plan of plans) {
        if (!plansByOrgType[plan.organizationType]) {
            plansByOrgType[plan.organizationType] = []
        }
        plansByOrgType[plan.organizationType].push(plan)
    }
    return plansByOrgType
}

function getAppSubscriptionEndDate (org, appId, appType, plansByOrgType) {
    const orgPlans = plansByOrgType[org.type] || []
    
    if (orgPlans.length === 0) {
        return dayjs().add(100, 'years').toISOString()
    }
    
    const appField = appType === 'B2C' ? 'enabledB2CApps' : 'enabledB2BApps'
    const allEnabledApps = new Set(orgPlans.map(plan => plan[appField] ?? []).flat())

    if (!allEnabledApps.has(appId)) {
        return org.subscription?.activeSubscriptionEndAt || dayjs().add(100, 'years').toISOString()
    }

    const subscription = org.subscription
    if (!subscription) {
        return null
    }

    const enabledApps = subscription[appField] || []
    if (!enabledApps.includes(appId)) {
        return null
    }

    return subscription.activeSubscriptionEndAt || null
}

async function getB2CAppSubscriptionEndDate (appId, addressKey, context) {
    const properties = await find('Property', {
        addressKey,
        deletedAt: null,
    }, { context })

    if (properties.length === 0) {
        return dayjs().add(100, 'years').toISOString()
    }

    const organizationIds = [...new Set(properties.map(p => p.organization).filter(Boolean))]
    
    if (organizationIds.length === 0) {
        return dayjs().add(100, 'years').toISOString()
    }

    const organizations = await Organization.getAll(context, {
        id_in: organizationIds,
        deletedAt: null,
    }, 'id type subscription { activeSubscriptionEndAt enabledB2CApps }')

    if (organizations.length === 0) {
        return dayjs().add(100, 'years').toISOString()
    }

    const allPlans = await find('SubscriptionPlan', {
        deletedAt: null,
        isHidden: false,
    }, { context })

    const plansByOrgType = groupPlansByOrgType(allPlans)
    
    let maxEndDate = null

    for (const org of organizations) {
        const endDate = getAppSubscriptionEndDate(org, appId, 'B2C', plansByOrgType)
        if (endDate) {
            const endDateDayjs = dayjs(endDate)
            if (!maxEndDate || endDateDayjs.isAfter(maxEndDate)) {
                maxEndDate = endDateDayjs
            }
        }
    }

    return maxEndDate ? maxEndDate.toISOString() : null
}

module.exports = {
    groupPlansByOrgType,
    getAppSubscriptionEndDate,
    getB2CAppSubscriptionEndDate,
}
