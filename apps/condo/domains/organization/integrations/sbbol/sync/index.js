const dayjs = require('dayjs')
const isEmpty = require('lodash/isEmpty')

const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getLogger } = require('@open-condo/keystone/logging')

const { BANK_INTEGRATION_IDS, SBBOL } = require('@condo/domains/banking/constants')
const { BankSyncTask, BankAccount, BankIntegrationOrganizationContext } = require('@condo/domains/banking/utils/serverSchema')
const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { normalizeEmail } = require('@condo/domains/common/utils/mail')
const { normalizePhone } = require('@condo/domains/common/utils/phone')

const { syncFeatures } = require('./features')
const { syncBankAccounts } = require('./syncBankAccounts')
const { syncOrganization } = require('./syncOrganization')
const { syncServiceSubscriptions } = require('./syncServiceSubscriptions')
const { syncTokens } = require('./syncTokens')
const { syncUser } = require('./syncUser')

const { dvSenderFields } = require('../constants')
const { SBBOL_IMPORT_NAME } = require('../constants')
const { getSbbolSecretStorage } = require('../utils')

const logger = getLogger('sbbol')

const SYNC_BANK_ACCOUNTS_FROM_SBBOL = 'sync-bank-accounts-from-sbbol'

/**
 * Params for direct execution of GraphQL queries and mutations using Keystone
 *
 * @typedef KeystoneContext
 * @property {Object} context
 * @property {Object} keystone
 */

/**
 * User information, fetched from SBBOL OAuth service
 *
 * @typedef UserInfo
 * @property {String} HashOrgId - required
 * @property {String} OrgName - required
 * @property {String} inn - required
 * @property {String} orgKpp - optional
 * @property {String} orgOgrn - optional
 * @property {String} orgLawFormShort - optional
 * @property {String} orgJuridicalAddress - optional
 * @property {String} orgFullName - optional
 * @property {String} orgOktmo - optional
 * @property {String} terBank - optional
 * @property {String} name - optional
 * @property {String} userGuid - required
 * @property {String} email - optional
 * @property {String} phone_number - required
 */

/**
 * Token information from OAuth
 * This is NOT a `TokenSet` record from our schema
 *
 * @typedef TokenSet
 * @property {String} access_token
 * @property {String} expires_at
 * @property {String} refresh_token
 */

/**
 * Creates or updates user, organization, subscription, tokens from SBBOL callback data
 * @param keystone
 * @param {UserInfo} userInfo data from OAuth client about user
 * @param {TokenSet} tokenSet
 * @param {User} authedUser
 * @param {string} reqId
 * @param {Array<string>} features list of features to sync
 * @param {boolean?} useExtendedConfig
 * @return {Promise<void>}
 */
const sync = async ({ keystone, userInfo, tokenSet, authedUser, features, useExtendedConfig = false  }) => {
    const adminContext = await keystone.createContext({ skipAccessControl: true })
    const context = {
        keystone,
        context: adminContext,
    }
    const organizationInfo = {
        ...dvSenderFields,
        name: userInfo.OrgName,
        country: RUSSIA_COUNTRY,
        meta: {
            inn: userInfo.inn,
            kpp: userInfo.orgKpp,
            ogrn: userInfo.orgOgrn,
            oktmo: userInfo.orgOktmo,
            address: userInfo.orgJuridicalAddress,
            fullname: userInfo.orgFullName,
            bank: userInfo.terBank,
        },
        importRemoteSystem: SBBOL_IMPORT_NAME,
        importId: userInfo.HashOrgId,
    }
    if (!userInfo.phone_number.startsWith('+')) {
        userInfo.phone_number = `+${userInfo.phone_number}`
    }
    const userData = {
        ...dvSenderFields,
        name: userInfo.name || userInfo.OrgName,
        email: normalizeEmail(userInfo.email),
        phone: normalizePhone(userInfo.phone_number) || userInfo.phone_number,
        isPhoneVerified: true,
        isEmailVerified: true,
    }
    let user
    try {
        user = await syncUser({ context, userInfo: userData, identityId: userInfo.userGuid || userInfo.sub })
    } catch (err) {
        logger.error({
            msg: 'failed to sync user',
            err,
            data: { userData, userInfo, organizationInfo },
        })
        throw err
    }
    let organizationSyncResult
    try {
        organizationSyncResult = await syncOrganization({ 
            context,
            authedUser,
            user,
            userData,
            organizationInfo,
            dvSenderFields,
        })
    } catch (err) {
        logger.error({
            msg: 'failed to sync organization',
            err,
            data: { userData, userInfo, organizationInfo },
        })
        throw err
    }
    const { organization, employee } = organizationSyncResult
    const sbbolSecretStorage = getSbbolSecretStorage(useExtendedConfig)
    await sbbolSecretStorage.setOrganization(organization.id)
    await syncTokens(tokenSet, user.id, organization.id, useExtendedConfig)
    await syncFeatures({ context, organization, features })
    await syncServiceSubscriptions({ context: adminContext, organization })

    const syncBankAccountFeatureEnabled = await featureToggleManager.isFeatureEnabled(adminContext, SYNC_BANK_ACCOUNTS_FROM_SBBOL, { organization: organization.id })
    if (syncBankAccountFeatureEnabled) {
        logger.info({
            msg: 'sync bank accounts',
            data: {
                user,
                organization,
            },
        })
        await syncBankAccounts(user.id, organization)

        const foundOrganizationContext = await BankIntegrationOrganizationContext.getAll(adminContext, {
            organization: { id: organization.id },
            integration: { id: BANK_INTEGRATION_IDS.SBBOL },
            deletedAt: null,
        })

        if (isEmpty(foundOrganizationContext)) {
            await BankIntegrationOrganizationContext.create(adminContext, {
                organization: { connect: { id: organization.id } },
                integration: { connect: { id: BANK_INTEGRATION_IDS.SBBOL } },
                ...dvSenderFields,
            })
        }

        const bankAccounts = await BankAccount.getAll(adminContext, {
            organization: {
                id: organization.id,
            },
            integrationContext: {
                integration: {
                    id: BANK_INTEGRATION_IDS.SBBOL,
                },
                deletedAt: null,
            },
            deletedAt: null,
        })
        for (let bankAccount of bankAccounts) {
            const bankSyncTask = await BankSyncTask.getAll(adminContext, {
                account: { id: bankAccount.id },
                options: {
                    type: SBBOL,
                },
            }, 'id', { first: 1 })
            /*
                If this account has already been loading transactions, then I do not do it again.
                Without this check, each time the user logs in, there will be spam from a large number of progressBars.
                1 progressBar per bankAccount
            */
            if (isEmpty(bankSyncTask)) {
                await BankSyncTask.create(adminContext, {
                    account: { connect: { id: bankAccount.id } },
                    organization: { connect: { id: organization.id } },
                    user: { connect: { id: user.id } },
                    totalCount: 0,
                    options: {
                        type: SBBOL,
                        dateFrom: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), // a full statement can be obtained only for the past day
                        dateTo: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
                    },
                    ...dvSenderFields,
                })
            }
        }
    }

    return {
        user,
        organization,
        organizationEmployee: employee,
    }
}


module.exports = sync
