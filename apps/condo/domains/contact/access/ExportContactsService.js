const get = require('lodash/get')

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { find } = require('@open-condo/keystone/schema')

const {
    checkOrganizationPermission,
    checkRelatedOrganizationPermission,
} = require('@condo/domains/organization/utils/accessSchema')

async function canExportContactsToExcel ({ args: { data: { where } }, authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin) return true

    const organizationId = get(where, 'organization.id')

    if (organizationId) {
        return await checkOrganizationPermission(user.id, organizationId, 'canManageContacts')
    } else {
        const organizationWhere = get(where, 'organization')
        if (!organizationWhere) return false
        const [relatedFromOrganization] = await find('Organization', organizationWhere)
        if (!relatedFromOrganization) return false

        return await checkRelatedOrganizationPermission(user.id, relatedFromOrganization.id, 'canManageContacts')
    }
}

module.exports = {
    canExportContactsToExcel,
}
