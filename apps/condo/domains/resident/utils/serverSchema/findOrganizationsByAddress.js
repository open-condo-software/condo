const get = require('lodash/get')

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

async function findOrganizationByAddressKey (organization) {
    const meterResourceOwner = await find('MeterResourceOwner', {
        organization: { id: organization.id },
        deletedAt: null,
    })
    const billingContext = await getOrganizationBillingContext(organization)

    return {
        id: organization.id,
        name: organization.name,
        tin: organization.tin,
        type: organization.type,
        receipts: get(billingContext, 'lastReport.categories')
            ? get(billingContext, 'lastReport.categories').map(category => ({ category }))
            : null,
        meters: meterResourceOwner.length
            ? meterResourceOwner.map(({ resource }) => ({ resource }))
            : null,
    }
}

async function findOrganizationByAddressKeyUnitNameUnitType (organization, context, { addressKey, unitName, unitType }) {
    const isInBlackList = await featureToggleManager.isFeatureEnabled(
        context,
        DISABLE_DISCOVER_SERVICE_CONSUMERS,
        { organization: organization.id }
    )
    
    if (isInBlackList) {
        return findOrganizationByAddressKey(organization)
    }

    const billingContext = await getOrganizationBillingContext(organization)
    let receipts = await getOrganizationReceipts(billingContext, { unitName, unitType })

    if (receipts.length) {
        receipts = Object.values(
            receipts.reduce((acc, receipt) => {
                acc[receipt.category] = acc[receipt.category] ? { category: receipt.category } : receipt
                return acc
            }, {})
        )
    } else {
        receipts = null
    }

    const meters = await getOrganizationMeters(organization, addressKey, { unitName, unitType })

    return {
        id: organization.id,
        name: organization.name,
        tin: organization.tin,
        type: organization.type,
        receipts,
        meters,
    }
}

async function findOrganizationByAddressKeyTinAccountNumber (organization, { addressKey, tin, accountNumber }) {
    const billingContext = await getOrganizationBillingContext(organization)
    const [billingIntegration] = await find('BillingIntegration', {
        id: get(billingContext, 'integration'),
        checkAccountNumberUrl_not: null,
    })
    const checkAccountNumberUrl = get(billingIntegration, 'checkAccountNumberUrl')

    let receipts = await getOrganizationReceipts(billingContext, { number: accountNumber })
    
    if (!receipts.length && checkAccountNumberUrl) {
        const { status, services } = await getAccountsWithOnlineInteractionUrl(checkAccountNumberUrl, tin, accountNumber)
        if (status === ONLINE_INTERACTION_CHECK_ACCOUNT_SUCCESS_STATUS) {
            receipts = services.map(service => ({
                category: service.category,
                number: service.account.number,
                routingNumber: service.bankAccount.routingNumber,
                bankAccount: service.bankAccount.number,
            }))
        }
    }

    if (!receipts.length) receipts = null

    const meters = await getOrganizationMeters(organization, addressKey, { accountNumber })

    return {
        id: organization.id,
        name: organization.name,
        tin: organization.tin,
        type: organization.type,
        receipts,
        meters,
    }
}

async function getOrganizationReceipts (billingContext, query = {}) {
    if (!billingContext) return []
    const billingAccounts = await find('BillingAccount', {
        context: { id: billingContext.id },
        deletedAt: null,
        ...query,
    })
    let receipts = []

    if (billingAccounts.length && get(billingContext, 'lastReport.period')) {
        receipts = await find('BillingReceipt', {
            context: { id: billingContext.id },
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
            number: billingAccountsNumbersIndex[receipt.account],
            routingNumber: receipt.recipient.bic,
            bankAccount: receipt.recipient.bankAccount,
        }))
    }

    return receipts
}

async function getOrganizationMeters (organization, addressKey, query = {}) {
    let meters = await find('Meter', {
        organization: { id: organization.id },
        deletedAt: null,
        property: { addressKey, deletedAt: null },
        ...query,
    })

    if (meters.length){
        const meterReadings = await find('MeterReading', {
            meter: { id_in: meters.map(({ id }) => id) },
            deletedAt: null,
        })
        const meterReadingIndex = meterReadings.reduce((acc, { meter, value1, value2, value3, value4 }) => {
            acc[meter] = [value1, value2, value3, value4].filter(Boolean).join(',')
            return acc
        }, {})
        meters = meters.map((meter) => ({
            resource: meter.resource,
            account: meter.accountNumber,
            number: meter.number,
            value: meterReadingIndex[meter.id] || null,
        }))
    } else {
        meters = null
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

async function getOrganizationIdsWithMeters (organizations) {
    const meterResourceOwners = await find('MeterResourceOwner', {
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