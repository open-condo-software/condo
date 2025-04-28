const { getSbbolSecretStorage } = require('../utils')

/**
 *
 * @param {TokenSet} tokenInfoFromOAuth
 * @param {Object} userInfo
 * @param {string} userInfo.userId
 * @param {object} [userInfo.organizationId]
 * @param {boolean} useExtendedConfig
 * @return {Promise<void>}
 */
const syncTokens = async (tokenInfoFromOAuth, userInfo, useExtendedConfig = false) => {
    const { access_token, expires_at: expiresAt, refresh_token } = tokenInfoFromOAuth
    const sbbolSecretStorage = getSbbolSecretStorage(useExtendedConfig)
    await sbbolSecretStorage.setAccessToken(access_token, userInfo, { expiresAt })
    await sbbolSecretStorage.setRefreshToken(refresh_token, userInfo)
}

module.exports = {
    syncTokens,
}
