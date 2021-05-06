// Core logic is based on https://github.com/keystonejs/keystone/blob/master/examples-next/roles/access.ts
const { get } = require('lodash')

const { getByCondition, getById } = require('@core/keystone/schema')
const { userIsAuthenticated, userIsAdmin } = require('@core/keystone/access')
const { checkOrganizationPermission } = require('@condo/domains/organization/utils/accessSchema')
const { checkBillingIntegrationAccessRight } = require('@condo/domains/billing/utils/accessSchema')

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

      Organization

    */
    canReadEmployees: ({ authentication: { item: user } }) => {
        if (!user) return false
        if (user.isAdmin) return {}
        return {
            // user is inside employee list
            organization: { employees_some: { user: { id: user.id } } },
        }
    },
    canManageEmployees: async (args) => {
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
    },
    canReadRoles: ({ authentication: { item: user } }) => {
        if (!user) return false
        if (user.isAdmin) return {}
        return {}
    },
    canManageRoles: async ({ authentication: { item: user }, operation, originalInput }) => {
        if (!user) return false
        if (operation === 'create') {
            // `GraphQLWhere` type cannot be used in case of `create` operation,
            // because we will get an error:
            // > Expected a Boolean for OrganizationEmployeeRole.access.create(), but got Object
            // In https://www.keystonejs.com/api/access-control#list-level-access-control it states:
            // > For `create` operations, an `AccessDeniedError` is returned if the operation is set to / returns `false`
            // Actually, here we repeating the same logic, as declared for another operations
            if (user.isAdmin) return true
            const employeeForUser = await getByCondition('OrganizationEmployee', {
                organization: { id: originalInput.organization.connect.id },
                user: { id: user.id },
            })
            const employeeRole = await getByCondition('OrganizationEmployeeRole', {
                id: employeeForUser.role,
            })
            if (!employeeRole) return false
            return employeeRole.canManageRoles
        } else {
            if (user.isAdmin) return {}
            return {
                // user is inside employee list
                organization: { employees_some: { user: { id: user.id }, role: { canManageRoles: true } } },
            }
        }
    },
    canRegisterNewOrganization: isSignedIn,
    canInviteEmployee: async ({ authentication: { item: user }, args }) => {
        if (!user || !user.id) return false
        if (user.isAdmin) return true
        const organizationId = get(args, ['data', 'organization', 'id'])
        if (!organizationId) return false
        return await checkOrganizationPermission(user.id, organizationId, 'canManageEmployees')
    },
    canAcceptOrRejectEmployeeInvite: async ({ authentication: { item: user }, args }) => {
        if (!user || !user.id) return false
        if (user.isAdmin) return true
        if (!args) return false
        const { id, data, inviteCode } = args
        if (inviteCode) {
            const employee = await getByCondition('OrganizationEmployee', { inviteCode, user_is_null: true })
            // TODO(pahaz): check is employee user email/phone is verified?
            return !!get(employee, 'id')
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
    canUpdateTicketStatusTransitions: userIsAdmin,
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
            const organizationId = get(originalInput, ['organization', 'connect', 'id'])
            if (!organizationId) return false
            return await checkOrganizationPermission(user.id, organizationId, 'canManageIntegrations')
        } else if (operation === 'update') {
            // NOTE: can update by the organization integration manager OR the integration account
            if (!itemId) return false
            const context = await getById('BillingIntegrationOrganizationContext', itemId)
            if (!context) return false
            const { organization: organizationId, integration: integrationId } = context
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
            contextId = get(originalInput, ['context', 'connect', 'id'])
        } else if (operation === 'update' || operation === 'delete') {
            // NOTE: can update only by the integration account
            if (!itemId) return false
            const log = await getById('BillingIntegrationLog', itemId)
            if (!log) return false
            contextId = log.context
        } else {
            return false
        }
        if (!contextId) return false
        const context = await getById('BillingIntegrationOrganizationContext', contextId)
        if (!context) return false
        const { integration: integrationId } = context
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
