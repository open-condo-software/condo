const { get } = require('lodash')
const { throwAuthenticationError } = require('@condo/keystone/apolloErrorFormatter')
const { checkOrganizationPermission } = require('@condo/domains/organization/utils/accessSchema')

async function canInviteNewOrganizationEmployee ({ authentication: { item: user }, args }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin) return true

    const organizationId = get(args, ['data', 'organization', 'id'])
    if (!organizationId) return false

    return await checkOrganizationPermission(user.id, organizationId, 'canManageEmployees')
}

module.exports = {
    canInviteNewOrganizationEmployee,
}
