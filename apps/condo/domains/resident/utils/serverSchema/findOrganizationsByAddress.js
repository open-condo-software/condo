const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { find } = require('@open-condo/keystone/schema')

const {
    CONTEXT_FINISHED_STATUS: ACQUIRING_CONTEXT_FINISHED_STATUS,
} = require('@condo/domains/acquiring/constants/context')
const {
    ONLINE_INTERACTION_CHECK_ACCOUNT_SUCCESS_STATUS,
} = require('@condo/domains/billing/constants/onlineInteraction')
const { getAccountsWithOnlineInteractionUrl } = require('@condo/domains/billing/utils/serverSchema/checkAccountNumberWithOnlineInteractionUrl')
const { CONTEXT_FINISHED_STATUS: BILLING_CONTEXT_FINISHED_STATUS } = require('@condo/domains/miniapp/constants')

const { DISABLE_DISCOVER_SERVICE_CONSUMERS } = require('../../../common/constants/featureflags')

async function findOrganizationsByAddressKey ({ addressKey }) {
    const properties = await find('Property', { addressKey, deletedAt: null })

    if (!properties.length) {
        return []
    }

    let organizations = await find('Organization', {
        id_in: [...new Set(properties.map(({ organization }) => organization))],
        deletedAt: null,
    })

    if (!organizations.length) {
        return []
    }

    const [withAcquiring, withMeters] = await Promise.all([
        getOrganizationIdsWithAcquiring(organizations),
        getOrganizationIdsWithMeters(organizations),
    ])

    organizations = organizations.filter(({ id }) => withAcquiring.has(id) || withMeters.has(id))

    const billingContexts = await find('BillingIntegrationOrganizationContext', {
        status: BILLING_CONTEXT_FINISHED_STATUS,
        deletedAt: null,
        organization: { id_in: organizations.map(({ id }) => id) },
    })

    if (!billingContexts.length){
        return []
    }

    const billingContextIndex = billingContexts.reduce((acc, billingContext) => {
        acc[billingContext.organization] = billingContext

        return acc
    }, {})

    organizations = organizations.filter(({ id }) => billingContextIndex[id])
    //TODO: check this after lastReportBuilder deploy
    const groupedReceipts = billingContexts.reduce((acc, { organization, lastReport }) => {
        if (lastReport?.categories)
            acc[organization] = lastReport.categories.map(category => ({ category }))

        return acc
    }, {})

    let meters = await find('Meter', {
        organization: { id_in: organizations.map(({ id }) => id) },
        deletedAt: null,
        property: { addressKey, deletedAt: null },
    })

    const groupedMeters = meters.reduce((acc, meter) => {
        const formedMeter = {
            resource: meter.resource,
        }
        if (acc[meter.organization]) {
            acc[meter.organization].push(formedMeter)
        } else {
            acc[meter.organization] = [formedMeter]
        }

        return acc
    }, {})

    return organizations.map(organization => ({
        id: organization.id,
        name: organization.name,
        tin: organization.tin,
        type: organization.type,
        receipts: groupedReceipts?.[organization.id],
        meters: groupedMeters?.[organization.id],
    }))
}

async function findOrganizationsByAddressKeyUnitNameUnitType (context, { addressKey, unitName, unitType }) {
    const properties = await find('Property', { addressKey, deletedAt: null })

    if (!properties.length) {
        return []
    }

    let organizations = await find('Organization', {
        id_in: [...new Set(properties.map(({ organization }) => organization))],
        deletedAt: null,
    })

    if (!organizations.length) {
        return []
    }

    const [withAcquiring, withMeters] = await Promise.all([
        getOrganizationIdsWithAcquiring(organizations),
        getOrganizationIdsWithMeters(organizations),
    ])

    organizations = organizations.filter(({ id }) => withAcquiring.has(id) || withMeters.has(id))

    const billingContexts = await find('BillingIntegrationOrganizationContext', {
        status: BILLING_CONTEXT_FINISHED_STATUS,
        deletedAt: null,
        organization: { id_in: organizations.map(({ id }) => id) },
    })

    if (!billingContexts.length) {
        return []
    }

    const billingContextIndex = billingContexts.reduce((acc, billingContext) => {
        acc[billingContext.organization] = billingContext

        return acc
    }, {})
    const blackList = await Promise.all(
        organizations.map(organization => {
            return featureToggleManager.isFeatureEnabled(
                context,
                DISABLE_DISCOVER_SERVICE_CONSUMERS,
                { organization: organization.id }
            )
        })
    )

    const blackListIndex = {}

    for (let i = 0; i < organizations.length; i++) {
        blackListIndex[organizations[i].id] = blackList[i]
    }

    let receipts = await Promise.all(organizations.map(async organization => {
        const context = billingContextIndex[organization.id]
        const billingAccounts = await find('BillingAccount', {
            context: { id: context.id },
            deletedAt: null,
            unitName,
            unitType,
        })

        if (!billingAccounts.length || !context?.lastReport?.period){
            return null
        }

        const billingAccountsNumbersIndex = Object.fromEntries(billingAccounts.map(account => [account.id, account.number]))
        let receipts = await find('BillingReceipt', {
            context: { id: context.id },
            deletedAt: null,
            period: context.lastReport.period,
            account: { id_in: billingAccounts.map(({ id } ) => id) },
        })
        const formedReceipts = receipts.map(({ category, toPay, recipient, account }) => ({
            category,
            balance: toPay,
            number: billingAccountsNumbersIndex[account],
            routingNumber: recipient?.bic,
            bankAccount: recipient?.bankAccount,
        }))

        return { [organization.id]: formedReceipts }
    }))

    const groupedReceipts = receipts
        .filter(Boolean)
        .reduce((acc, receipt) => {
            const [[key, value]] = Object.entries(receipt)
            acc[key] = value

            return acc
        }, {})

    const meters = await find('Meter', {
        organization: { id_in: organizations.map(({ id }) => id) },
        deletedAt: null,
        property: { addressKey, deletedAt: null },
        unitName,
        unitType,
    })
    const meterReadings = await find('MeterReading', {
        meter: { id_in: meters.map(({ id }) => id) },
    })
    const meterReadingIndex = meterReadings.reduce((acc, { meter, value1, value2, value3, value4 }) => {
        acc[meter] = [value1, value2, value3, value4].filter(Boolean).join(',')

        return acc
    }, {})

    const groupedMeters = meters.reduce((acc, meter) => {
        const formedMeter = {
            resource: meter.resource,
            account: meter.accountNumber,
            number: meter.number,
            value: meterReadingIndex?.[meter.id],
        }
        if (acc[meter.organization]) {
            acc[meter.organization].push(formedMeter)
        } else {
            acc[meter.organization] = [formedMeter]
        }

        return acc
    }, {})
    return organizations.map(organization => {
        let receipts = groupedReceipts[organization.id]
        let meters = groupedMeters[organization.id]

        if (receipts?.length) {
            const cleanedReceipts = {}

            for (let i = 0; i < receipts.length; i++){
                if (!cleanedReceipts[receipts[i].category]){
                    cleanedReceipts[receipts[i].category] = receipts[i]
                } else {
                    cleanedReceipts[receipts[i].category] = { category: receipts[i].category }
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

async function findOrganizationsByAddressKeyTinAccountNumber ({ addressKey, tin, accountNumber }) {
    const properties = await find('Property', { addressKey, deletedAt: null })

    if (!properties.length) {
        return []
    }

    let organizations = await find('Organization', {
        id_in: [...new Set(properties.map(({ organization }) => organization))],
        tin,
        deletedAt: null,
    })

    if (!organizations.length) {
        return []
    }

    const [withAcquiring, withMeters] = await Promise.all([
        getOrganizationIdsWithAcquiring(organizations),
        getOrganizationIdsWithMeters(organizations),
    ])
    organizations = organizations.filter(({ id }) => withAcquiring.has(id) || withMeters.has(id))
    const billingContexts = await find('BillingIntegrationOrganizationContext', {
        status: BILLING_CONTEXT_FINISHED_STATUS,
        deletedAt: null,
        organization: { id_in: organizations.map(({ id }) => id) },
    })

    if (!billingContexts.length){
        return []
    }

    const billingContextIndex = billingContexts.reduce((acc, billingContext) => {
        acc[billingContext.organization] = billingContext

        return acc
    }, {})

    organizations = organizations.filter(({ id }) => billingContextIndex[id])

    const billingIntegrationsWithRemoteInteraction = await find('BillingIntegration', {
        id_in: billingContexts.map(({ integration }) => integration),
        checkAccountNumberUrl_not: null,
    })

    const remoteInteractions = Object.fromEntries(billingIntegrationsWithRemoteInteraction
        .map(({ id, checkAccountNumberUrl }) => ([ id, checkAccountNumberUrl])))

    let receipts = await Promise.all(organizations.map(async organization => {
        const context = billingContextIndex[organization.id]
        const billingAccounts = await find('BillingAccount', {
            context: { id: context.id },
            deletedAt: null,
            number: accountNumber,
        })

        let receipts = []

        if (billingAccounts.length && context?.lastReport?.period){
            receipts = await find('BillingReceipt', {
                context: { id: context.id },
                deletedAt: null,
                period: context.lastReport.period,
                account: { id_in: billingAccounts.map(({ id } ) => id) },
            })
        }

        if (context) {
            const checkAccountNumberUrl = remoteInteractions[context.integration]

            if (!receipts.length && checkAccountNumberUrl) {
                const { status, services } = await getAccountsWithOnlineInteractionUrl(checkAccountNumberUrl, tin, accountNumber)

                if (status === ONLINE_INTERACTION_CHECK_ACCOUNT_SUCCESS_STATUS) {
                    receipts = services.map(service => ({
                        category: service.category,
                        number: service.account.number,
                        routingNumber: service.bankAccount.routingNumber,
                        bankAccountNumber: service.bankAccount.number,
                    }))
                }
            }
        }

        if (receipts.length){
            const formedReceipts = receipts.map(({ category, toPay, recipient }) => ({
                category,
                balance: toPay,
                number: accountNumber,
                routingNumber: recipient?.bic,
                bankAccount: recipient?.bankAccount,
            }))

            return { [organization.id]: formedReceipts }
        } else {
            return null
        }
    }))

    const groupedReceipts = receipts
        .filter(Boolean)
        .reduce((acc, receipt) => {
            const [[key, value]] = Object.entries(receipt)
            acc[key] = value

            return acc
        }, {})

    let meters = await find('Meter', {
        organization: { id_in: organizations.map(({ id }) => id) },
        deletedAt: null,
        property: { addressKey, deletedAt: null },
        accountNumber,
    })
    const meterReadings = await find('MeterReading', {
        meter: { id_in: meters.map(({ id }) => id) },
    })
    const meterReadingIndex = meterReadings.reduce((acc, { meter, value1, value2, value3, value4 }) => {
        acc[meter] = [value1, value2, value3, value4].filter(Boolean).join(',')

        return acc
    }, {})
    const groupedMeters = meters.reduce((acc, meter) => {
        const formedMeter = {
            resource: meter.resource,
            account: meter.accountNumber,
            number: meter.number,
            value: meterReadingIndex?.[meter.id],
        }
        if (acc[meter.organization]) {
            acc[meter.organization].push(formedMeter)
        } else {
            acc[meter.organization] = [formedMeter]
        }

        return acc
    }, {})

    return organizations.map(organization => ({
        id: organization.id,
        name: organization.name,
        tin: organization.tin,
        type: organization.type,
        receipts: groupedReceipts[organization.id],
        meters: groupedMeters[organization.id],
    })).filter(organization => organization.receipts || organization.meters)
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
    findOrganizationsByAddressKeyTinAccountNumber,
    findOrganizationsByAddressKeyUnitNameUnitType,
    findOrganizationsByAddressKey,
}