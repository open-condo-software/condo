const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const {
    checkOrganizationPermission,
    checkRelatedOrganizationPermission,
} = require('@condo/domains/organization/utils/accessSchema')
const { Organization } = require('@condo/domains/organization/utils/serverSchema')
const get = require('lodash/get')

async function canExportContactsToExcel ({ args: { data: { where } }, authentication: { item: user }, context }) {
    if (!user) {
        return throwAuthenticationError()
    }

    if (user.isAdmin) {
        return true
    }

    const organizationId = get(where, 'organization.id')

    if (!organizationId) {
        const organizationFromWhere = get(where, 'organization')
        const [relatedFromOrganization] = await Organization.getAll(context, organizationFromWhere)
        if (!relatedFromOrganization) {
            return false
        }

        const canManageRelatedOrganizationContacts = await checkRelatedOrganizationPermission(context, user.id, relatedFromOrganization.id, 'canManageContacts')

        return !!canManageRelatedOrganizationContacts
    }

    return await checkOrganizationPermission(context, user.id, organizationId, 'canManageContacts')
}

module.exports = {
    canExportContactsToExcel,
}
