const fetch = require('node-fetch')
const { Issuer, generators } = require('openid-client')
const { default: axios } = require('axios')

const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

const adapter = require('../oidc/adapter')
const { createAxiosClientWithCookie } = require('@core/keystone/test.utils')

const DEBUG = true

async function createClient (oidcClient) {
    const clients = new adapter('Client')
    await clients.upsert(oidcClient.client_id, oidcClient)
}

async function getAccessToken (accessToken) {
    const clients = new adapter('AccessToken')
    return await clients.find(accessToken)
}

async function request (url, cookie) {
    const client = createAxiosClientWithCookie({}, cookie, url)
    const res = await client.get(url)
    cookie = client.getCookie()
    return {
        cookie,
        client,
        url: res.config.url,
        status: res.status,
        data: res.data,
        headers: res.headers,
    }
}

test('getCookie test util', async () => {
    const c = await makeClientWithNewRegisteredAndLoggedInUser()
    const cookie = c.getCookie()

    const result1 = await axios.create({
        timeout: 2000,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Cache: 'no-cache',
            Cookie: cookie,
        },
        validateStatus: () => true,
    })
        .post(`${c.serverUrl}/admin/api`, JSON.stringify({ 'operationName': null, 'variables': {}, 'query': '{ authenticatedUser { id name } }' }))
    expect(result1.data).toMatchObject({
        'data': {
            'authenticatedUser': {
                id: c.user.id,
                name: c.user.name,
            },
        },
    })

    const result2 = await fetch(`${c.serverUrl}/admin/api`, {
        method: 'POST',
        body: JSON.stringify({ 'operationName': null, 'variables': {}, 'query': '{ authenticatedUser { id name } }' }),
        headers: {
            'Content-Type': 'application/json',
            Cookie: cookie,

        },
    })
    expect(await result2.json()).toMatchObject({
        'data': {
            'authenticatedUser': {
                id: c.user.id,
                name: c.user.name,
            },
        },
    })

})

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
    expect(c.getCookie().split(';').map(x => x.split('=')[0])).toEqual(['keystone.sid'])

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
    })

    const nonce = generators.nonce()
    const url = new URL(serverSideOidcClient.authorizationUrl({
        scope: 'openid',
        nonce,
    }))

    const oidcAuthUrl = `${c.serverUrl}${url.pathname}${url.search}`
    if (DEBUG) console.log('oidcAuthUrl', oidcAuthUrl)

    const res1 = await request(oidcAuthUrl, c.getCookie())
    if (DEBUG) console.log('res1', res1.status, res1.data, res1.url)
    expect(res1.status).toBe(200)

    const redirectTo = `${c.serverUrl}${'/oidc' + res1.data.redirectTo.split('/oidc')[1]}`
    if (DEBUG) console.log('redirectTo', redirectTo)

    const res2 = await request(redirectTo, res1.cookie)
    if (DEBUG) console.log('res2', res2.status, res2.url)

    // server side ( callback with code to oidc app site; server get the access and cann use it )
    const params = serverSideOidcClient.callbackParams(res2.url.replace('https://jwt.io/#', 'https://jwt.io/?'))
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
    expect(await data1.json()).toMatchObject({
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
    expect(await data2.json()).toMatchObject({
        'data': {
            'authenticatedUser': {
                id: c.user.id,
                name: c.user.name,
            },
        },
    })
})
