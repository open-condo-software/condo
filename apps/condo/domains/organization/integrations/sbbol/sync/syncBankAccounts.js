const { getLogger } = require('@open-condo/keystone/logging')
const { get, isEmpty } = require('lodash')

const { initSbbolFintechApi } = require('@condo/domains/organization/integrations/sbbol/SbbolFintechApi')
const { dvSenderFields } = require('@condo/domains/organization/integrations/sbbol/constants')
const { BankAccount } = require('@condo/domains/banking/utils/serverSchema')
const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { ISO_CODES_FOR_SBBOL } = require('@condo/domains/common/constants/currencies')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const logger = getLogger('sbbol/syncBankAccounts')

/**
 * Connects new BankAccount records for user according to accounts data from SBBOL.
 *  @param {SbbolAccount} accounts
 *  @param {String} bankIntegrationContextId
 *  @param {Object} organization
 */
const _syncBankAccounts = async (accounts, bankIntegrationContextId, organization) => {
    const { keystone: context } = await getSchemaCtx('User')

    for (const account of accounts) {
        const bankAccountDetails = {
            tin: organization.tin,
            country: RUSSIA_COUNTRY,
            number: account.number,
            currencyCode: (ISO_CODES_FOR_SBBOL[account.currencyCode]),
            routingNumber: account.bic,
        }
        const foundAccount = await BankAccount.getOne(context, {
            ...bankAccountDetails,
            organization: { id_in: organization.id },
        })

        if (!foundAccount) {
            await BankAccount.create(
                context,
                {
                    meta: {
                        sbbol: {
                            type: account.type,
                            state: account.state,
                            openDate: account.openDate,
                            name: account.name,
                            closeDate: account.closeDate,
                        },
                    },
                    ...bankAccountDetails,
                    ...dvSenderFields,
                    organization: { connect: { id: organization.id } },
                }
            )
            logger.info('Created BankAccount', { bankAccount: { id: account.number, organization } })
        }
    }
}
/**
 * Fetches ClientAccounts from SBBOL for specified date and creates BankAccount if this bank account has not yet been created
 *
 *  @param {String} userId
 *  @param {String} bankIntegrationContextId
 *  @param {Object} organization
 * @return {Promise<void>}
 */
const syncBankAccounts = async (userId, bankIntegrationContextId, organization) => {
    if (!userId) throw new Error('userId is required')
    if (!bankIntegrationContextId) throw new Error('bankIntegrationContextId is required')
    if (!organization) throw new Error('organization is required')

    const fintechApi = await initSbbolFintechApi(userId)

    if (!fintechApi) return

    logger.info('Checking, whether the user have ClientAccount items')

    const { data } = await fintechApi.getClientInfo()
    const accounts = get(data, 'accounts', [])

    if (isEmpty(accounts)) {
        logger.info('SBBOL did not return any ClientAccount, do nothing')
    } else {
        await _syncBankAccounts(accounts, bankIntegrationContextId, organization)
    }
}

module.exports = {
    syncBankAccounts,
    _syncBankAccounts,
}