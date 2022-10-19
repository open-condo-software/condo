const { sbbolSecretStorage } = require('../common')

/**
 *
 * @param {TokenSet} tokenInfoFromOAuth
 * @return {Promise<void>}
 */
const syncTokens = async (tokenInfoFromOAuth) => {
    const { access_token, expires_at: expiresAt, refresh_token } = tokenInfoFromOAuth
    await sbbolSecretStorage.setAccessToken(access_token, { expiresAt })
    await sbbolSecretStorage.setRefreshToken(refresh_token)
}

module.exports = {
    syncTokens,
}
