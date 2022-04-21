const dayjs = require('dayjs')
const { get } = require('lodash')

const conf = require('@core/config')

const { getSchemaCtx, getByCondition } = require('@core/keystone/schema')
const { TokenSet } = require('@condo/domains/organization/utils/serverSchema')

const { SBBOL_IMPORT_NAME } = require('../common')
const { SbbolOauth2Api } = require('../oauth2')
const { REFRESH_TOKEN_TTL } = require('../constants')

const SBBOL_FINTECH_CONFIG = conf.SBBOL_FINTECH_CONFIG ? JSON.parse(conf.SBBOL_FINTECH_CONFIG) : {}
const SBBOL_AUTH_CONFIG = conf.SBBOL_AUTH_CONFIG ? JSON.parse(conf.SBBOL_AUTH_CONFIG) : {}

async function getClientSecret (organizationImportId) {
    // TODO(zuch): DOMA-2814 remove secret from TokenSet
    // TODO(pahaz): it's better to use find/getByCondition here
    const { keystone } = await getSchemaCtx('TokenSet')
    const context = await keystone.createContext({ skipAccessControl: true })
    // we can't use getOne here as we can have multiple users from our organization
    let [tokenSet] = await TokenSet.getAll(context, {
        organization: {
            importId: organizationImportId,
            importRemoteSystem: SBBOL_IMPORT_NAME,
        },
    }, { sortBy: ['clientSecretExpiresAt_DESC'] })
    // In case when we we have not logged in using partner account in SBBOL, take the value from environment
    return get(tokenSet, ['clientSecret'], SBBOL_AUTH_CONFIG.client_secret)
}

/**
 * Each route handler here in each application instance needs an instance of `SbbolOauth2Api` with actual
 * client secret. This covers a case, when a client secret will get periodically updated.
 * @return {Promise<SbbolOauth2Api>}
 */
async function initializeSbbolAuthApi () {
    const clientSecret = await getClientSecret(SBBOL_FINTECH_CONFIG.service_organization_hashOrgId)

    return new SbbolOauth2Api({
        clientSecret,
    })
}

/**
 * First tries to obtain non-expired access token from `TokenSet` schema locally,
 * then asks OAuth2 SBBOL API to refresh it.
 *
 * @param context - Keystone context with `skipAccessControl: true`
 * @param organizationImportId `hashOrgId` param from SBBOL `UserInfo` object
 * @return {Promise<string|*>}
 */
async function getOrganizationAccessToken (context, organizationImportId) {
    if (!context) throw new Error('[error] internal error no context')
    if (!organizationImportId) throw new Error('[error] internal error no organizationImportId')
    // TODO(pahaz): need to be fixed! it's looks so strange.
    let [tokenSet] = await TokenSet.getAll(context, { organization: { importId: organizationImportId, importRemoteSystem: SBBOL_IMPORT_NAME } }, { sortBy: ['createdAt_DESC'] })
    const instructionsMessage = 'Please, login through SBBOL for this organization, so its accessToken and refreshToken will be obtained and saved in TokenSet table for further renewals'
    if (!tokenSet) {
        throw new Error(`[tokens:expired] record from TokenSet was not found for organization ${organizationImportId}. ${instructionsMessage}`)
    }
    // Get `clientSecret` from `TokenSet` record or from .env
    const clientSecret = tokenSet.clientSecret || SBBOL_AUTH_CONFIG.client_secret
    if (!clientSecret) {
        throw new Error(`[clientSecret] no clientSecret for ${organizationImportId}. ${instructionsMessage}`)
    }

    const isRefreshTokenExpired = dayjs(dayjs()).isAfter(tokenSet.refreshTokenExpiresAt)
    if (isRefreshTokenExpired) {
        throw new Error(`[tokens:expired] refreshToken is expired for organization ${organizationImportId}. ${instructionsMessage}`)
    }
    const isAccessTokenExpired = dayjs(dayjs()).isAfter(tokenSet.accessTokenExpiresAt)
    if (isAccessTokenExpired) {
        const oauth2 = new SbbolOauth2Api({ clientSecret })
        const { access_token, refresh_token, expires_at } = await oauth2.refreshToken(tokenSet.refreshToken)
        tokenSet = await TokenSet.update(context, tokenSet.id, {
            accessToken: access_token,
            refreshToken: refresh_token,
            accessTokenExpiresAt: new Date(Number(expires_at) * 1000).toISOString(),
            refreshTokenExpiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL * 1000).toISOString(),
        })
        return { accessToken: access_token, tokenSet }
    } else {
        return { accessToken: tokenSet.accessToken, tokenSet }
    }
}

module.exports = {
    initializeSbbolAuthApi,
    getOrganizationAccessToken,
}
