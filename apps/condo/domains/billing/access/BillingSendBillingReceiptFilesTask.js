/**
 * Access rules for BillingSendBillingReceiptFilesTask
 */

const isEmpty = require('lodash/isEmpty')

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { getById } = require('@open-condo/keystone/schema')

const { CANCELLED } = require('@condo/domains/common/constants/export')
const { getEmployedOrRelatedOrganizationsByPermissions } = require('@condo/domains/organization/utils/accessSchema')


async function canReadBillingSendBillingReceiptFilesTasks ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (user.isAdmin) return {}

    return { user: { id: user.id } }
}

async function canManageBillingSendBillingReceiptFilesTasks ({ authentication: { item: user }, context, originalInput, operation, itemId }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin) return true

    if (operation === 'create') {
        if (originalInput?.user?.connect?.id) return false

        const permittedOrganizations = await getEmployedOrRelatedOrganizationsByPermissions(context, user, 'canReadBillingReceipts')
        return !isEmpty(permittedOrganizations)
    } else if (operation === 'update') {
        if (!itemId) return false

        const task = await getById('BillingSendBillingReceiptFilesTask', itemId)
        if (!task || task.deletedAt) return false

        if (task.user === user.id && originalInput?.status === CANCELLED) {
            return true
        }
    }

    return false
}

module.exports = {
    canReadBillingSendBillingReceiptFilesTasks,
    canManageBillingSendBillingReceiptFilesTasks,
}
