const { get } = require('lodash')

const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { find } = require('@open-condo/keystone/schema')

const {
    CONTEXT_FINISHED_STATUS: ACQUIRING_CONTEXT_FINISHED_STATUS,
} = require('@condo/domains/acquiring/constants/context')
const {
    ONLINE_INTERACTION_CHECK_ACCOUNT_SUCCESS_STATUS,
} = require('@condo/domains/billing/constants/onlineInteraction')
const { getAccountsWithOnlineInteractionUrl } = require('@condo/domains/billing/utils/serverSchema/checkAccountNumberWithOnlineInteractionUrl')
const { DISABLE_DISCOVER_SERVICE_CONSUMERS } = require('@condo/domains/common/constants/featureflags')
const { CONTEXT_FINISHED_STATUS: BILLING_CONTEXT_FINISHED_STATUS } = require('@condo/domains/miniapp/constants')

/*
    TODO: (DOMA-11059) Eliminate unnecessary subqueries like MeterResourceOwner and BillingContext.
    Currently, each organization is processed separately, leading to excessive subqueries.
    All necessary data can be fetched in the previous step before processing, reducing the number of database queries.
    MeterResourceOwner is fetched when checking organizations with meters.
    BillingContext can be unified across all organizations.
*/

async function findOrganizationByAddressKey (organization, { addressKey }) {
    const meterResourceOwners = await find('MeterResourceOwner', {
        organization: { id: organization.id },
        addressKey,
        deletedAt: null,
    })
    const billingContexts = await getOrganizationBillingContexts(organization)

    const receipts = billingContexts.flatMap(billingContext => billingContext?.lastReport?.categories ?? []).map(category => ({ category }))

    return {
        id: organization.id,
        name: organization.name,
        tin: organization.tin,
        type: organization.type,
        receipts,
        meters: meterResourceOwners.map(({ resource }) => ({ resource })),
    }
}

async function findOrganizationByAddressKeyUnitNameUnitType (organization, { addressKey, unitName, unitType }, context, properties) {
    const isInBlackList = await featureToggleManager.isFeatureEnabled(
        context,
        DISABLE_DISCOVER_SERVICE_CONSUMERS,
        { organization: organization.id }
    )
    
    if (isInBlackList) {
        return findOrganizationByAddressKey(organization, { addressKey })
    }
    const billingContexts = await getOrganizationBillingContexts(organization)
    let receipts = await getOrganizationReceipts(billingContexts, addressKey, { unitName, unitType })
    if (receipts.length) {
        receipts = Object.values(
            receipts.reduce((acc, receipt) => {
                acc[receipt.category] = acc[receipt.category] ? { category: receipt.category } : receipt
                return acc
            }, {})
        )
    } else {
        receipts = []
    }

    const meters = await getOrganizationMeters(organization, addressKey, properties, { unitName, unitType })

    return {
        id: organization.id,
        name: organization.name,
        tin: organization.tin,
        type: organization.type,
        receipts,
        meters,
    }
}

async function findOrganizationByAddressKeyTinAccountNumber (organization, { addressKey, tin, accountNumber }, properties) {
    const billingContexts = await getOrganizationBillingContexts(organization)
    let receipts = []

    if (billingContexts.length) {
        receipts = await getOrganizationReceipts(billingContexts, addressKey, { number: accountNumber })

        const billingContextsIdsWithFoundReceipts = new Set(receipts.map(receipt => receipt.contextId))
        const billingContextsWithoutFoundReceipts = billingContexts.filter(billingContext => !billingContextsIdsWithFoundReceipts.has(billingContext.id))
        if (billingContextsWithoutFoundReceipts.length) {
            const billingIntegrations = await find('BillingIntegration', {
                id_in: billingContextsWithoutFoundReceipts.map(billingContext => billingContext.integration),
                checkAccountNumberUrl_not: null,
                deletedAt: null,
            })
            const uniqueCheckAccountNumberUrls = [...new Set(billingIntegrations.map(billingIntegration => billingIntegration.checkAccountNumberUrl).filter(Boolean))]

            if (uniqueCheckAccountNumberUrls.length) {
                const servicesPromises = await Promise.allSettled(uniqueCheckAccountNumberUrls.map(async checkAccountNumberUrl => {
                    const { status, services } = await getAccountsWithOnlineInteractionUrl(checkAccountNumberUrl, tin, accountNumber)
                    if (status === ONLINE_INTERACTION_CHECK_ACCOUNT_SUCCESS_STATUS) {
                        return services
                    }
                    return []
                }))
                const services = servicesPromises
                    .filter(servicesPromise => servicesPromise.status === 'fulfilled')
                    .flatMap(servicesPromise => servicesPromise.value)
                    .filter(Boolean)
                receipts = receipts.concat(services.map(service => ({
                    category: service.category,
                    accountNumber: service.account?.number,
                    routingNumber: service.bankAccount?.routingNumber,
                    bankAccount: service.bankAccount?.number,
                    balance: service.receipt?.sum,
                    address: service.receipt?.address,
                })))
            }
        }
    }

    const meters = await getOrganizationMeters(organization, addressKey, properties, { accountNumber })

    return {
        id: organization.id,
        name: organization.name,
        tin: organization.tin,
        type: organization.type,
        receipts,
        meters,
    }
}

async function getOrganizationReceipts (billingContexts, addressKey, query = {}) {
    const billingContextsWithLastReportPeriod = (billingContexts ?? []).filter(billingContext => billingContext?.lastReport?.period)
    if (!billingContextsWithLastReportPeriod.length) return []

    const billingAccounts = await find('BillingAccount', {
        context: { id_in: billingContexts.map(billingContext => billingContext.id) },
        property: { addressKey, deletedAt: null },
        deletedAt: null,
        ...query,
    })

    if (!billingAccounts.length) return []

    const receipts = await find('BillingReceipt', {
        AND: [
            {
                property: { addressKey, deletedAt: null },
                deletedAt: null,
                account: { id_in: billingAccounts.map(({ id }) => id) },
            },
            {
                OR: billingContextsWithLastReportPeriod.map(billingContext => ({
                    AND: [
                        {
                            context: { id: billingContext.id },
                            period: billingContext.lastReport.period,
                        },
                    ],
                })),
            },
        ],
    })

    const billingAccountsNumbersIndex = Object.fromEntries(
        billingAccounts.map(account => [account.id, account.number])
    )
    return receipts.map(receipt => ({
        category: receipt.category,
        balance: receipt.toPay,
        accountNumber: billingAccountsNumbersIndex[receipt.account],
        routingNumber: receipt.recipient.bic,
        bankAccount: receipt.recipient.bankAccount,
        address: get(receipt, 'raw.address', null),
        contextId: receipt.context,
    }))
}

async function getOrganizationMeters (organization, addressKey, properties, query = {}) {
    const meterResourceOwners = await find('MeterResourceOwner', {
        organization: { id: organization.id },
        addressKey,
        deletedAt: null,
    })

    let meters = await find('Meter', {
        organization: { id: organization.id },
        deletedAt: null,
        resource: { id_in: meterResourceOwners.map(owner => owner.resource) },
        property: { addressKey, deletedAt: null },
        ...query,
    })

    const property = properties.find(p => p.addressKey === addressKey)
    const address = property ? property.address : null

    if (meters.length){
        meters = meters.map((meter) => ({
            resource: meter.resource,
            accountNumber: meter.accountNumber,
            number: meter.number,
            address,
        }))
    } else {
        meters = []
    }

    return meters
}

async function getOrganizationBillingContexts (organization) {
    return await find('BillingIntegrationOrganizationContext', {
        status: BILLING_CONTEXT_FINISHED_STATUS,
        deletedAt: null,
        organization: { id: organization.id },
    })
}

async function getOrganizationIdsWithMeters (organizations, addressKey) {
    const meterResourceOwners = await find('MeterResourceOwner', {
        addressKey,
        organization: { id_in: organizations.map(({ id }) => id) },
        deletedAt: null,
    })

    return new Set(meterResourceOwners.map(owner => owner.organization))
}

async function getOrganizationIdsWithAcquiring (organizations) {
    const acquiringContexts = await find('AcquiringIntegrationContext', {
        status: ACQUIRING_CONTEXT_FINISHED_STATUS,
        deletedAt: null,
        organization: { id_in: organizations.map(({ id }) => id) },
    })

    return new Set(acquiringContexts.map(({ organization }) => organization))
}

module.exports = {
    getOrganizationIdsWithMeters,
    getOrganizationIdsWithAcquiring,
    findOrganizationByAddressKeyTinAccountNumber,
    findOrganizationByAddressKeyUnitNameUnitType,
    findOrganizationByAddressKey,
}