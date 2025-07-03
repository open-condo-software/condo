const get = require('lodash/get')

const conf = require('@open-condo/config')

const { OrganizationEmployee, B2BAppRole } = require('./serverSchema')


const B2B_APP_ID = conf['CONDO_B2B_APP_ID']


async function getOrganizationPermissions (context, userId, organizationId) {
    if (!userId || !organizationId) return null

    const employee = await OrganizationEmployee.getOne(context, {
        organization: { id: organizationId, deletedAt: null },
        user: { id: userId, deletedAt: null },
        deletedAt: null,
        isAccepted: true,
        isBlocked: false,
        isRejected: false,
    })

    if (!employee) return null

    const roleId = get(employee, 'role.id', null)
    if (!roleId) return null

    const b2bAppRole = await B2BAppRole.getOne(context, {
        role: { id: roleId, deletedAt: null },
        app: { id: B2B_APP_ID, deletedAt: null },
        deletedAt: null,
    })

    return get(b2bAppRole, 'permissions', null)
}


module.exports = {
    getOrganizationPermissions,
}
