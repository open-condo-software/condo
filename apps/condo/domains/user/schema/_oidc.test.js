const { faker } = require('@faker-js/faker')
const { default: axios } = require('axios')
const dayjs = require('dayjs')
const jwtDecode = require('jwt-decode')
const { Issuer, generators } = require('openid-client')

const { fetch } = require('@open-condo/keystone/fetch')
const {
    createAxiosClientWithCookie, getRandomString, makeLoggedInAdminClient, catchErrorFrom,
} = require('@open-condo/keystone/test.utils')

const {
    makeClientWithNewRegisteredAndLoggedInUser,
    createTestOidcClient,
    updateTestOidcClient,
} = require('@condo/domains/user/utils/testSchema')

const { createAdapterClass } = require('../oidc/adapter')

async function getAccessToken (accessToken, context = null) {
    const AdapterClass = createAdapterClass(context)
    const clients = new AdapterClass('AccessToken')
    return await clients.find(accessToken)
}

async function request (url, cookie, maxRedirects = 0) {
    const client = createAxiosClientWithCookie({ maxRedirects }, cookie, url)
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

async function expectToGetUnauthenticatedUser (url, headers) {
    const result = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ 'operationName': null, 'variables': {}, 'query': '{ authenticatedUser { id name } }' }),
        headers: { 'Content-Type': 'application/json', ...headers },
    })

    expect(result.status).toBe(401)
    expect(result.statusText).toBe('Unauthorized')
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

describe('OIDC', () => {
    describe('OIDCClient logic tests', () => {
        test('Soft-deleted OIDCClient must not be used for authorization', async () => {
            const uri = 'https://jwt.io/'
            const clientId = getRandomString()
            const clientSecret = getRandomString()
            const admin = await makeLoggedInAdminClient()

            const [oidcClient] = await createTestOidcClient(admin, {
                payload: {
                    // application_type, client_id, client_name, client_secret, client_uri, contacts, default_acr_values, default_max_age, grant_types, id_token_signed_response_alg, initiate_login_uri, jwks, jwks_uri, logo_uri, policy_uri, post_logout_redirect_uris, redirect_uris, require_auth_time, response_types, scope, sector_identifier_uri, subject_type, token_endpoint_auth_method, tos_uri, userinfo_signed_response_alg
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uris: [uri], // using uri as redirect_uri to show the ID Token contents
                    response_types: ['code id_token', 'code', 'id_token'],
                    grant_types: ['implicit', 'authorization_code', 'refresh_token'], // 'implicit', 'authorization_code', 'refresh_token', or 'urn:ietf:params:oauth:grant-type:device_code'
                    token_endpoint_auth_method: 'client_secret_basic',
                },
            })
            const [deletedClient] = await updateTestOidcClient(admin, oidcClient.id, { deletedAt: dayjs().toISOString() })
            expect(deletedClient).toHaveProperty('deletedAt')
            expect(deletedClient.deletedAt).not.toBeNull()

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
            const url = new URL(serverSideOidcClient.authorizationUrl({ nonce }))
            const oidcAuthUrl = `${c.serverUrl}${url.pathname}${url.search}`

            // 2) client side ( open oidcAuthUrl )
            await catchErrorFrom(async () => {
                await request(oidcAuthUrl, c.getCookie())
            }, (error) => {
                expect(error).toHaveProperty('message', 'Request failed with status code 500')
                expect(error).toHaveProperty(['request', 'res', 'statusCode'], 500)
            })
        })
        test('OIDCClient with "isEnabled: false" must not be used for authorization', async () => {
            const uri = 'https://jwt.io/'
            const clientId = getRandomString()
            const clientSecret = getRandomString()
            const admin = await makeLoggedInAdminClient()

            await createTestOidcClient(admin, {
                isEnabled: false,
                payload: {
                    // application_type, client_id, client_name, client_secret, client_uri, contacts, default_acr_values, default_max_age, grant_types, id_token_signed_response_alg, initiate_login_uri, jwks, jwks_uri, logo_uri, policy_uri, post_logout_redirect_uris, redirect_uris, require_auth_time, response_types, scope, sector_identifier_uri, subject_type, token_endpoint_auth_method, tos_uri, userinfo_signed_response_alg
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uris: [uri], // using uri as redirect_uri to show the ID Token contents
                    response_types: ['code id_token', 'code', 'id_token'],
                    grant_types: ['implicit', 'authorization_code', 'refresh_token'], // 'implicit', 'authorization_code', 'refresh_token', or 'urn:ietf:params:oauth:grant-type:device_code'
                    token_endpoint_auth_method: 'client_secret_basic',
                },
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
            const url = new URL(serverSideOidcClient.authorizationUrl({ nonce }))
            const oidcAuthUrl = `${c.serverUrl}${url.pathname}${url.search}`

            // 2) client side ( open oidcAuthUrl )
            await catchErrorFrom(async () => {
                await request(oidcAuthUrl, c.getCookie())
            }, (error) => {
                expect(error).toHaveProperty('message', 'Request failed with status code 500')
                expect(error).toHaveProperty(['request', 'res', 'statusCode'], 500)
            })
        })
    })
    describe('Real-life cases', () => {

        test('case: code + id_token with refresh (code flow)', async () => {
            const uri = 'https://jwt.io/'
            const clientId = getRandomString()
            const clientSecret = getRandomString()
            const admin = await makeLoggedInAdminClient()

            await createTestOidcClient(admin, {
                payload: {
                // application_type, client_id, client_name, client_secret, client_uri, contacts, default_acr_values, default_max_age, grant_types, id_token_signed_response_alg, initiate_login_uri, jwks, jwks_uri, logo_uri, policy_uri, post_logout_redirect_uris, redirect_uris, require_auth_time, response_types, scope, sector_identifier_uri, subject_type, token_endpoint_auth_method, tos_uri, userinfo_signed_response_alg
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uris: [uri], // using uri as redirect_uri to show the ID Token contents
                    response_types: ['code id_token', 'code', 'id_token'],
                    grant_types: ['implicit', 'authorization_code', 'refresh_token'], // 'implicit', 'authorization_code', 'refresh_token', or 'urn:ietf:params:oauth:grant-type:device_code'
                    token_endpoint_auth_method: 'client_secret_basic',
                },
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
            const url = new URL(serverSideOidcClient.authorizationUrl({ nonce }))
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
            expectCookieKeys(res3.cookie, ['keystone.sid', '_interaction', '_interaction.sig', '_interaction_resume', '_interaction_resume.sig', '_session', '_session.sig'])

            // 3) callback to server side ( callback with code to oidc app site; server get the access and cann use it )

            const params = serverSideOidcClient.callbackParams(res3.headers.location.replace(`${uri}#`, `${uri}?`))
            const tokenSet = await serverSideOidcClient.callback(uri, { code: params.code }, { nonce })
            expect(tokenSet.access_token).toHaveLength(43) // important to be 43!
            expect(tokenSet.id_token.length > 10).toBeTruthy()

            // 4) check requests by accessToken to /oidc/userinfo

            const userinfo = await serverSideOidcClient.userinfo(tokenSet.access_token)
            expect(userinfo).toEqual({
                'sub': c.user.id,
                'type': 'staff',
                'v': 1,
                'dv': 1,
                'isAdmin': false,
                'isSupport': false,
                'name': c.user.name,
            })
            expect(await getAccessToken(tokenSet.access_token, c)).toMatchObject({
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

            // 6) check code 401 when token expired

            const someWrongToken = faker.random.alpha({
                count: 43,
            })
            await expectToGetUnauthenticatedUser(
                `${c.serverUrl}/admin/api`,
                {
                    authorization: `Bearer ${someWrongToken}`,
                },
            )

            // 7) using of refresh token to get new access token

            const newTokenSet = await serverSideOidcClient.refresh(tokenSet)
            expect(newTokenSet.access_token).not.toBe(tokenSet.access_token)
            expect(newTokenSet.expires_at).toBeGreaterThanOrEqual(tokenSet.expires_at)
        })

        test('case: code without refresh (code flow)', async () => {
            const uri = 'https://jwt.io/'
            const clientId = getRandomString()
            const clientSecret = getRandomString()
            const admin = await makeLoggedInAdminClient()

            await createTestOidcClient(admin, {
                payload: {
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uris: [uri],
                    response_types: ['code'],
                    grant_types: ['authorization_code'],
                    token_endpoint_auth_method: 'client_secret_basic',
                },
            })

            const c = await makeClientWithNewRegisteredAndLoggedInUser()
            expectCookieKeys(c.getCookie(), ['keystone.sid'])

            // 1) server side ( create oidc client and prepare oidcAuthUrl )

            const oidcIssuer = await Issuer.discover(`${c.serverUrl}/oidc`)
            const serverSideOidcClient = new oidcIssuer.Client({
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uris: [uri], // using uri as redirect_uri to show the ID Token contents
                response_types: ['code'],
                token_endpoint_auth_method: 'client_secret_basic',
            })

            const nonce = generators.nonce()
            const url = new URL(serverSideOidcClient.authorizationUrl({ nonce }))
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
            expect(res3.headers.location).toContain(`${uri}?code=`)
            expectCookieKeys(res3.cookie, ['keystone.sid', '_interaction', '_interaction.sig', '_interaction_resume', '_interaction_resume.sig', '_session', '_session.sig'])

            // 3) callback to server side ( callback with code to oidc app site; server get the access and cann use it )

            const params = serverSideOidcClient.callbackParams(res3.headers.location)
            expect(new Set(Object.keys(params))).toEqual(new Set(['code']))
            const tokenSet = await serverSideOidcClient.callback(uri, { code: params.code }, { nonce })
            expect(tokenSet.access_token).toHaveLength(43) // important to be 43!
            expect(tokenSet.id_token.length > 10).toBeTruthy()

            // 4) check requests by accessToken to /oidc/userinfo

            const userinfo = await serverSideOidcClient.userinfo(tokenSet.access_token)
            expect(userinfo).toEqual({
                'sub': c.user.id,
                'type': 'staff',
                'v': 1,
                'dv': 1,
                'isAdmin': false,
                'isSupport': false,
                'name': c.user.name,
            })
            expect(await getAccessToken(tokenSet.access_token, c)).toMatchObject({
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

            // 7) no refresh token
            await expect(serverSideOidcClient.refresh(tokenSet)).rejects.toThrow('refresh_token not present in TokenSet')
        })

        test('case: token (implicit flow)', async () => {
            const uri = 'https://jwt.io/'
            const clientId = getRandomString()
            const clientSecret = getRandomString()
            const admin = await makeLoggedInAdminClient()

            await createTestOidcClient(admin, {
                payload: {
                // application_type, client_id, client_name, client_secret, client_uri, contacts, default_acr_values, default_max_age, grant_types, id_token_signed_response_alg, initiate_login_uri, jwks, jwks_uri, logo_uri, policy_uri, post_logout_redirect_uris, redirect_uris, require_auth_time, response_types, scope, sector_identifier_uri, subject_type, token_endpoint_auth_method, tos_uri, userinfo_signed_response_alg
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uris: [uri], // using uri as redirect_uri to show the ID Token contents
                    response_types: ['id_token token'],
                    grant_types: ['implicit'], // 'implicit', 'authorization_code', 'refresh_token', or 'urn:ietf:params:oauth:grant-type:device_code'
                    token_endpoint_auth_method: 'client_secret_basic',
                },
            })

            const c = await makeClientWithNewRegisteredAndLoggedInUser()
            expectCookieKeys(c.getCookie(), ['keystone.sid'])

            // 1) server side ( create oidc client and prepare oidcAuthUrl )

            const oidcIssuer = await Issuer.discover(`${c.serverUrl}/oidc`)
            const serverSideOidcClient = new oidcIssuer.Client({
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uris: [uri], // using uri as redirect_uri to show the ID Token contents
                response_types: ['id_token token'],
                token_endpoint_auth_method: 'client_secret_basic',
            })

            const nonce = generators.nonce()
            const url = new URL(serverSideOidcClient.authorizationUrl({ nonce }))
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
            console.log(res3.headers.location)
            expect(res3.headers.location.startsWith(`${uri}#`)).toBeTruthy()
            expectCookieKeys(res3.cookie, ['keystone.sid', '_interaction', '_interaction.sig', '_interaction_resume', '_interaction_resume.sig', '_session', '_session.sig'])

            // 3) callback to server side ( callback with code to oidc app site; server get the access and cann use it )

            const params = serverSideOidcClient.callbackParams(res3.headers.location.replace(`${uri}#`, `${uri}?`))
            expect(new Set(Object.keys(params))).toEqual(new Set(['access_token', 'id_token', 'expires_in', 'token_type']))
            expect(params.access_token).toHaveLength(43) // important to be 43!
            expect(params.token_type).toEqual('Bearer')
            expect(params.id_token.length > 10).toBeTruthy()

            // 4) check requests by accessToken to /oidc/userinfo

            const userinfo = await serverSideOidcClient.userinfo(params.access_token)
            expect(userinfo).toEqual({
                'sub': c.user.id,
                'type': 'staff',
                'v': 1,
                'dv': 1,
                'isAdmin': false,
                'isSupport': false,
                'name': c.user.name,
            })
            expect(await getAccessToken(params.access_token, c)).toMatchObject({
                'accountId': c.user.id,
                'clientId': clientId,
                'expiresWithSession': true,
                'gty': 'implicit',
                'kind': 'AccessToken',
                'scope': 'openid',
            })

            // 5) check requests by accessToken to /admin/api

            await expectToGetAuthenticatedUser(`${c.serverUrl}/admin/api`, null)
            await expectToGetAuthenticatedUser(
                `${c.serverUrl}/admin/api`,
                { id: c.user.id, name: c.user.name },
                { 'Authorization': `Bearer ${params.access_token}` },
            )

            // 6) using of refresh token to throw error
            await expect(serverSideOidcClient.refresh(params.access_token)).rejects.toThrow('unauthorized_client (requested grant type is not allowed for this client)')
        })

        test('case: code flow with response_type for implicit flow', async () => {
            const uri = 'https://jwt.io/'
            const clientId = getRandomString()
            const clientSecret = getRandomString()
            const admin = await makeLoggedInAdminClient()

            await createTestOidcClient(admin, {
                payload: {
                // application_type, client_id, client_name, client_secret, client_uri, contacts, default_acr_values, default_max_age, grant_types, id_token_signed_response_alg, initiate_login_uri, jwks, jwks_uri, logo_uri, policy_uri, post_logout_redirect_uris, redirect_uris, require_auth_time, response_types, scope, sector_identifier_uri, subject_type, token_endpoint_auth_method, tos_uri, userinfo_signed_response_alg
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uris: [uri], // using uri as redirect_uri to show the ID Token contents
                    response_types: ['code id_token', 'code', 'id_token'],
                    grant_types: ['implicit', 'authorization_code', 'refresh_token'], // 'implicit', 'authorization_code', 'refresh_token', or 'urn:ietf:params:oauth:grant-type:device_code'
                    token_endpoint_auth_method: 'client_secret_basic',
                },
            })

            const c = await makeClientWithNewRegisteredAndLoggedInUser()
            expectCookieKeys(c.getCookie(), ['keystone.sid'])

            // 1) server side ( create oidc client and prepare oidcAuthUrl )

            const oidcIssuer = await Issuer.discover(`${c.serverUrl}/oidc`)
            const serverSideOidcClient = new oidcIssuer.Client({
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uris: [uri], // using uri as redirect_uri to show the ID Token contents
                response_types: ['id_token token'],
                token_endpoint_auth_method: 'client_secret_basic',
            })

            const nonce = generators.nonce()
            const url = new URL(serverSideOidcClient.authorizationUrl({ nonce }))
            const oidcAuthUrl = `${c.serverUrl}${url.pathname}${url.search}`

            // 2) client side ( open oidcAuthUrl )

            const res1 = await request(oidcAuthUrl, c.getCookie())
            console.log(res1)
            expect(res1.status).toBe(303)
            expect(res1.headers.location.startsWith(`${uri}#error`)).toBeTruthy()
            expect(res1.headers.location).toContain('error_description=requested%20response_type%20is%20not%20allowed%20for%20this%20client')
            expectCookieKeys(res1.cookie, ['keystone.sid'])
        })

        test('miniapp server side oidc client logic (code flow)', async () => {
            const c = await makeClientWithNewRegisteredAndLoggedInUser()
            const admin = await makeLoggedInAdminClient()

            const uri = 'https://jwt.io/'
            const clientId = getRandomString()
            const clientSecret = getRandomString()

            await createTestOidcClient(admin, {
                payload: {
                // application_type, client_id, client_name, client_secret, client_uri, contacts, default_acr_values, default_max_age, grant_types, id_token_signed_response_alg, initiate_login_uri, jwks, jwks_uri, logo_uri, policy_uri, post_logout_redirect_uris, redirect_uris, require_auth_time, response_types, scope, sector_identifier_uri, subject_type, token_endpoint_auth_method, tos_uri, userinfo_signed_response_alg
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uris: [uri], // using uri as redirect_uri to show the ID Token contents
                    response_types: ['code id_token', 'code', 'id_token'],
                    grant_types: ['implicit', 'authorization_code', 'refresh_token'], // 'implicit', 'authorization_code', 'refresh_token', or 'urn:ietf:params:oauth:grant-type:device_code'
                    token_endpoint_auth_method: 'client_secret_basic',
                },
            })

            const serverUrl = c.serverUrl
            const issuer = new Issuer({
                authorization_endpoint: `${serverUrl}/oidc/auth`,
                token_endpoint: `${serverUrl}/oidc/token`,
                end_session_endpoint: `${serverUrl}/oidc/session/end`,
                jwks_uri: `${serverUrl}/oidc/jwks`,
                revocation_endpoint: `${serverUrl}/oidc/token/revocation`,
                userinfo_endpoint: `${serverUrl}/oidc/me`,
                issuer: serverUrl,
            })
            const client = new issuer.Client({
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uris: [uri], // using uri as redirect_uri to show the ID Token contents
                response_types: ['code'],
                token_endpoint_auth_method: 'client_secret_basic',
            })
            const _validateJWT = client.validateJWT
            client.validateJWT = async (jwt, expectedAlg, required) => {
                try {
                    await _validateJWT.call(client, jwt, expectedAlg, required)
                } catch (error) {
                    console.error({ message: error.message, jwt, error })
                }
                return { protected: jwtDecode(jwt, { header: true }), payload: jwtDecode(jwt) }
            }

            const checks = { nonce: generators.nonce(), state: generators.state() }
            const redirectUrl = client.authorizationUrl({
                response_type: 'code',
                ...checks,
            })

            console.log(redirectUrl)
            const res1 = await request(redirectUrl, c.getCookie(), 100)
            expect(res1.status).toEqual(200)

            console.log(res1.url)
            const params = client.callbackParams(res1.url)
            const tokenSet = await client.callback(uri, { code: params.code }, { nonce: checks.nonce })
            expect(tokenSet.access_token).toBeTruthy()
        })
    })
})
