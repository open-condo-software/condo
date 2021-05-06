const { getByCondition } = require('@core/keystone/schema')
const { getById } = require('@core/keystone/schema')

async function canReadEmployees ({ authentication: { item: user } }) {
    if (!user) return false
    if (user.isAdmin) return {}
    return {
        // user is inside employee list
        organization: { employees_some: { user: { id: user.id } } },
    }
}

async function canManageEmployees (args) {
    const { authentication: { item: user }, operation, itemId } = args
    if (!user) return false
    if (user.isAdmin) return true
    if (operation === 'update' || operation === 'delete') {
        if (!itemId) return false
        const employeeToEdit = await getById('OrganizationEmployee', itemId)
        if (!employeeToEdit || !employeeToEdit.organization) return false
        const employeeForUser = await getByCondition('OrganizationEmployee', {
            organization: { id: employeeToEdit.organization },
            user: { id: user.id },
        })
        if (!employeeForUser || !employeeForUser.role) return false
        const employeeRole = await getByCondition('OrganizationEmployeeRole', {
            id: employeeForUser.role,
            organization: { id: employeeToEdit.organization },
        })
        if (!employeeRole) return false
        return employeeRole.canManageEmployees
    }
    return false
}

module.exports = {
    canReadEmployees,
    canManageEmployees,
}