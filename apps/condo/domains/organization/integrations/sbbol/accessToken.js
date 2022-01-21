const { getSchemaCtx } = require('@core/keystone/schema')
const { TokenSet } = require('@condo/domains/organization/utils/serverSchema')
const { SBBOL_IMPORT_NAME } = require('./common')
const dayjs = require('dayjs')
const { SbbolOauth2Api } = require('./oauth2')
const { REFRESH_TOKEN_TTL } = require('./constants')

/**
 * First tries to obtain non-expired access token from `TokenSet` schema locally,
 * then asks OAuth2 SBBOL API to refresh it.
 *
 * @param organizationImportId `hashOrgId` param from SBBOL `UserInfo` object
 * @return {Promise<string|*>}
 */
async function getOrganizationAccessToken (organizationImportId) {
    const { keystone } = await getSchemaCtx('TokenSet')
    const adminContext = await keystone.createContext({ skipAccessControl: true })
    // TODO(pahaz): need to be fixed! it's looks so strange.
    const [tokenSet] = await TokenSet.getAll(adminContext, { organization: { importId: organizationImportId, importRemoteSystem: SBBOL_IMPORT_NAME } }, { sortBy: ['createdAt_DESC'] })
    const instructionsMessage = 'Please, login through SBBOL for this organization, so its accessToken and refreshToken will be obtained and saved in TokenSet table for further renewals'
    if (!tokenSet) {
        throw new Error(`[tokens:expired] record from TokenSet was not found for organization ${organizationImportId}. ${instructionsMessage}`)
    }
    const isRefreshTokenExpired = dayjs(dayjs()).isAfter(tokenSet.refreshTokenExpiresAt)
    if (isRefreshTokenExpired) {
        throw new Error(`[tokens:expired] refreshToken is expired for organization ${organizationImportId}. ${instructionsMessage}`)
    }
    const isAccessTokenExpired = dayjs(dayjs()).isAfter(tokenSet.accessTokenExpiresAt)
    if (isAccessTokenExpired) {
        const oauth2 = new SbbolOauth2Api({
            clientSecret: tokenSet.clientSecret,
        })
        const { access_token, refresh_token, expires_at } = await oauth2.refreshToken(tokenSet.refreshToken)
        await TokenSet.update(adminContext, tokenSet.id, {
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
    getOrganizationAccessToken,
}