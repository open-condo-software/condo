
const Big = require('big.js')
const { get } = require('lodash')

const { find, itemsQuery } = require('@open-condo/keystone/schema')

const {
    CONTEXT_FINISHED_STATUS: ACQUIRING_CONTEXT_FINISHED_STATUS,
} = require('@condo/domains/acquiring/constants/context')
const {
    ONLINE_INTERACTION_CHECK_ACCOUNT_SUCCESS_STATUS,
} = require('@condo/domains/billing/constants/onlineInteraction')
const { getAccountsWithOnlineInteractionUrl } = require('@condo/domains/billing/utils/serverSchema/checkAccountNumberWithOnlineInteractionUrl')
const { CONTEXT_FINISHED_STATUS: BILLING_CONTEXT_FINISHED_STATUS } = require('@condo/domains/miniapp/constants')

async function findBillingReceiptsForOrganizations (organizations, billingInformation, accountQuery = {}) {
    const receipts = await Promise.all(organizations.map(async ({ id, tin }) => {
        const contextId = get(billingInformation[id], 'id')
        if (!contextId) {
            return []
        }
        const period = get(billingInformation[id], 'period')
        const checkAccountNumberUrl = get(billingInformation[id], 'checkAccountNumberUrl')
        let receipts = []
        if (period) {
            const billingAccounts = await find('BillingAccount', { context: { id: contextId }, deletedAt: null, ...accountQuery })
            console.error({ context: { id: contextId }, deletedAt: null, ...accountQuery })
            console.error(billingAccounts)
            if (billingAccounts.length) {
                const billingAccountsNumbersIndex = Object.fromEntries(billingAccounts.map(account => ([account.id, account.number])))
                const billingReceipts = await find('BillingReceipt', {
                    context: { id: contextId },
                    deletedAt: null,
                    period,
                    account: { id_in: Object.keys(billingAccountsNumbersIndex) },
                })
                if (billingReceipts.length) {
                    receipts = billingReceipts.map(receipt => ({
                        organizationId: id,
                        number: billingAccountsNumbersIndex[receipt.account],
                        category: receipt.category,
                        balance: Big(receipt.toPay).toFixed(2),
                        routingNumber: get(receipt, 'recipient.bic'),
                        bankAccountNumber: get(receipt, 'recipient.bankAccount'),
                    }))
                }
            }
        }
        const accountNumber = accountQuery.number
        if (!receipts.length && checkAccountNumberUrl && accountNumber) {
            const { status, services } = await getAccountsWithOnlineInteractionUrl(checkAccountNumberUrl, tin, accountNumber)
            if (status === ONLINE_INTERACTION_CHECK_ACCOUNT_SUCCESS_STATUS) {
                receipts = services.map(service => {
                    const { category, account: { number }, bankAccount: { number: bankAccountNumber, routingNumber } } = service
                    return {
                        organizationId: id,
                        category,
                        number,
                        routingNumber,
                        bankAccountNumber,
                    }
                })
            }
        }
        return receipts
    }))
    return receipts.flat()
}

async function getBillingInformationForOrganizations (organizations) {
    const billingContexts = await find('BillingIntegrationOrganizationContext', {
        status: BILLING_CONTEXT_FINISHED_STATUS,
        deletedAt: null,
        organization: { id_in: organizations.map(({ id }) => id) },
    })
    const billingContextIndex = Object.fromEntries(billingContexts.map(context => ([context.organization, context])))
    const billingIntegrationsWithRemoteInteraction = await find('BillingIntegration', {
        id_in: billingContexts.map(({ integration }) => integration),
        checkAccountNumberUrl_not: null,
    })
    const remoteInteractions = Object.fromEntries(billingIntegrationsWithRemoteInteraction
        .map(({ id, checkAccountNumberUrl }) => ([ id, checkAccountNumberUrl])))

    return Object.fromEntries(organizations.map(organization => {
        const context = billingContextIndex[organization.id]
        if (!context) {
            return [organization.id, null]
        }
        return [organization.id, {
            id: context.id,
            period: get(context, 'lastReport.period'),
            checkAccountNumberUrl: remoteInteractions[context.integration],
        }]
    }))
}

async function getOrganizationsWithMeters (organizationIds, query = {}) {
    const organizationsWithMeters = await Promise.all(organizationIds.map(async id => {
        const [meter] = await itemsQuery('Meter', {
            where: { organization: { id }, deletedAt: null, ...query },
            first: 1,
        })
        return meter ? id : null
    }))
    return new Set(organizationsWithMeters.filter(Boolean))
}

async function getOrganizationsWithAcquiring (organizationIds) {
    const acquiringContexts = await find('AcquiringIntegrationContext', {
        status: ACQUIRING_CONTEXT_FINISHED_STATUS,
        deletedAt: null,
        organization: { id_in: organizationIds },
    })
    return new Set(acquiringContexts.map(({ organization }) => organization))
}

module.exports = {
    getOrganizationsWithMeters,
    getOrganizationsWithAcquiring,
    getBillingInformationForOrganizations,
    findBillingReceiptsForOrganizations,
}