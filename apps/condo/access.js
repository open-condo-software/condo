// Core logic is based on https://github.com/keystonejs/keystone/blob/master/examples-next/roles/access.ts
const { getByCondition, getById } = require('@core/keystone/schema')
const { userIsAuthenticated, userIsAdmin } = require('@core/keystone/access')

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

async function checkOrganizationPermission (userId, organizationId, permission) {
    if (!userId || !organizationId) return false
    const employee = await getByCondition('OrganizationEmployee', {
        organization: { id: organizationId },
        user: { id: userId },
    })
    if (!employee || !employee.role) return false
    const employeeRole = await getByCondition('OrganizationEmployeeRole', {
        id: employee.role,
        organization: { id: organizationId },
    })
    if (!employeeRole) return false
    return employeeRole[permission] || false
}

async function checkBillingIntegrationAccessRight (userId, integrationId) {
    if (!userId || !integrationId) return false
    const integration = await getByCondition('BillingIntegrationAccessRight', {
        integration: { id: integrationId },
        user: { id: userId },
    })
    return Boolean(integration && integration.id)
}

/*
  Rules are logical functions that can be used for list access, and may return a boolean (meaning
  all or no items are available) or a set of filters that limit the available items
*/
const rules = {

    /*

      Organization

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
        const organizationId = args.data.organization.id
        return await checkOrganizationPermission(user.id, organizationId, 'canManageEmployees')
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

    /*

      Billing

    */
    canReadBillingIntegrations: isSignedIn,
    canManageBillingIntegrations: userIsAdmin,
    canReadBillingIntegrationAccessRights: userIsAdmin,
    canManageBillingIntegrationAccessRights: userIsAdmin,
    canReadBillingIntegrationOrganizationContexts: ({ authentication: { item: user } }) => {
        if (!user) return false
        if (user.isAdmin) return true
        return {
            // TODO(pahaz): wait https://github.com/keystonejs/keystone/issues/4829 (no access check!)
            // OR: [
            //     { organization: { employees_some: { user: { id: user.id }, role: { canManageIntegrations: true } } } },
            //     { integration: { accessRights_some: { user: { id: user.id } } } },
            // ],
        }
    },
    canManageBillingIntegrationOrganizationContexts: async ({ authentication: { item: user }, originalInput, operation, itemId }) => {
        if (!user) return false
        if (user.isAdmin) return true
        if (operation === 'create') {
            // NOTE: can create only by the organization integration manager
            if (!originalInput || !originalInput.organization || !originalInput.organization.connect || !originalInput.organization.connect.id) return false
            const organizationId = originalInput.organization.connect.id
            return await checkOrganizationPermission(user.id, organizationId, 'canManageIntegrations')
        } else if (operation === 'update') {
            // NOTE: can update by the organization integration manager OR the integration account
            if (!itemId) return false
            const context = await getById('BillingIntegrationOrganizationContext', itemId)
            if (!context) return false
            const organizationId = context.organization
            const integrationId = context.integration
            const canManageIntegrations = await checkOrganizationPermission(user.id, organizationId, 'canManageIntegrations')
            if (canManageIntegrations) return true
            return await checkBillingIntegrationAccessRight(user.id, integrationId)
        }
        return false
    },
    canReadBillingIntegrationLogs: ({ authentication: { item: user } }) => {
        if (!user) return false
        if (user.isAdmin) return true
        return {
            // TODO(pahaz): wait https://github.com/keystonejs/keystone/issues/4829 (no access check!)
            // context: {
            //     OR: [
            //         {
            //             organization: {
            //                 employees_some: {
            //                     user: { id: user.id },
            //                     role: { canManageIntegrations: true },
            //                 },
            //             },
            //         },
            //         { integration: { accessRights_some: { user: { id: user.id } } } },
            //     ],
            // },
        }
    },
    canManageBillingIntegrationLogs: async ({ authentication: { item: user }, originalInput, operation, itemId }) => {
        if (!user) return false
        if (user.isAdmin) return true
        let contextId
        if (operation === 'create') {
            // NOTE: can create only by the integration account
            if (!originalInput || !originalInput.context || !originalInput.context.connect || !originalInput.context.connect.id) return false
            contextId = originalInput.context.connect.id
        } else if (operation === 'update' || operation === 'delete') {
            // NOTE: can update only by the integration account
            if (!itemId) return false
            const log = await getById('BillingIntegrationLog', itemId)
            contextId = log.context
        } else {
            return false
        }
        const context = await getById('BillingIntegrationOrganizationContext', contextId)
        if (!context) return false
        const integrationId = context.integration
        return await checkBillingIntegrationAccessRight(user.id, integrationId)
    },
    // TODO(pahaz): we needed a right logic here! wait https://github.com/keystonejs/keystone/issues/4829
    canReadBillingProperties: isSignedIn,
    canManageBillingProperties: isSignedIn,
    canReadBillingAccounts: isSignedIn,
    canManageBillingAccounts: isSignedIn,
    canReadBillingMeterResources: isSignedIn,
    canManageBillingMeterResources: isSignedIn,
    canReadBillingAccountMeters: isSignedIn,
    canManageBillingAccountMeters: isSignedIn,
    canReadAccountMeterReadings: isSignedIn,
    canManageAccountMeterReadings: isSignedIn,
    canReadBillingReceipts: isSignedIn,
    canManageBillingReceipts: isSignedIn,
}

module.exports = {
    isSignedIn,
    permissions,
    rules,
}
