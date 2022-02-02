const fetch = require('node-fetch')
const { Issuer, generators } = require('openid-client')

const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

const adapter = require('../oidc/adapter')

const DEBUG = false

async function createClient (oidcClient) {
    const clients = new adapter('Client')
    await clients.upsert(oidcClient.client_id, oidcClient)
}

async function getAccessToken (accessToken) {
    const clients = new adapter('AccessToken')
    return await clients.find(accessToken)
}

test('oidc', async () => {
    await createClient({
        // application_type, client_id, client_name, client_secret, client_uri, contacts, default_acr_values, default_max_age, grant_types, id_token_signed_response_alg, initiate_login_uri, jwks, jwks_uri, logo_uri, policy_uri, post_logout_redirect_uris, redirect_uris, require_auth_time, response_types, scope, sector_identifier_uri, subject_type, token_endpoint_auth_method, tos_uri, userinfo_signed_response_alg
        client_id: 'foo',
        client_secret: 'secret',
        redirect_uris: ['https://jwt.io/'], // using jwt.io as redirect_uri to show the ID Token contents
        response_types: ['code id_token', 'code', 'id_token'],
        grant_types: ['implicit', 'authorization_code'], // 'implicit', 'authorization_code', 'refresh_token', or 'urn:ietf:params:oauth:grant-type:device_code'
        token_endpoint_auth_method: 'client_secret_basic',
    })

    const c = await makeClientWithNewRegisteredAndLoggedInUser()

    // server side ( create oidc client and prepare oidcAuthUrl )
    const oidcIssuer = await Issuer.discover(`${c.serverUrl}/oidc`)
    if (DEBUG) console.log('Discovered issuer %s %O', oidcIssuer.issuer, oidcIssuer.metadata)
    const serverSideOidcClient = new oidcIssuer.Client({
        client_id: 'foo',
        client_secret: 'secret',
        redirect_uris: ['https://jwt.io/'], // using jwt.io as redirect_uri to show the ID Token contents
        response_types: ['code id_token'],
        // id_token_signed_response_alg (default "RS256")
        token_endpoint_auth_method: 'client_secret_basic',
    }) // => Client

    const nonce = generators.nonce()
    const url = new URL(serverSideOidcClient.authorizationUrl({
        scope: 'openid refresh_token mazafaka jjjh',
        nonce,
    }))

    const oidcAuthUrl = `${url.pathname}${url.search}`
    if (DEBUG) console.log('oidcAuthUrl', oidcAuthUrl)

    // client side ( go to url and pass throw interactions; accept access and allow oidc app to use my data )
    const res1 = await c.get(oidcAuthUrl)
    if (DEBUG) console.log('res1', res1.text, res1.headers.location)
    expect(res1.statusCode).toBe(303)
    const res2 = await c.get(res1.headers.location)
    if (DEBUG) console.log('res2', res2.text, res2.headers.location)
    expect(res2.statusCode).toBe(200)
    const redirectTo = '/oidc' + JSON.parse(res2.text)['redirectTo'].split('/oidc')[1]
    if (DEBUG) console.log('redirectTo', redirectTo)
    const res3 = await c.get(redirectTo)
    if (DEBUG) console.log('res3', res3.text, res3.headers.location)

    // server side ( callback with code to oidc app site; server get the access and cann use it )
    const params = serverSideOidcClient.callbackParams(res3.headers.location.replace('https://jwt.io/#', 'https://jwt.io/?'))
    if (DEBUG) console.log('callbackParams', params)
    const tokenSet = await serverSideOidcClient.callback('https://jwt.io/', { code: params.code }, { nonce })
    if (DEBUG) console.log('received and validated tokens %j', tokenSet)
    if (DEBUG) console.log('refreshed ID Token claims %j', tokenSet.claims())
    expect(tokenSet.access_token).toHaveLength(43) // important!
    const userinfo = await serverSideOidcClient.userinfo(tokenSet.access_token)
    if (DEBUG) console.log('userinfo %j', userinfo)
    expect(userinfo).toEqual({ 'sub': c.user.id })

    expect(await getAccessToken(tokenSet.access_token)).toMatchObject({
        'accountId': c.user.id,
        'clientId': 'foo',
        'expiresWithSession': true,
        'gty': 'authorization_code',
        'kind': 'AccessToken',
        'scope': 'openid',
    })

    const data1 = await fetch(`${c.serverUrl}/admin/api`, {
        method: 'POST',
        body: JSON.stringify({ 'operationName': null, 'variables': {}, 'query': '{ authenticatedUser { id name } }' }),
        headers: { 'Content-Type': 'application/json' },
    })

    expect(data1.headers.raw()['set-cookie']).toBeFalsy()
    expect(await data1.json()).toEqual({
        'data': {
            'authenticatedUser': null,
        },
    })

    const data2 = await fetch(`${c.serverUrl}/admin/api`, {
        method: 'POST',
        body: JSON.stringify({ variables: {}, query: '{ authenticatedUser { id name } }' }),
        headers: {
            'Authorization': `Bearer ${tokenSet.access_token}`,
            'Content-Type': 'application/json',
        },
    })

    expect(data2.headers.raw()['set-cookie']).toBeFalsy()
    expect(await data2.json()).toEqual({
        'data': {
            'authenticatedUser': {
                id: c.user.id,
                name: c.user.name,
            },
        },
    })
})
