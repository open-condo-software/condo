/**
 * Access rules for ActivateSubscriptionPlanService
 */

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

async function canActivateSubscriptionPlan ({ args, authentication: { item: user }, context }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    // Admins and support can always activate
    if (user.isAdmin || user.isSupport) return true

    // Regular users can only activate for organizations they belong to
    const { data } = args
    const organizationId = data?.organization?.id

    if (!organizationId) return false

    const { OrganizationEmployee } = require('@condo/domains/organization/utils/serverSchema')

    const [employee] = await OrganizationEmployee.getAll(context, {
        organization: { id: organizationId },
        user: { id: user.id },
        isBlocked: false,
        deletedAt: null,
    }, { first: 1 })

    if (!employee) return false

    // TODO: Add role check if needed (e.g., only admins of organization can activate)
    // if (!employee.role?.canManageSubscription) return false

    return true
}

module.exports = {
    canActivateSubscriptionPlan,
}
