const { sbbolSecretStorage } = require('../singletons')
const { SbbolOauth2Api } = require('../oauth2')

/**
 * Each route handler here in each application instance needs an instance of `SbbolOauth2Api` with actual
 * Client Secret. This covers a case, when a client secret will get periodically updated.
 * @return {Promise<SbbolOauth2Api>}
 */
async function initializeSbbolAuthApi () {
    return new SbbolOauth2Api({
        clientSecret: await sbbolSecretStorage.getClientSecret(),
    })
}

/**
 * Tries to obtain non-expired access token from `SbbolSecretStorage`,
 * otherwise asks OAuth2 SBBOL API to refresh it.
 *
 * @return {Promise<string|*>}
 */
async function getOrganizationAccessToken () {
    if (await sbbolSecretStorage.isRefreshTokenExpired()) {
        const instructionsMessage = 'Please, login through SBBOL for this organization, so its accessToken and refreshToken will be obtained and saved in TokenSet table for further renewals'
        throw new Error(`refreshToken is expired for clientId = ${sbbolSecretStorage.clientId}. ${instructionsMessage}`)
    }

    if (await sbbolSecretStorage.isAccessTokenExpired()) {
        const clientSecret = await sbbolSecretStorage.getClientSecret()
        const currentRefreshToken = await sbbolSecretStorage.getRefreshToken()
        const oauth2 = new SbbolOauth2Api({ clientSecret })
        const { access_token, expires_at: expiresAt, refresh_token } = await oauth2.refreshToken(currentRefreshToken)

        await sbbolSecretStorage.setAccessToken(access_token, { expiresAt })
        await sbbolSecretStorage.setRefreshToken(refresh_token)
    }

    return await sbbolSecretStorage.getAccessToken()
}

module.exports = {
    initializeSbbolAuthApi,
    getOrganizationAccessToken,
}
