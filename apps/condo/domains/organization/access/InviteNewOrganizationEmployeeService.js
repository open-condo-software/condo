const { get } = require('lodash')

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

const { checkPermissionInUserOrganizationOrRelatedOrganization } = require('../utils/accessSchema')

async function canInviteNewOrganizationEmployee ({ authentication: { item: user }, args }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return true

    const organizationId = get(args, ['data', 'organization', 'id'])
    if (!organizationId) return false

    return await checkPermissionInUserOrganizationOrRelatedOrganization(user.id, organizationId, 'canInviteNewOrganizationEmployees')
}

module.exports = {
    canInviteNewOrganizationEmployee,
}
