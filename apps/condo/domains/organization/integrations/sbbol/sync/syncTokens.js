const { getSbbolSecretStorage } = require('../utils')

/**
 *
 * @param {TokenSet} tokenInfoFromOAuth
 * @param {String} userId
 * @return {Promise<void>}
 */
const syncTokens = async (tokenInfoFromOAuth, userId) => {
    const { access_token, expires_at: expiresAt, refresh_token } = tokenInfoFromOAuth
    const sbbolSecretStorage = getSbbolSecretStorage()
    await sbbolSecretStorage.setAccessToken(access_token, userId, { expiresAt })
    await sbbolSecretStorage.setRefreshToken(refresh_token, userId)
}

module.exports = {
    syncTokens,
}
