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

function isAppAvailableForOrganization (org, appId, plansByOrgType) {
    const orgPlans = plansByOrgType[org.type] || []
    
    if (orgPlans.length === 0) {
        return true
    }
    
    const allEnabledB2CApps = new Set(orgPlans.map(plan => plan.enabledB2CApps ?? []).flat())

    if (!allEnabledB2CApps.has(appId)) {
        return true
    }

    const subscription = org.subscription
    if (!subscription || !subscription.activeSubscriptionContextId) {
        return false
    }

    const currentEnabledApps = subscription.enabledB2CApps || []
    return currentEnabledApps.includes(appId)
}

async function isB2CAppAvailableForAddress (appId, addressKey, context) {
    const properties = await find('Property', {
        addressKey,
        deletedAt: null,
    }, { context })

    if (properties.length === 0) {
        return true
    }

    const organizationIds = [...new Set(properties.map(p => p.organization).filter(Boolean))]
    
    if (organizationIds.length === 0) {
        return true
    }

    const organizations = await Organization.getAll(context, {
        id_in: organizationIds,
        deletedAt: null,
    }, 'id type subscription { activeSubscriptionContextId enabledB2CApps }')

    if (organizations.length === 0) {
        return true
    }

    const allPlans = await find('SubscriptionPlan', {
        deletedAt: null,
        isHidden: false,
    }, { context })

    const plansByOrgType = groupPlansByOrgType(allPlans)
    
    for (const org of organizations) {
        if (isAppAvailableForOrganization(org, appId, plansByOrgType)) {
            return true
        }
    }

    return false
}

module.exports = {
    groupPlansByOrgType,
    isAppAvailableForOrganization,
    isB2CAppAvailableForAddress,
}
