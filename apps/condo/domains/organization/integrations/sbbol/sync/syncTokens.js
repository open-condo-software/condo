const { getSbbolSecretStorage } = require('../utils')

/**
 *
 * @param {TokenSet} tokenInfoFromOAuth
 * @param {String} userId
 * @param {boolean} useExtendedConfig
 * @return {Promise<void>}
 */
const syncTokens = async (tokenInfoFromOAuth, userId, useExtendedConfig = false) => {
    const { access_token, expires_at: expiresAt, refresh_token } = tokenInfoFromOAuth
    const sbbolSecretStorage = getSbbolSecretStorage(useExtendedConfig)
    await sbbolSecretStorage.setAccessToken(access_token, userId, { expiresAt })
    await sbbolSecretStorage.setRefreshToken(refresh_token, userId)
}

module.exports = {
    syncTokens,
}
