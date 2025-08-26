const { Issuer } = require('openid-client')

const conf = require('@open-condo/config')


let OIDC_HELPER_INSTANCE

// TODO(DOMA-9342): move oidc logic to separate package
class OIDCHelper {
    constructor () {
        const oidcClientConfig = conf.OIDC_CONDO_CLIENT_CONFIG
        if (!oidcClientConfig) throw new Error('no OIDC_CONDO_CLIENT_CONFIG env')
        const { serverUrl, clientId, clientSecret, clientOptions, issuerOptions } = JSON.parse(oidcClientConfig)
        if (!serverUrl || !clientId || !clientSecret) throw new Error('no serverUrl or clientId or clientSecret inside OIDC_CONDO_CLIENT_CONFIG env')

        this.redirectUrl = `${conf.SERVER_URL}/oidc/callback`
        this.issuer = new Issuer({
            authorization_endpoint: `${serverUrl}/oidc/auth`,
            token_endpoint: `${serverUrl}/oidc/token`,
            end_session_endpoint: `${serverUrl}/oidc/session/end`,
            jwks_uri: `${serverUrl}/oidc/jwks`,
            revocation_endpoint: `${serverUrl}/oidc/token/revocation`,
            userinfo_endpoint: `${serverUrl}/oidc/me`,
            issuer: serverUrl,
            ...(issuerOptions || {}),
        })
        this.client = new this.issuer.Client({
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uris: [this.redirectUrl], // using uri as redirect_uri to show the ID Token contents
            response_types: ['code id_token'],
            token_endpoint_auth_method: 'client_secret_basic',
            ...(clientOptions || {}),
        })
        this.clientID = clientId
    }

    /**
     * @return {OIDCHelper}
     */
    static getInstance () {
        if (!OIDC_HELPER_INSTANCE) {
            OIDC_HELPER_INSTANCE = new OIDCHelper()
        }
        return OIDC_HELPER_INSTANCE
    }

    getAuthorizationUrlWithParams (checks) {
        return this.client.authorizationUrl({
            response_type: 'code',
            ...checks,
        })
    }

    /**
     * @param inputOrReq
     * @param checks
     * @returns {Promise<{userInfo: Object, accessToken: string, tokenExpiresAt: number, refreshToken: string}>}
     */
    async completeAuth (inputOrReq, checks) {
        const params = this.client.callbackParams(inputOrReq)
        const credentials = await this.client.callback(this.redirectUrl, params, checks)
        const { access_token: accessToken, refresh_token: refreshToken, expires_at: tokenExpiresAt } = credentials
        const userInfo = await this.client.userinfo(accessToken)
        return { accessToken, refreshToken, tokenExpiresAt, userInfo }
    }

    /**
     Exchanges the refresh token for the new access token
     @see https://github.com/panva/node-openid-client/blob/main/docs/README.md#clientrefreshrefreshtoken-extras
     * @param refreshToken
     * @return {Promise<{tokenExpiresAt, accessToken, refreshToken}>}
     */
    async refreshTokens (refreshToken) {
        const credentials = await this.client.refresh(refreshToken)
        const { access_token: accessToken, refresh_token: newRefreshToken, expires_at: tokenExpiresAt } = credentials
        return { accessToken, refreshToken: newRefreshToken, tokenExpiresAt }
    }
}

module.exports = {
    OIDCHelper,
}