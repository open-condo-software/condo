// Core logic is based on https://github.com/keystonejs/keystone/blob/master/examples-next/roles/access.ts
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
    canManageEmployees: ({ authentication: { item: user } }) => {
        if (!user) return false
        if (user.isAdmin) return {}
        return {
            // user is inside employee list
            organization: { employees_some: { user: { id: user.id, canManageEmployees: true } } },
        }
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
            organization: { employees_some: { user: { id: user.id, canManageRoles: true } } },
        }
    },
    canRegisterNewOrganization: isSignedIn,
    canInviteEmployee: async ({ authentication: { item: user }, args, context }) => {
        // allowAccessForRoleOwnerForInviteNewUserToOrganizationService, find
        if (!user || !user.id) return false
        if (user.isAdmin) return true
        if (!args || !args.data || !args.data.organization || !args.data.organization.id) return false
        const orgId = args.data.organization.id
        const res = await find('OrganizationEmployee', {
            organization: { id: orgId },
            user: { id: user.id },
            role: 'owner',
        })
        return res.length === 1
    },
    canAcceptOrRejectEmployeeInvite: async ({ authentication: { item: user }, args, context }) => {
        // allowAccessForNotAssignedInvitesForAcceptOrRejectOrganizationInviteService, find
        if (!user || !user.id) return false
        if (user.isAdmin) return true
        if (!args || !args.code) return false
        const { code } = args
        const res = await find('OrganizationEmployee', { code, user_is_null: true })
        // TODO(pahaz): check is user email/phone is verified
        return res.length === 1

        // allowAccessForOwnInviteForAcceptOrRejectOrganizationInviteService
        // if (!user || !user.id) return false
        // if (user.isAdmin) return true
        // if (!args || !args.id) return false
        // const { id } = args
        // const link = await getById('OrganizationEmployee', id)
        // const linkUser = await getById('User', link.user)
        // if (!link || !linkUser) return false
        // // TODO(pahaz): check is user email/phone is verified
        // return String(link.user) === String(user.id)

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
