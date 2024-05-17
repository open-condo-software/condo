const { get } = require('lodash')

const { fetch } = require('@open-condo/keystone/fetch')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { AcquiringIntegrationContext } = require('@condo/domains/acquiring/utils/serverSchema')
const { BillingIntegrationOrganizationContext, BillingAccount } = require('@condo/domains/billing/utils/serverSchema')

const ONLINE_INTERACTION_CHECK_ACCOUNT_SUCCESS_STATUS = 'FOUND'
const ONLINE_INTERACTION_CHECK_ACCOUNT_ERROR_STATUS = 'ERROR'
const ONLINE_INTERACTION_CHECK_ACCOUNT_NOT_FOUND_STATUS = 'NOT_FOUND'

const appLogger = getLogger('condo')
const logger = appLogger.child({ module: 'condo-billing-online-interaction' })

const checkAccountNumberWithOnlineInteractionUrl = async (interactionUrl, tin, accountNumber) => {
    const url = new URL(interactionUrl)
    url.searchParams.append('tin', tin)
    url.searchParams.append('accountNumber', accountNumber)
    try {
        const response = await fetch(url.toString(), {
            maxRetries: 5,
            timeoutBetweenRequests: 200,
        })
        if (response.ok) {
            const { status } = await response.json()
            if (status === ONLINE_INTERACTION_CHECK_ACCOUNT_SUCCESS_STATUS) {
                return true
            }
        }
    } catch (error) {
        logger.error({ err: error, payload: { url: url.origin, tin, accountNumber } })
    }
    return false
}

const checkBillingAccountNumberForOrganization = async (organizationId, accountNumber) => {
    const { keystone } = getSchemaCtx('BillingIntegrationOrganizationContext')

    const [billingContext] = await BillingIntegrationOrganizationContext.getAll(keystone, {
        organization: { id: organizationId }, deletedAt: null, status: CONTEXT_FINISHED_STATUS,
    })
    const [acquiringContext] = await AcquiringIntegrationContext.getAll(keystone, {
        organization: { id: organizationId }, deletedAt: null, status: CONTEXT_FINISHED_STATUS,
    })
    const result = {
        isBillingAccountFound: false,
        contexts: {
            billing: billingContext || null,
            acquiring: acquiringContext || null,
        },
    }
    if (!acquiringContext || !billingContext) {
        return result
    }
    const [billingAccount] = await BillingAccount.getAll(keystone, {
        number_i: accountNumber,
        context: { id: billingContext.id },
        deletedAt: null,
    })
    if (billingAccount) {
        return { ...result, isBillingAccountFound: true }
    }
    const interactionUrl = get(billingContext, 'integration.checkAccountNumberUrl')
    if (!interactionUrl) {
        return result
    }
    const tin = get(billingContext, 'organization.tin')
    result.isBillingAccountFound = await checkAccountNumberWithOnlineInteractionUrl(interactionUrl, tin, accountNumber)
    return result
}

module.exports = {
    checkBillingAccountNumberForOrganization,
    checkAccountNumberWithOnlineInteractionUrl,
    ONLINE_INTERACTION_CHECK_ACCOUNT_SUCCESS_STATUS,
    ONLINE_INTERACTION_CHECK_ACCOUNT_ERROR_STATUS,
    ONLINE_INTERACTION_CHECK_ACCOUNT_NOT_FOUND_STATUS,
}