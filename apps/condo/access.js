// Core logic is based on https://github.com/keystonejs/keystone/blob/master/examples-next/roles/access.ts
const { getByCondition, getById } = require('@core/keystone/schema')
const { userIsAuthenticated } = require('@core/keystone/access')

const isSignedIn = userIsAuthenticated

// TODO(pahaz): check sotfDeleted() right access chack in deleted case!? (for all models)

/*
  Permissions are shorthand functions for checking that the current user's role has the specified
  permission boolean set to true
*/
const permissions = {
    // canCreateTodos: () => !!session?.data.role?.canCreateTodos,
    canManageEmployees: () => true,
    canManageRoles: () => true,
}

/*
  Rules are logical functions that can be used for list access, and may return a boolean (meaning
  all or no items are available) or a set of filters that limit the available items
*/
const rules = {

    /*

      Organizations

    */
    canReadOrganizations: isSignedIn,
    canManageOrganizations: ({ authentication: { item: user } }) => {
        if (!user) return false
        if (user.isAdmin) return true
        return {
            // user is inside employee list
            employees_some: { user: { id: user.id, canManageOrganization: true } },
        }
    },
    canReadEmployees: ({ authentication: { item: user } }) => {
        if (!user) return false
        if (user.isAdmin) return {}
        return {
            // user is inside employee list
            organization: { employees_some: { user: { id: user.id } } },
        }
    },
    canManageEmployees: async (args) => {
        const { authentication: { item: user }, operation } = args
        if (!user) return false
        if (user.isAdmin) return true
        if (operation === 'create') return false
        if (operation !== 'update' && operation !== 'delete') return false
        const { id } = args
        if (!id) return false
        const obj = await getById('OrganizationEmployee', id)
        const employee = await getByCondition('OrganizationEmployee', {
            organization: { id: obj.organization },
            user: { id: user.id },
        })
        const employeeRole = await getByCondition('OrganizationEmployeeRole', {
            id: employee.role,
            organization: { id: obj.organization },
        })
        return employeeRole && employeeRole.canManageEmployees
    },
    canReadRoles: ({ authentication: { item: user } }) => {
        if (!user) return false
        if (user.isAdmin) return {}
        return {}
    },
    canManageRoles: ({ authentication: { item: user } }) => {
        if (!user) return false
        if (user.isAdmin) return {}
        return {
            // user is inside employee list
            organization: { employees_some: { user: { id: user.id }, role: { canManageRoles: true } } },
        }
    },
    canRegisterNewOrganization: isSignedIn,
    canInviteEmployee: async ({ authentication: { item: user }, args, context }) => {
        if (!user || !user.id) return false
        if (user.isAdmin) return true
        if (!args || !args.data || !args.data.organization || !args.data.organization.id) return false
        const orgId = args.data.organization.id
        const employee = await getByCondition('OrganizationEmployee', {
            organization: { id: orgId },
            user: { id: user.id },
        })
        const employeeRole = await getByCondition('OrganizationEmployeeRole', {
            id: employee.role,
            organization: { id: orgId },
        })
        return employeeRole && employeeRole.canManageEmployees
    },
    canAcceptOrRejectEmployeeInvite: async ({ authentication: { item: user }, args, context }) => {
        if (!user || !user.id) return false
        if (user.isAdmin) return true
        if (!args) return false
        const { id, data, inviteCode } = args
        if (inviteCode) {
            const employee = await getByCondition('OrganizationEmployee', { inviteCode, user_is_null: true })
            // TODO(pahaz): check is employee user email/phone is verified?
            return Boolean(employee)
        }
        if (id && data) {
            const employee = await getById('OrganizationEmployee', id)
            if (!employee) return false
            const user = await getById('User', employee.user)
            if (!user) return false
            // TODO(pahaz): check is user email/phone is verified
            return String(employee.user) === String(user.id)
        }
        return false
    },

    // canUpdatePeople: ({ session }: ListAccessArgs) => {
    //     if (!session) {
    //         // No session? No people.
    //         return false;
    //     } else if (session.data.role?.canEditOtherPeople) {
    //         // Can update everyone
    //         return true;
    //     } else {
    //         // Can update yourself
    //         return { id: session.itemId };
    //     }
    // },
}

module.exports = {
    isSignedIn,
    permissions,
    rules,
}
