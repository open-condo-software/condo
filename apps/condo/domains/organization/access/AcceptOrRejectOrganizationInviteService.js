const { get } = require('lodash')
const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const { getByCondition, getById } = require('@core/keystone/schema')

async function canAcceptOrRejectOrganizationInvite ({ authentication: { item: user }, args }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin) return true
    if (!args) return false

    const { id, data, inviteCode } = args
    if (inviteCode) {
        const employee = await getByCondition('OrganizationEmployee', { inviteCode, user_is_null: true, deletedAt: null })

        // TODO(pahaz): check is employee user email/phone is verified?
        return !!get(employee, 'id')
    }
    if (id && data) {
        const employee = await getById('OrganizationEmployee', id)
        if (!employee || employee.deletedAt) return false
        const user = await getById('User', employee.user)
        if (!user) return false

        // TODO(pahaz): check is user email/phone is verified
        return employee.user === user.id
    }
}

module.exports = {
    canAcceptOrRejectOrganizationInvite,
}
