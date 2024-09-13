
const Big = require('big.js')
const { get } = require('lodash')

const { find } = require('@open-condo/keystone/schema')

const {
    CONTEXT_FINISHED_STATUS: ACQUIRING_CONTEXT_FINISHED_STATUS,
} = require('@condo/domains/acquiring/constants/context')
const {
    ONLINE_INTERACTION_CHECK_ACCOUNT_SUCCESS_STATUS,
} = require('@condo/domains/billing/constants/onlineInteraction')
const { getAccountsWithOnlineInteractionUrl } = require('@condo/domains/billing/utils/serverSchema/checkAccountNumberWithOnlineInteractionUrl')
const { CONTEXT_FINISHED_STATUS: BILLING_CONTEXT_FINISHED_STATUS } = require('@condo/domains/miniapp/constants')

async function findMetersForOrganizations (organizations, addressKey, meterQuery = {}) {
    const meters = await find('Meter', {
        organization: { id_in: organizations.map(({ id }) => id) },
        deletedAt: null,
        property: { addressKey, deletedAt: null },
        ...meterQuery,
    })

    const organizationIndex = Object.fromEntries(organizations.map(organization => [organization.id, organization]))

    return meters.map(({ organization, resource, accountNumber }) => {
        const organizationFromIndex = organizationIndex[organization]
        const meter = { resource }

        if (organizationFromIndex?.canRevealPersonalAccount) {
            meter.number = accountNumber
        }

        return { organizationId: organization, meter }
    })
}


async function findBillingReceiptsForOrganizations (organizations, billingInformation, receiptQuery = {}) {
    const receipts = await Promise.all(organizations.map(async ({ id, tin, canRevealPersonalAccount }) => {
        const billingInfo = billingInformation[id]

        if (!billingInfo){
            return []
        }

        const { id: contextId, period, checkAccountNumberUrl } = billingInfo

        if (!contextId) {
            return []
        }

        let receipts = []

        if (period){
            const billingAccounts = await find('BillingAccount', {
                context: { id: contextId },
                deletedAt: null,
                ...receiptQuery,
            })

            if (billingAccounts.length) {
                const billingAccountsNumbersIndex = Object.fromEntries(billingAccounts.map(account => [account.id, account.number]))

                const billingReceipts = await find('BillingReceipt', {
                    context: { id: contextId },
                    deletedAt: null,
                    period,
                    account: { id_in: Object.keys(billingAccountsNumbersIndex) },
                })

                if (billingReceipts.length) {
                    receipts = billingReceipts.map(receipt => ({
                        category: receipt.category,
                        ...(canRevealPersonalAccount && {
                            organizationId: id,
                            number: billingAccountsNumbersIndex[receipt.account],
                            balance: Big(receipt.toPay).toFixed(2),
                            routingNumber: get(receipt, 'recipient.bic'),
                            bankAccountNumber: get(receipt, 'recipient.bankAccount'),
                        }),
                    }))
                }
            }
        }

        if (!receipts.length && checkAccountNumberUrl && receiptQuery.number) {
            const { status, services } = await getAccountsWithOnlineInteractionUrl(checkAccountNumberUrl, tin, receiptQuery.number)
            if (status === ONLINE_INTERACTION_CHECK_ACCOUNT_SUCCESS_STATUS) {
                receipts = services.map(service => ({
                    category: service.category,
                    ...(canRevealPersonalAccount && {
                        organizationId: id,
                        number: service.account.number,
                        routingNumber: service.bankAccount.routingNumber,
                        bankAccountNumber: service.bankAccount.number,
                    }),
                }))
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

async function getOrganizationsWithMeters (organizationIds) {
    const meterResourceOwners = await find('MeterResourceOwner', {
        organization: { id_in: organizationIds },
        deletedAt: null,
    })

    return new Set(meterResourceOwners.map(owner => owner.organization))
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
    findMetersForOrganizations,
}