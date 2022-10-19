const { sbbolSecretStorage } = require('../common')

const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60 // its real TTL is 180 days bit we need to update it earlier

/**
 *
 * @param {TokenSet} tokenInfoFromOAuth
 * @return {Promise<void>}
 */
const syncTokens = async (tokenInfoFromOAuth) => {
    const { access_token, expires_at, refresh_token } = tokenInfoFromOAuth
    const accessTokenExpiresAt = new Date(Number(expires_at) * 1000).toISOString()
    const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000).toISOString()
    await sbbolSecretStorage.setAccessToken(access_token, accessTokenExpiresAt)
    await sbbolSecretStorage.setRefreshToken(refresh_token, refreshTokenExpiresAt)
}

module.exports = {
    syncTokens,
}
