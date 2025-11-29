/**
 * Access rules for GetAvailableSubscriptionPlansService
 */

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

async function canGetAvailableSubscriptionPlans ({ args, authentication: { item: user }, context }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    // Admins and support can always access
    if (user.isAdmin || user.isSupport) return true

    // Regular users can only get plans for organizations they belong to
    const { organizationId } = args

    if (!organizationId) return false

    const { OrganizationEmployee } = require('@condo/domains/organization/utils/serverSchema')

    const [employee] = await OrganizationEmployee.getAll(context, {
        organization: { id: organizationId },
        user: { id: user.id },
        isBlocked: false,
        deletedAt: null,
    }, { first: 1 })

    return !!employee
}

module.exports = {
    canGetAvailableSubscriptionPlans,
}
