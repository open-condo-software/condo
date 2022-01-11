const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const { USER_SCHEMA_NAME } = require('@condo/domains/common/constants/utils')
const { checkOrganizationPermission, checkRelatedOrganizationPermission } = require('@condo/domains/organization/utils/accessSchema')
const get = require('lodash/get')
const { find } = require('@core/keystone/schema')

async function canExportTicketsToExcel ({ args: { data: { where } }, authentication: { item, listKey } }) {
    if (!listKey || !item) return throwAuthenticationError()
    if (item.deletedAt) return false

    if (listKey === USER_SCHEMA_NAME) {
        if (item.isAdmin) return true
        const organizationId = get(where, ['organization', 'id'])
        if (organizationId) return await checkOrganizationPermission(item.id, organizationId, 'canManageTickets')
        const organizationWhere = get(where, 'organization')
        const [organization] = await find('Organization', organizationWhere)
        if (!organization) return false

        return await checkRelatedOrganizationPermission(item.id, organization.id, 'canManageTickets')

    }

    return false
}

module.exports = {
    canExportTicketsToExcel,
}
