const get = require('lodash/get')

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

const { checkPermissionsInEmployedOrRelatedOrganizations } = require('@condo/domains/organization/utils/accessSchema')

async function canInviteNewOrganizationEmployee ({ authentication: { item: user }, args, context }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return true

    const organizationId = get(args, ['data', 'organization', 'id'])
    if (!organizationId) return false

    return await checkPermissionsInEmployedOrRelatedOrganizations(context, user, organizationId, 'canInviteNewOrganizationEmployees')
}

module.exports = {
    canInviteNewOrganizationEmployee,
}
