const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const {
    checkOrganizationPermission,
    checkRelatedOrganizationPermission,
} = require('@condo/domains/organization/utils/accessSchema')
const get = require('lodash/get')
const { Organization } = require('@condo/domains/organization/utils/serverSchema')

async function canExportTicketsToExcel({
    args: {
        data: { where },
    },
    authentication: { item: user },
    context,
}) {
    if (!user) return throwAuthenticationError()
    if (user.isAdmin) return true
    const organizationId = get(where, 'organization.id')
    if (!organizationId) {
        const organizationFromWhere = get(where, 'organization')
        const [relatedFromOrganization] = await Organization.getAll(context, organizationFromWhere)
        if (!relatedFromOrganization) {
            return false
        }
        const canManageRelatedOrganizationTickets = await checkRelatedOrganizationPermission(
            context,
            user.id,
            relatedFromOrganization.id,
            'canManageTickets',
        )
        if (canManageRelatedOrganizationTickets) {
            return true
        }
        return false
    }
    const hasAccess = await checkOrganizationPermission(context, user.id, organizationId, 'canManageTickets')
    return hasAccess
}

module.exports = {
    canExportTicketsToExcel,
}
