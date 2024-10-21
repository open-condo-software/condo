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

async function findOrganizationsByAddressKey (organizations, billingContextIndex, { addressKey }) {
    const groupedReceipts = organizations.reduce((acc, { id }) => {
        const lastReport = billingContextIndex[id]

        if (lastReport?.categories)
            acc[id] = lastReport.categories.map(category => ({ category }))

        return acc
    }, {})

    const groupedMeters = await getOrganizationGroupedMeters(organizations, addressKey)

    return organizations.map(organization => ({
        id: organization.id,
        name: organization.name,
        tin: organization.tin,
        type: organization.type,
        receipts: groupedReceipts?.[organization.id],
        meters: groupedMeters?.[organization.id],
    }))
}

async function findOrganizationsByAddressKeyUnitNameUnitType (organizations, billingContextIndex, context, { addressKey, unitName, unitType }) {
    const blackList = await Promise.all(
        organizations.map(organization =>
            featureToggleManager.isFeatureEnabled(
                context,
                DISABLE_DISCOVER_SERVICE_CONSUMERS,
                { organization: organization.id }
            )
        )
    )

    const blackListIndex = organizations.reduce((acc, org, i) => {
        acc[org.id] = blackList[i]
        return acc
    }, {})

    const receipts = await Promise.all(organizations.map(async organization => {
        const billingContext = billingContextIndex[organization.id]
        if (!billingContext) return null

        const billingAccounts = await find('BillingAccount', {
            context: { id: billingContext.id },
            deletedAt: null,
            unitName,
            unitType,
        })

        if (!billingAccounts.length || !billingContext.lastReport?.period) return null

        const billingAccountsNumbersIndex = Object.fromEntries(
            billingAccounts.map(account => [account.id, account.number])
        )

        const receipts = await find('BillingReceipt', {
            context: { id: billingContext.id },
            deletedAt: null,
            period: billingContext.lastReport.period,
            account: { id_in: billingAccounts.map(({ id }) => id) },
        })

        return {
            [organization.id]: receipts.map(({ category, toPay, recipient, account }) => ({
                category,
                balance: toPay,
                number: billingAccountsNumbersIndex[account],
                routingNumber: recipient?.bic,
                bankAccount: recipient?.bankAccount,
            })),
        }
    }))

    const groupedReceipts = receipts
        .filter(Boolean)
        .reduce((acc, receipt) => {
            const [[organizationId, orgReceipts]] = Object.entries(receipt)
            acc[organizationId] = orgReceipts
            return acc
        }, {})

    const groupedMeters = await getOrganizationGroupedMeters(organizations, addressKey, { unitName, unitType })

    return organizations.map(organization => {
        let receipts = groupedReceipts[organization.id]
        let meters = groupedMeters[organization.id]

        if (receipts?.length) {
            const cleanedReceipts = {}

            for (const receipt of receipts) {
                if (!cleanedReceipts[receipt.category]){
                    cleanedReceipts[receipt.category] = receipt
                } else {
                    cleanedReceipts[receipt.category] = { category: receipt.category }
                }
            }

            receipts = Object.values(cleanedReceipts)
        }

        if (blackListIndex[organization.id]){
            if (receipts?.length){
                receipts = receipts.map(({ category }) => ({ category }))
            }
            if (meters?.length){
                meters = meters.map(({ resource }) => ({ resource }))
            }
        }

        return {
            id: organization.id,
            name: organization.name,
            tin: organization.tin,
            type: organization.type,
            receipts: receipts,
            meters: meters,
        }
    })
}

async function findOrganizationsByAddressKeyTinAccountNumber (organizations, billingContextIndex, { addressKey, tin, accountNumber }) {
    const billingIntegrationsWithRemoteInteraction = await find('BillingIntegration', {
        id_in: Object.values(billingContextIndex).map(({ integration }) => integration),
        checkAccountNumberUrl_not: null,
    })

    const remoteInteractions = Object.fromEntries(
        billingIntegrationsWithRemoteInteraction.map(({ id, checkAccountNumberUrl }) => ([id, checkAccountNumberUrl]))
    )

    const receipts = await Promise.all(organizations.map(async organization => {
        const context = billingContextIndex[organization.id]
        if (!context) return null

        const billingAccounts = await find('BillingAccount', {
            context: { id: context.id },
            deletedAt: null,
            number: accountNumber,
        })

        let receipts = []
        if (billingAccounts.length && context.lastReport?.period) {
            receipts = await find('BillingReceipt', {
                context: { id: context.id },
                deletedAt: null,
                period: context.lastReport.period,
                account: { id_in: billingAccounts.map(({ id }) => id) },
            })
        }

        const checkAccountNumberUrl = remoteInteractions[context.integration]

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

        if (!receipts.length) return null

        return {
            [organization.id]: receipts.map(({ category, toPay, recipient }) => ({
                category,
                balance: toPay,
                number: accountNumber,
                routingNumber: recipient?.bic,
                bankAccount: recipient?.bankAccount,
            })),
        }
    }))

    const groupedReceipts = receipts
        .filter(Boolean)
        .reduce((acc, receipt) => {
            const [[organizationId, orgReceipts]] = Object.entries(receipt)
            acc[organizationId] = orgReceipts
            return acc
        }, {})

    const groupedMeters = await getOrganizationGroupedMeters(organizations, addressKey, { accountNumber })

    return organizations
        .map(organization => ({
            id: organization.id,
            name: organization.name,
            tin: organization.tin,
            type: organization.type,
            receipts: groupedReceipts[organization.id],
            meters: groupedMeters[organization.id],
        }))
        .filter(organization => organization.receipts || organization.meters)
}

async function getOrganizationGroupedMeters (organizations, addressKey, query = {}) {
    const meters = await find('Meter', {
        organization: { id_in: organizations.map(({ id }) => id) },
        deletedAt: null,
        property: { addressKey, deletedAt: null },
        ...query,
    })
    if (!meters.length) return {}

    const meterReadings = await find('MeterReading', {
        meter: { id_in: meters.map(({ id }) => id) },
        deletedAt: null,
    })
    const meterReadingIndex = meterReadings.reduce((acc, { meter, value1, value2, value3, value4 }) => {
        acc[meter] = [value1, value2, value3, value4].filter(Boolean).join(',')
        return acc
    }, {})

    return meters.reduce((acc, { organization, resource, accountNumber, number, id }) => {
        const formedMeter = {
            resource,
            account: accountNumber,
            number,
            value: meterReadingIndex[id] || null,
        }

        acc[organization] = acc[organization] || []
        acc[organization].push(formedMeter)

        return acc
    }, {})
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
    findOrganizationsByAddressKeyTinAccountNumber,
    findOrganizationsByAddressKeyUnitNameUnitType,
    findOrganizationsByAddressKey,
}