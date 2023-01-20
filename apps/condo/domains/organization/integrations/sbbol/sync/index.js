const faker = require('faker')

const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { normalizeEmail } = require('@condo/domains/common/utils/mail')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { getOrganizationEmployee } = require('@condo/domains/organization/utils/serverSchema/OrganizationEmployee')

const { syncOrganization } = require('./syncOrganization')
const { syncServiceSubscriptions } = require('./syncServiceSubscriptions')
const { syncTokens } = require('./syncTokens')
const { syncUser } = require('./syncUser')

const { dvSenderFields } = require('../constants')
const { SBBOL_IMPORT_NAME } = require('../constants')
const { getSbbolSecretStorage } = require('../utils')

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
 * @param {string} reqId
 * @return {Promise<void>}
 */
const sync = async ({ keystone, userInfo, tokenSet  }) => {
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
        phone: normalizePhone(userInfo.phone_number),
        isPhoneVerified: true,
        isEmailVerified: true,
        password: faker.internet.password(),
    }

    const user = await syncUser({ context, userInfo: userData, identityId: userInfo.userGuid })
    const organization = await syncOrganization({ context, user, userData, organizationInfo, dvSenderFields })
    const sbbolSecretStorage = getSbbolSecretStorage()
    await sbbolSecretStorage.setOrganization(organization.id, user.id)
    await syncTokens(tokenSet, user.id)
    await syncServiceSubscriptions(userInfo.inn)

    const organizationEmployee = await getOrganizationEmployee({ context, user, organization })
    if (!organizationEmployee) {
        throw new Error('Failed to bind user to organization')
    }

    return {
        user,
        organization,
        organizationEmployee,
    }
}


module.exports = sync