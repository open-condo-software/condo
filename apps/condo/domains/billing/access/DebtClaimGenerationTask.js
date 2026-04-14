const { get } = require('lodash')

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { getById } = require('@open-condo/keystone/schema')

const { STAFF } = require('@condo/domains/user/constants/common')


async function canReadDebtClaimGenerationTasks ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin) return {}
    if (user.type !== STAFF) return false

    return { user: { id: user.id } }
}

async function canManageDebtClaimGenerationTasks ({ authentication: { item: user }, originalInput, operation, itemId }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin) return true
    if (user.type !== STAFF) return false

    if (operation === 'create') {
        if (get(originalInput, 'user.connect.id') !== user.id) return false

        const organizationId = get(originalInput, 'organization.connect.id')
        if (!organizationId) return false

        const organization = await getById('Organization', organizationId)
        if (!organization || organization.deletedAt) return false

        const employees = await require('@open-condo/keystone/schema').find('OrganizationEmployee', {
            organization: { id: organizationId, deletedAt: null },
            user: { id: user.id, deletedAt: null },
            isBlocked: false,
            deletedAt: null,
        })

        const employee = employees[0]
        if (!employee) return false

        const role = await getById('OrganizationEmployeeRole', employee.role)
        if (!role || role.deletedAt) return false

        return role.canImportBillingReceipts === true || role.canManageIntegrations === true
    }

    if (operation === 'update') {
        const item = await getById('DebtClaimGenerationTask', itemId)
        if (!item || item.deletedAt) return false
        return get(item, 'user') === user.id
    }

    return false
}

module.exports = {
    canReadDebtClaimGenerationTasks,
    canManageDebtClaimGenerationTasks,
}
