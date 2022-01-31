const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const { checkOrganizationPermission, checkRelatedOrganizationPermission } = require('@condo/domains/organization/utils/accessSchema')
const get = require('lodash/get')
const { find } = require('@core/keystone/schema')

async function canExportTicketsToExcel ({ args: { data: { where } }, authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    
    if (user.isAdmin) return true
    const organizationId = get(where, ['organization', 'id'])
    if (organizationId) return await checkOrganizationPermission(user.id, organizationId, 'canManageTickets')
    const organizationWhere = get(where, 'organization')
    const [organization] = await find('Organization', organizationWhere)
    if (!organization) return false

    return await checkRelatedOrganizationPermission(user.id, organization.id, 'canManageTickets')

}

module.exports = {
    canExportTicketsToExcel,
}
