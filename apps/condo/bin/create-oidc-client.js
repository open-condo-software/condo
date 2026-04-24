const path = require('path')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')

const { createOidcClient } = require('@condo/domains/user/oidc')


const USE_NATIVE_APPLICATION_TYPE_FLAG = '--native-application-type'

async function main (rawArgs) {
    const useNativeApplicationType = rawArgs.includes(USE_NATIVE_APPLICATION_TYPE_FLAG)

    const args = rawArgs.filter(arg => arg !== USE_NATIVE_APPLICATION_TYPE_FLAG)
    const [clientId, clientSecret, redirectUri, postLogoutRedirectUri] = args

    const usage = 'use: create-oidc-client <clientId> <clientSecret> <redirectUri> [postLogoutRedirectUri] [--native-application-type]'

    if (!clientId || !clientSecret || !redirectUri.startsWith('http')) throw new Error(usage)
    if (postLogoutRedirectUri && !postLogoutRedirectUri.startsWith('http')) throw new Error(usage)

    const { keystone } = await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps: ['NextApp', 'AdminUIApp'] })

    await createOidcClient({
        // application_type, client_id, client_name, client_secret, client_uri, contacts, default_acr_values, default_max_age, grant_types, id_token_signed_response_alg, initiate_login_uri, jwks, jwks_uri, logo_uri, policy_uri, post_logout_redirect_uris, redirect_uris, require_auth_time, response_types, scope, sector_identifier_uri, subject_type, token_endpoint_auth_method, tos_uri, userinfo_signed_response_alg
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uris: [redirectUri], // using uri as redirect_uri to show the ID Token contents
        isEnabled: true,
        response_types: ['code id_token', 'code', 'id_token'],
        grant_types: ['implicit', 'authorization_code', 'refresh_token'], // 'implicit', 'authorization_code', 'refresh_token', or 'urn:ietf:params:oauth:grant-type:device_code'
        token_endpoint_auth_method: 'client_secret_basic',
        ...(useNativeApplicationType ? { application_type: 'native' } : {}), // allows OIDC working on localhost without https
        ...(postLogoutRedirectUri ? { post_logout_redirect_uris: [postLogoutRedirectUri] } : {}),
    }, keystone)

    console.log(`Created: ${clientId}`)
}

main(process.argv.slice(2)).then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
