/**
 * Access rules for GetAvailableSubscriptionPlansService
 */

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

const { checkUserEmploymentOrRelationToOrganization } = require('@condo/domains/organization/utils/accessSchema')

async function canGetAvailableSubscriptionPlans ({ args, authentication: { item: user }, context }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (user.isAdmin || user.isSupport) return true

    const organizationId = args?.organization?.id
    if (!organizationId) return false

    return await checkUserEmploymentOrRelationToOrganization(context, user, organizationId)
}

module.exports = {
    canGetAvailableSubscriptionPlans,
}
