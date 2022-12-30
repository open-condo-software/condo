const { dvSenderFields } = require('@condo/domains/organization/integrations/sbbol/constants')
const { BankIntegrationContext, BankIntegration } = require('@condo/domains/banking/utils/serverSchema')
const { BANK_INTEGRATION_IDS } = require('@condo/domains/banking/constants')
const isEmpty = require('lodash/isEmpty')
const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger('sbbol/checkSbbolBankIntegrationContext')

/**
 *  Checks for the existence of a BankIntegrationContext. Returns an existing one or creates a new one
 *
 * @param {keystoneContext} context
 * @param {String} organizationId
 * @returns {Promise<BankIntegrationContext>}
 */
async function checkSbbolBankIntegrationContext (context, organizationId) {
    if (!context) throw new Error('context is required')
    if (!organizationId) throw new Error('organizationId is required')

    const integration = await BankIntegration.getOne(context, { id: BANK_INTEGRATION_IDS.SBBOL })
    const where = {
        ...dvSenderFields,
        integration: { connect: { id: integration.id } },
        organization: { connect: { id: organizationId } },
    }
    const foundIntegrationContext = await BankIntegrationContext.getAll(context, where, { first: 1 })

    if (!isEmpty(foundIntegrationContext)) {
        logger.info(`BankIntegrationContext with type SBBOL already exists in organization with id: ${organizationId}`)

        return foundIntegrationContext
    } else {
        const createdBankIntegrationContext = await BankIntegrationContext.create(context, where)

        logger.info(`BankIntegrationContext created with id: ${createdBankIntegrationContext.id}`)

        return createdBankIntegrationContext
    }
}

module.exports = {
    checkSbbolBankIntegrationContext,
}