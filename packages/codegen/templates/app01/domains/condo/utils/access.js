const get = require('lodash/get')
const isArray = require('lodash/isArray')
const isObject = require('lodash/isObject')

const conf = require('@open-condo/config')

const { hasAllRequiredPermissions } = require('./helpers')
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
        role: { id: roleId },
        app: { id: B2B_APP_ID, deletedAt: null },
        deletedAt: null,
    })

    return get(b2bAppRole, 'permissions', null)
}

async function checkOrganizationPermission (context, userId, organizationId, requiredPermissions = []) {
    if (!userId || !organizationId) return false

    if (!isArray(requiredPermissions)) {
        console.warn('requiredPermissions must be array!')
        return false
    }

    const permissions = await getOrganizationPermissions(context, userId, organizationId)

    if (!isObject(permissions)) return false

    return hasAllRequiredPermissions(permissions, requiredPermissions)
}

async function checkPermissionInUserOrganization (context, userId, organizationId, requiredPermissions = []) {
    if (!userId || !organizationId) return false
    return await checkOrganizationPermission(context, userId, organizationId, requiredPermissions)
}


module.exports = {
    checkPermissionInUserOrganization,
    getOrganizationPermissions,
}
