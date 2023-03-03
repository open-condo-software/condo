const { get, isEmpty } = require('lodash')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { BANK_INTEGRATION_IDS } = require('@condo/domains/banking/constants')
const { BankAccount } = require('@condo/domains/banking/utils/serverSchema')
const { BankIntegrationContext, BankIntegration } = require('@condo/domains/banking/utils/serverSchema')
const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { ISO_CODES_FOR_SBBOL } = require('@condo/domains/common/constants/currencies')
const { dvSenderFields } = require('@condo/domains/organization/integrations/sbbol/constants')
const { initSbbolFintechApi } = require('@condo/domains/organization/integrations/sbbol/SbbolFintechApi')


const logger = getLogger('sbbol/syncBankAccounts')

/**
 * Connects new BankAccount records for user according to accounts data from SBBOL.
 *  @param {SbbolAccount} accounts
 *  @param {Object} organization
 */
const _syncBankAccounts = async (accounts, organization) => {
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
            organization: { id: organization.id },
        })

        const integration = await BankIntegration.getOne(context, { id: BANK_INTEGRATION_IDS.SBBOL })
        if (!integration) throw new Error(`Cannot find SBBOL integration by id=" ${BANK_INTEGRATION_IDS.SBBOL}"`)

        if (!foundAccount) {
            const bankIntegrationContext = await BankIntegrationContext.create(context, {
                ...dvSenderFields,
                integration: { connect: { id: integration.id } },
                organization: { connect: { id: organization.id } },
            })

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
                    integrationContext: { connect: { id: bankIntegrationContext.id } },
                    organization: { connect: { id: organization.id } },
                }
            )
            logger.info({ msg: 'Created BankAccount', bankAccount: { id: account.number, organization: { id: organization.id, name: organization.name } } })
        } else {
            const haveSBBOLIntegrationContext = get(foundAccount, 'integrationContext.integration.id') === integration.id

            if (!haveSBBOLIntegrationContext) {
                logger.info({ msg: 'Found account have`nt integrationContext' })

                const createdBankIntegrationContext = await BankIntegrationContext.create(context, {
                    ...dvSenderFields,
                    integration: { connect: { id: integration.id } },
                    organization: { connect: { id: organization.id } },
                })

                await BankAccount.update(context, foundAccount.id, {
                    integrationContext: { connect: { id: createdBankIntegrationContext.id } },
                    ...dvSenderFields,
                })

                logger.info({ msg: `Connected BankIntegrationContext { id: ${createdBankIntegrationContext.id}, integration: { name: 'SBBOL' } } to BankAccount { id: ${foundAccount.id} }` })
            }
        }
    }
}
/**
 * Fetches ClientAccounts from SBBOL for specified date and creates BankAccount if this bank account has not yet been created
 *
 *  @param {String} userId
 *  @param {Object} organization
 * @return {Promise<void>}
 */
const syncBankAccounts = async (userId, organization) => {
    if (!userId) throw new Error('userId is required')
    if (!organization) throw new Error('organization is required')

    const fintechApi = await initSbbolFintechApi(userId)

    if (!fintechApi) return

    const { data } = await fintechApi.getClientInfo()
    const accounts = get(data, 'accounts', [])

    if (isEmpty(accounts)) {
        logger.info({ msg: 'SBBOL did not return any ClientAccount, do nothing' })
    } else {
        await _syncBankAccounts(accounts, organization)
    }
}

module.exports = {
    syncBankAccounts,
    _syncBankAccounts,
}