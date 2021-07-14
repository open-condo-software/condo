const { checkOrganizationPermission } = require('@condo/domains/organization/utils/accessSchema')
const get = require('lodash/get')

async function canExportTicketsToExcel ({ args: { data: { where } }, authentication: { item: user } }) {
    if (!user) return false
    if (user.isAdmin) return true
    const organizationId = get(where, 'organization.id')
    if (!organizationId) {
        return false
    }
    const hasAccess = await checkOrganizationPermission(user.id, organizationId, 'canManageTickets')
    return hasAccess
}

module.exports = {
    canExportTicketsToExcel,
}
