const { find } = require('@open-condo/keystone/schema')

const { SbbolOauth2Api } = require('@condo/domains/organization/integrations/sbbol/oauth2')
const { getSbbolSecretStorage } = require('@condo/domains/organization/integrations/sbbol/utils/getSbbolSecretStorage')

/**
 * Each route handler here in each application instance needs an instance of `SbbolOauth2Api` with actual
 * Client Secret. This covers a case, when a client secret will get periodically updated.
 * @return {Promise<SbbolOauth2Api>}
 */
async function initializeSbbolAuthApi (useExtendedConfig = false) {
    const sbbolSecretStorage = getSbbolSecretStorage(useExtendedConfig)
    return new SbbolOauth2Api({
        clientSecret: await sbbolSecretStorage.getClientSecret(),
        useExtendedConfig,
    })
}

/**
 * Tries to obtain non-expired access token from `SbbolSecretStorage`, that corresponds to User.
 * In case when access token is expired, requests SBBOL OAuth2 API to refresh it.
 * User can correspond to a customer of "condo" or to an employee of our organization as a partner of SBBOL
 *
 * @param {Object} userInfo - The parameters.
 * @param {string} userInfo.userId - The user ID (required).
 * @param {string} [userInfo.organizationId] - The organization ID (optional).
 * @param {boolean} useExtendedConfig
 * NOTE: To request data, related to our organization as a partner of SBBOL, we need to pass id of first user (admin) of our Organization, that can be found by `importId` equals to `SBBOL_FINTECH_CONFIG.service_organization_hashOrgId`.
 * @return {Promise<string|*>}
 */
async function getAccessTokenForUser (userInfo, useExtendedConfig) {
    const sbbolSecretStorage = getSbbolSecretStorage(useExtendedConfig)
    if (await sbbolSecretStorage.isRefreshTokenExpired(userInfo)) {
        return { error: 'REFRESH_TOKEN_EXPIRED' }
    }
    if (await sbbolSecretStorage.isAccessTokenExpired(userInfo)) {
        const clientSecret = await sbbolSecretStorage.getClientSecret()
        const currentRefreshToken = await sbbolSecretStorage.getRefreshToken(userInfo)
        const oauth2 = new SbbolOauth2Api({ clientSecret, useExtendedConfig })
        const { access_token, expires_at: expiresAt, refresh_token } = await oauth2.refreshToken(currentRefreshToken)
        await sbbolSecretStorage.setAccessToken(access_token, userInfo, { expiresAt })
        await sbbolSecretStorage.setRefreshToken(refresh_token, userInfo)
    }

    return await sbbolSecretStorage.getAccessToken(userInfo)
}

const getAllAccessTokensByOrganization = async (context, organizationId) => {
    const employees = await find('OrganizationEmployee', {
        organization: { id: organizationId },
        deletedAt: null,
    })

    let accessTokens = []
    const sbbolSecretStorage = getSbbolSecretStorage(true)
    const clientSecret = await sbbolSecretStorage.getClientSecret()
    const oauth2 = new SbbolOauth2Api({ clientSecret, useExtendedConfig: true })

    for (let employee of employees) {
        const userId = employee.user
        let accessToken
        try {
            if (await sbbolSecretStorage.isRefreshTokenExpired(userId)) {
                continue
            }

            if (await sbbolSecretStorage.isAccessTokenExpired(userId)) {
                const currentRefreshToken = await sbbolSecretStorage.getRefreshToken(userId)
                const { access_token, expires_at: expiresAt, refresh_token } = await oauth2.refreshToken(currentRefreshToken)
                await sbbolSecretStorage.setAccessToken(access_token, userId, { expiresAt })
                await sbbolSecretStorage.setRefreshToken(refresh_token, userId)
                accessToken = access_token
            } else {
                accessToken = await sbbolSecretStorage.getAccessToken(userId)
            }

            accessTokens.push(accessToken)
        } catch (e) {
            // continue finding accessTokens
        }
    }

    return accessTokens
}

module.exports = {
    initializeSbbolAuthApi,
    getAccessTokenForUser,
    getAllAccessTokensByOrganization,
}
