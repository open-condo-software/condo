const { getSbbolSecretStorage } = require('../utils')

/**
 *
 * @param {TokenSet} tokenInfoFromOAuth
 * @return {Promise<void>}
 */
const syncTokens = async (tokenInfoFromOAuth) => {
    const { access_token, expires_at: expiresAt, refresh_token } = tokenInfoFromOAuth
    const sbbolSecretStorage = getSbbolSecretStorage()
    await sbbolSecretStorage.setAccessToken(access_token, { expiresAt })
    await sbbolSecretStorage.setRefreshToken(refresh_token)
}

module.exports = {
    syncTokens,
}
