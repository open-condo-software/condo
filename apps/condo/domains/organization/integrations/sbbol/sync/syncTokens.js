const { getSbbolSecretStorage } = require('../utils')

/**
 *
 * @param {TokenSet} tokenInfoFromOAuth
 * @param {String} userId
 * @param {boolean} useExtendedConfig
 * @param {String} organizationId
 * @return {Promise<void>}
 */
const syncTokens = async (tokenInfoFromOAuth, userId, useExtendedConfig = false, organizationId) => {
    const { access_token, expires_at: expiresAt, refresh_token } = tokenInfoFromOAuth
    const sbbolSecretStorage = getSbbolSecretStorage(useExtendedConfig)
    await sbbolSecretStorage.setAccessToken(access_token, userId, organizationId, { expiresAt })
    await sbbolSecretStorage.setRefreshToken(refresh_token, userId, organizationId)
}

module.exports = {
    syncTokens,
}
