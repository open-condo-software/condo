import { Issuer } from 'openid-client'

import conf from '@open-condo/config'

let client

export async function getClient () {
    if (client) return client

    const oidcClientConfig = conf.OIDC_CONDO_CLIENT_CONFIG
    if (!oidcClientConfig) throw new Error('No OIDC_CONDO_CLIENT_CONFIG env!')

    const { serverUrl, clientId, clientSecret, clientOptions, issuerOptions } = JSON.parse(oidcClientConfig)
    if (!serverUrl || !clientId || !clientSecret) {
        throw new Error('No serverUrl or clientId or clientSecret inside OIDC_CONDO_CLIENT_CONFIG env!')
    }

    const serviceUrl = conf.SERVICE_URL
    const redirectUrl = `${serviceUrl}/api/oidc/callback`

    const issuer = new Issuer({
        authorization_endpoint: `${serverUrl}/oidc/auth`,
        token_endpoint: `${serverUrl}/oidc/token`,
        end_session_endpoint: `${serverUrl}/oidc/session/end`,
        jwks_uri: `${serverUrl}/oidc/jwks`,
        revocation_endpoint: `${serverUrl}/oidc/token/revocation`,
        userinfo_endpoint: `${serverUrl}/oidc/me`,
        issuer: serverUrl,
        ...(issuerOptions || {}),
    })

    client = new issuer.Client({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uris: [redirectUrl],
        response_types: ['code id_token'],
        token_endpoint_auth_method: 'client_secret_basic',
        ...(clientOptions || {}),
    })

    return client
}
