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
    const meterResourceOwner = await find('MeterResourceOwner', {
        organization: { id: organization.id },
        addressKey,
        deletedAt: null,
    })
    const billingContext = await getOrganizationBillingContext(organization)

    return {
        id: organization.id,
        name: organization.name,
        tin: organization.tin,
        type: organization.type,
        receipts: get(billingContext, 'lastReport.categories', []).map(category => ({ category })),
        meters: meterResourceOwner.map(({ resource }) => ({ resource })),
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
    const billingContext = await getOrganizationBillingContext(organization)
    let receipts = await getOrganizationReceipts(billingContext, addressKey, { unitName, unitType })

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
    const billingContext = await getOrganizationBillingContext(organization)
    let receipts = []

    if (billingContext) {
        receipts = await getOrganizationReceipts(billingContext, addressKey, { number: accountNumber })

        if (!receipts.length) {
            const [billingIntegration] = await find('BillingIntegration', {
                id: billingContext.integration,
                checkAccountNumberUrl_not: null,
                deletedAt: null,
            })
            const checkAccountNumberUrl = get(billingIntegration, 'checkAccountNumberUrl')

            if (checkAccountNumberUrl) {
                const { status, services } = await getAccountsWithOnlineInteractionUrl(checkAccountNumberUrl, tin, accountNumber)
                if (status === ONLINE_INTERACTION_CHECK_ACCOUNT_SUCCESS_STATUS) {
                    receipts = services.map(service => ({
                        category: service.category,
                        accountNumber: service.account.number,
                        routingNumber: service.bankAccount.routingNumber,
                        bankAccount: service.bankAccount.number,
                        balance: service.receipt.sum,
                        address: service.receipt.address,
                    }))
                }
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

async function getOrganizationReceipts (billingContext, addressKey, query = {}) {
    if (!billingContext) return []
    const billingAccounts = await find('BillingAccount', {
        context: { id: billingContext.id },
        property: { addressKey, deletedAt: null },
        deletedAt: null,
        ...query,
    })
    let receipts = []

    if (billingAccounts.length && get(billingContext, 'lastReport.period')) {
        receipts = await find('BillingReceipt', {
            context: { id: billingContext.id },
            property: { addressKey, deletedAt: null },
            deletedAt: null,
            period: billingContext.lastReport.period,
            account: { id_in: billingAccounts.map(({ id }) => id) },
        })

        const billingAccountsNumbersIndex = Object.fromEntries(
            billingAccounts.map(account => [account.id, account.number])
        )
        receipts = receipts.map(receipt => ({
            category: receipt.category,
            balance: receipt.toPay,
            accountNumber: billingAccountsNumbersIndex[receipt.account],
            routingNumber: receipt.recipient.bic,
            bankAccount: receipt.recipient.bankAccount,
            address: get(receipt, 'raw.address', null),
        }))
    }

    return receipts
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

async function getOrganizationBillingContext (organization) {
    const [context] = await find('BillingIntegrationOrganizationContext', {
        status: BILLING_CONTEXT_FINISHED_STATUS,
        deletedAt: null,
        organization: { id: organization.id },
    })

    return context
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