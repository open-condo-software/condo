const { get } = require('lodash')

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { getByCondition, getById } = require('@open-condo/keystone/schema')

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
        if (!employee || employee.deletedAt || !employee.user) return false
        return employee.user === user.id
    }
}

module.exports = {
    canAcceptOrRejectOrganizationInvite,
}
