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
 * NOTE: To request data, related to our organization as a partner of SBBOL, we need to pass id of first user (admin) of our Organization, that can be found by `importId` equals to `SBBOL_FINTECH_CONFIG.service_organization_hashOrgId`.
 * @return {Promise<string|*>}
 */
async function getAccessTokenForUser (userId, organizationId, useExtendedConfig = false) {
    const sbbolSecretStorage = getSbbolSecretStorage(useExtendedConfig)
    if (await sbbolSecretStorage.isRefreshTokenExpired(userId, organizationId)) {
        return { error: 'REFRESH_TOKEN_EXPIRED' }
    }
    if (await sbbolSecretStorage.isAccessTokenExpired(userId, organizationId)) {
        const oauth2 = await initializeSbbolAuthApi(useExtendedConfig)
        const currentRefreshToken = await sbbolSecretStorage.getRefreshToken(userId, organizationId)
        const { access_token, expires_at: expiresAt, refresh_token } = await oauth2.refreshToken(currentRefreshToken)
        await sbbolSecretStorage.setAccessToken(access_token, userId, organizationId, { expiresAt })
        await sbbolSecretStorage.setRefreshToken(refresh_token, userId, organizationId)
    }
    const { accessToken, ttl } = await sbbolSecretStorage.getAccessToken(userId, organizationId)
    return { error: null, accessToken, ttl }
}

const getAllAccessTokensByOrganization = async (context, organizationId) => {
    const employees = await find('OrganizationEmployee', {
        organization: { id: organizationId },
        deletedAt: null,
    })
    const accessTokens = await Promise.all(employees.map(async ({ user: userId }) => {
        const { error, ...accessToken } = await getAccessTokenForUser(userId, organizationId, true)
        return error ? null : accessToken
    }))
    return accessTokens.filter(Boolean)
}

module.exports = {
    initializeSbbolAuthApi,
    getAccessTokenForUser,
    getAllAccessTokensByOrganization,
}