const fetch = require('node-fetch')
const { Issuer, generators } = require('openid-client')
const { default: axios } = require('axios')

const { createAxiosClientWithCookie, getRandomString } = require('@core/keystone/test.utils')

const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

const { AdapterFactory } = require('../oidc/adapter')

async function createClient (oidcClient) {
    const clients = new AdapterFactory('Client')
    await clients.upsert(oidcClient.client_id, oidcClient)
}

async function getAccessToken (accessToken) {
    const clients = new AdapterFactory('AccessToken')
    return await clients.find(accessToken)
}

async function request (url, cookie) {
    const client = createAxiosClientWithCookie({ maxRedirects: 0 }, cookie, url)
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

function expectCookieKeys (cookie, keys) {
    expect(cookie.split(';').map(x => x.split('=')[0])).toEqual(keys)
}

async function expectToGetAuthenticatedUser (url, expectedUser, headers = {}) {
    const data1 = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ 'operationName': null, 'variables': {}, 'query': '{ authenticatedUser { id name } }' }),
        headers: { 'Content-Type': 'application/json', ...headers },
    })

    expect(data1.status).toBe(200)
    expect(data1.headers.raw()['set-cookie']).toBeFalsy()
    expect(await data1.json()).toMatchObject({
        'data': {
            'authenticatedUser': expectedUser,
        },
    })
}

test('getCookie test util', async () => {
    const c = await makeClientWithNewRegisteredAndLoggedInUser()
    const cookie = c.getCookie()
    const graphql = { 'query': '{ authenticatedUser { id name } }' }

    const result1 = await axios.create({
        timeout: 2000,
        headers: {
            Cookie: cookie,
        },
        validateStatus: () => true,
    })
        .post(`${c.serverUrl}/admin/api`, graphql)
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
        body: JSON.stringify(graphql),
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

    await expectToGetAuthenticatedUser(
        `${c.serverUrl}/admin/api`,
        { id: c.user.id, name: c.user.name },
        { Cookie: cookie },
    )
})

test('oidc', async () => {
    const uri = 'https://jwt.io/'
    const clientId = getRandomString()
    const clientSecret = getRandomString()
    await createClient({
        // application_type, client_id, client_name, client_secret, client_uri, contacts, default_acr_values, default_max_age, grant_types, id_token_signed_response_alg, initiate_login_uri, jwks, jwks_uri, logo_uri, policy_uri, post_logout_redirect_uris, redirect_uris, require_auth_time, response_types, scope, sector_identifier_uri, subject_type, token_endpoint_auth_method, tos_uri, userinfo_signed_response_alg
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uris: [uri], // using uri as redirect_uri to show the ID Token contents
        response_types: ['code id_token', 'code', 'id_token'],
        grant_types: ['implicit', 'authorization_code'], // 'implicit', 'authorization_code', 'refresh_token', or 'urn:ietf:params:oauth:grant-type:device_code'
        token_endpoint_auth_method: 'client_secret_basic',
    })

    const c = await makeClientWithNewRegisteredAndLoggedInUser()
    expectCookieKeys(c.getCookie(), ['keystone.sid'])

    // 1) server side ( create oidc client and prepare oidcAuthUrl )

    const oidcIssuer = await Issuer.discover(`${c.serverUrl}/oidc`)
    const serverSideOidcClient = new oidcIssuer.Client({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uris: [uri], // using uri as redirect_uri to show the ID Token contents
        response_types: ['code id_token'],
        token_endpoint_auth_method: 'client_secret_basic',
    })

    const nonce = generators.nonce()
    const scope = 'openid'
    const url = new URL(serverSideOidcClient.authorizationUrl({ scope, nonce }))
    const oidcAuthUrl = `${c.serverUrl}${url.pathname}${url.search}`

    // 2) client side ( open oidcAuthUrl )

    const res1 = await request(oidcAuthUrl, c.getCookie())
    expect(res1.status).toBe(303)
    expect(res1.headers.location.startsWith('/oidc/interaction/')).toBeTruthy()
    expectCookieKeys(res1.cookie, ['keystone.sid', '_interaction', '_interaction.sig', '_interaction_resume', '_interaction_resume.sig'])

    const res2 = await request(`${c.serverUrl}${res1.headers.location}`, res1.cookie)
    expect(res2.status).toBe(303)
    expect(res2.headers.location.startsWith(`${c.serverUrl}/oidc/auth/`)).toBeTruthy()
    expectCookieKeys(res2.cookie, ['keystone.sid', '_interaction', '_interaction.sig', '_interaction_resume', '_interaction_resume.sig'])

    const res3 = await request(res2.headers.location, res2.cookie)
    expect(res3.status).toBe(303)
    expect(res3.headers.location.startsWith(`${uri}#code`)).toBeTruthy()
    expectCookieKeys(res3.cookie, ['keystone.sid', '_interaction', '_interaction.sig', '_interaction_resume', '_interaction_resume.sig', '_session', '_session.sig', '_session.legacy', '_session.legacy.sig'])

    // 3) callback to server side ( callback with code to oidc app site; server get the access and cann use it )

    const params = serverSideOidcClient.callbackParams(res3.headers.location.replace(`${uri}#`, `${uri}?`))
    const tokenSet = await serverSideOidcClient.callback(uri, { code: params.code }, { nonce })
    expect(tokenSet.access_token).toHaveLength(43) // important to be 43!
    expect(tokenSet.id_token.length > 10).toBeTruthy()

    // 4) check requests by accessToken to /oidc/userinfo

    const userinfo = await serverSideOidcClient.userinfo(tokenSet.access_token)
    expect(userinfo).toEqual({ 'sub': c.user.id })
    expect(await getAccessToken(tokenSet.access_token)).toMatchObject({
        'accountId': c.user.id,
        'clientId': clientId,
        'expiresWithSession': true,
        'gty': 'authorization_code',
        'kind': 'AccessToken',
        'scope': 'openid',
    })

    // 5) check requests by accessToken to /admin/api

    await expectToGetAuthenticatedUser(`${c.serverUrl}/admin/api`, null)
    await expectToGetAuthenticatedUser(
        `${c.serverUrl}/admin/api`,
        { id: c.user.id, name: c.user.name },
        { 'Authorization': `Bearer ${tokenSet.access_token}` },
    )
})
