const { getLogger } = require('@open-condo/keystone/logging')
const { get, isEmpty } = require('lodash')

const { initSbbolFintechApi } = require('@condo/domains/organization/integrations/sbbol/SbbolFintechApi')
const { dvSenderFields } = require('@condo/domains/organization/integrations/sbbol/constants')
const { BankAccount } = require('@condo/domains/banking/utils/serverSchema')
const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { ISO_CODES_FOR_SBBOL } = require('@condo/domains/common/constants/currencies')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { Organization } = require('@condo/domains/organization/utils/serverSchema')

const logger = getLogger('sbbol/syncBankAccounts')

/**
 * Connects new BankAccount records for user according to accounts data from SBBOL.
 *  @param {SbbolClientInfo} data
 */
const _syncBankAccounts = async (data) => {
    const { keystone: userContext } = await getSchemaCtx('User')
    const { keystone: bankAccountContext } = await getSchemaCtx('BankAccount')
    const [organization] = await Organization.getAll(userContext,
        { tin: data.inn },
        { sortBy: 'createdAt_DESC', first: 1 },
    )
    if (!organization) return logger.info('Organization not found. Do nothing')

    for (const account of data.accounts) {
        const bankAccountDetails = {
            tin: organization.tin,
            country: RUSSIA_COUNTRY,
            number: account.number,
            currencyCode: (ISO_CODES_FOR_SBBOL[account.currencyCode]),
            routingNumber: account.bic,
        }
        const foundAccount = await BankAccount.getOne(bankAccountContext, {
            ...bankAccountDetails,
            organization: { id_in: organization.id },
        })

        if (!foundAccount) {
            await BankAccount.create(
                bankAccountContext,
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
            logger.info(`BankAccount instance created with number: ${account.number} in organization: ${organization.id}`)
        }
    }
}
/**
 * Fetches ClientAccounts from SBBOL for specified date and creates BankAccount if this bank account has not yet been created
 *
 * @return {Promise<void>}
 */
const syncBankAccounts = async (userId) => {
    const fintechApi = await initSbbolFintechApi(userId)

    if (!fintechApi) return

    logger.info('Checking, whether the user have ClientAccount items')

    const { data } = await fintechApi.getClientInfo()
    const accounts = get(data, 'accounts', [])

    if (isEmpty(accounts)) {
        logger.info('SBBOL did not return any ClientAccount, do nothing')
    } else {
        await _syncBankAccounts(data)
    }
}

module.exports = {
    syncBankAccounts,
}