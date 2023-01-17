const { SbbolOauth2Api } = require('../oauth2')
const { getSbbolSecretStorage } = require('./getSbbolSecretStorage')

/**
 * Each route handler here in each application instance needs an instance of `SbbolOauth2Api` with actual
 * Client Secret. This covers a case, when a client secret will get periodically updated.
 * @return {Promise<SbbolOauth2Api>}
 */
async function initializeSbbolAuthApi () {
    const sbbolSecretStorage = getSbbolSecretStorage()
    return new SbbolOauth2Api({
        clientSecret: await sbbolSecretStorage.getClientSecret(),
    })
}

/**
 * Tries to obtain non-expired access token from `SbbolSecretStorage`, that corresponds to User.
 * In case when access token is expired, requests SBBOL OAuth2 API to refresh it.
 * User can correspond to a customer of "condo" or to an employee of our organization as a partner of SBBOL
 *
 * NOTE: To request data, related to our organization as a partner of SBBOL, we need to pass id of first user (admin) of our Organization, that can be found by `importId` equals to `SBBOL_FINTECH_CONFIG.service_organization_hashOrgId`.
 * @return {Promise<string|*>}
 */
async function getAccessTokenForUser (userId) {
    const sbbolSecretStorage = getSbbolSecretStorage()
    if (await sbbolSecretStorage.isRefreshTokenExpired(userId)) {
        const instructionsMessage = 'Please, login through SBBOL for this organization, so its accessToken and refreshToken will be obtained and saved in TokenSet table for further renewals'
        throw new Error(`refreshToken is expired for clientId = ${sbbolSecretStorage.clientId}. ${instructionsMessage}`)
    }

    if (await sbbolSecretStorage.isAccessTokenExpired(userId)) {
        const clientSecret = await sbbolSecretStorage.getClientSecret()
        const currentRefreshToken = await sbbolSecretStorage.getRefreshToken(userId)
        const oauth2 = new SbbolOauth2Api({ clientSecret })
        const { access_token, expires_at: expiresAt, refresh_token } = await oauth2.refreshToken(currentRefreshToken)

        await sbbolSecretStorage.setAccessToken(access_token, userId, { expiresAt })
        await sbbolSecretStorage.setRefreshToken(refresh_token, userId)
    }

    return await sbbolSecretStorage.getAccessToken(userId)
}

module.exports = {
    initializeSbbolAuthApi,
    getAccessTokenForUser,
}
