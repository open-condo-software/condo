/**
 * Access rules for ActivateSubscriptionPlanService
 */

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

const { checkPermissionsInEmployedOrRelatedOrganizations } = require('@condo/domains/organization/utils/accessSchema')

async function canActivateSubscriptionPlan ({ args, authentication: { item: user }, context }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (user.isAdmin || user.isSupport) return true

    const { data } = args
    const organizationId = data?.organization?.id

    if (!organizationId) return false

    return await checkPermissionsInEmployedOrRelatedOrganizations(context, user, organizationId, 'canManageSubscriptions')
}

module.exports = {
    canActivateSubscriptionPlan,
}
