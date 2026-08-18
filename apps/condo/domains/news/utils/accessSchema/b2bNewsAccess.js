const get = require('lodash/get')

const { canManageObjectsAsB2BAppServiceUser } = require('@condo/domains/miniapp/utils/b2bAppServiceUserAccess')
const { SERVICE } = require('@condo/domains/user/constants/common')


/**
 * Reuses existing B2B `canManageNewsItems` rights.
 * Apps that already create NewsItem (e.g. debt-management) can also count/export recipients.
 */
async function canManageNewsAsB2BAppServiceUser (args, organizationId) {
    const user = get(args, ['authentication', 'item'])
    if (!user || user.type !== SERVICE || user.deletedAt || !organizationId) return false

    return await canManageObjectsAsB2BAppServiceUser({
        ...args,
        listKey: 'NewsItem',
        originalInput: { organization: { connect: { id: organizationId } } },
        operation: 'create',
    })
}

module.exports = {
    canManageNewsAsB2BAppServiceUser,
}
