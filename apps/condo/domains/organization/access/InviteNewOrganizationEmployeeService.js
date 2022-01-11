const { get } = require('lodash')
const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const { checkOrganizationPermission } = require('@condo/domains/organization/utils/accessSchema')
const { USER_SCHEMA_NAME } = require('@condo/domains/common/constants/utils')

async function canInviteNewOrganizationEmployee ({ authentication: { item, listKey }, args }) {
    if (!listKey || !item) return throwAuthenticationError()
    if (item.deletedAt) return false

    if (listKey === USER_SCHEMA_NAME) {
        if (item.isAdmin) return true
        const organizationId = get(args, ['data', 'organization', 'id'])
        if (!organizationId) return false

        return await checkOrganizationPermission(item.id, organizationId, 'canManageEmployees')
    }

    return false
}

module.exports = {
    canInviteNewOrganizationEmployee,
}
