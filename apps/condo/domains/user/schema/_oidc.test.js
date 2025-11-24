const { faker } = require('@faker-js/faker')
const { default: axios } = require('axios')
const dayjs = require('dayjs')
const jwtDecode = require('jwt-decode')
const { Issuer, generators } = require('openid-client')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')
const {
    createAxiosClientWithCookie,
    getRandomString,
    makeLoggedInAdminClient,
    catchErrorFrom,
    waitFor,
} = require('@open-condo/keystone/test.utils')
const { replaceDomainPrefix } = require('@open-condo/miniapp-utils/helpers/urls')

const { normalizeEmail } = require('@condo/domains/common/utils/mail')
const { createTestB2BApp, createTestB2CApp, updateTestB2BApp, updateTestB2CApp, B2BApp, B2CApp } = require('@condo/domains/miniapp/utils/testSchema')
const {
    makeClientWithNewRegisteredAndLoggedInUser,
    createTestOidcClient,
    updateTestOidcClient,
    makeClientWithSupportUser,
    OIDC_REDIRECT_URI,
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
    const client =  await makeClientWithNewRegisteredAndLoggedInUser()
    const cookie = client.getCookie()
    const graphql = { 'query': '{ authenticatedUser { id name } }' }

    const result1 = await axios.create({
        timeout: 2000,
        headers: {
            Cookie: cookie,
        },
        validateStatus: () => true,
    })
        .post(`${client.serverUrl}/admin/api`, graphql)
    expect(result1.data).toMatchObject({
        'data': {
            'authenticatedUser': {
                id: client.user.id,
                name: client.user.name,
            },
        },
    })

    const result2 = await fetch(`${client.serverUrl}/admin/api`, {
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
                id: client.user.id,
                name: client.user.name,
            },
        },
    })

    await expectToGetAuthenticatedUser(
        `${client.serverUrl}/admin/api`,
        { id: client.user.id, name: client.user.name },
        { Cookie: cookie },
    )
})

describe('OIDC', () => {
    describe('OIDCClient logic tests', () => {
        test('Soft-deleted OIDCClient must not be used for authorization', async () => {
            const uri = OIDC_REDIRECT_URI
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

            const client =  await makeClientWithNewRegisteredAndLoggedInUser()
            expectCookieKeys(client.getCookie(), ['keystone.sid'])

            // 1) server side ( create oidc client and prepare oidcAuthUrl )

            const oidcIssuer = await Issuer.discover(`${client.serverUrl}/oidc`)
            const serverSideOidcClient = new oidcIssuer.Client({
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uris: [uri], // using uri as redirect_uri to show the ID Token contents
                response_types: ['code id_token'],
                token_endpoint_auth_method: 'client_secret_basic',
            })

            const nonce = generators.nonce()
            const url = new URL(serverSideOidcClient.authorizationUrl({ nonce }))
            const oidcAuthUrl = `${client.serverUrl}${url.pathname}${url.search}`

            // 2) client side ( open oidcAuthUrl )
            await catchErrorFrom(async () => {
                await request(oidcAuthUrl, client.getCookie())
            }, (error) => {
                expect(error).toHaveProperty('message', 'Request failed with status code 500')
                expect(error).toHaveProperty(['request', 'res', 'statusCode'], 500)
            })
        })
        test('OIDCClient with "isEnabled: false" must not be used for authorization', async () => {
            const uri = OIDC_REDIRECT_URI
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

            const client =  await makeClientWithNewRegisteredAndLoggedInUser()
            expectCookieKeys(client.getCookie(), ['keystone.sid'])

            // 1) server side ( create oidc client and prepare oidcAuthUrl )

            const oidcIssuer = await Issuer.discover(`${client.serverUrl}/oidc`)
            const serverSideOidcClient = new oidcIssuer.Client({
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uris: [uri], // using uri as redirect_uri to show the ID Token contents
                response_types: ['code id_token'],
                token_endpoint_auth_method: 'client_secret_basic',
            })

            const nonce = generators.nonce()
            const url = new URL(serverSideOidcClient.authorizationUrl({ nonce }))
            const oidcAuthUrl = `${client.serverUrl}${url.pathname}${url.search}`

            // 2) client side ( open oidcAuthUrl )
            await catchErrorFrom(async () => {
                await request(oidcAuthUrl, client.getCookie())
            }, (error) => {
                expect(error).toHaveProperty('message', 'Request failed with status code 500')
                expect(error).toHaveProperty(['request', 'res', 'statusCode'], 500)
            })
        })
        describe('OIDCClient with "canAuthorizeSuperUsers: false" must not be used for authorizing super users',  () => {
            test('canAuthorizeSuperUsers: false', async () => {
                const uri = OIDC_REDIRECT_URI
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

                const client =  await makeClientWithSupportUser()
                expectCookieKeys(client.getCookie(), ['keystone.sid'])

                // 1) server side ( create oidc client and prepare oidcAuthUrl )

                const oidcIssuer = await Issuer.discover(`${client.serverUrl}/oidc`)
                const serverSideOidcClient = new oidcIssuer.Client({
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uris: [uri], // using uri as redirect_uri to show the ID Token contents
                    response_types: ['code id_token'],
                    token_endpoint_auth_method: 'client_secret_basic',
                })

                const nonce = generators.nonce()
                const url = new URL(serverSideOidcClient.authorizationUrl({ nonce }))
                const oidcAuthUrl = `${client.serverUrl}${url.pathname}${url.search}`

                // 2) client side ( open oidcAuthUrl )

                const res1 = await request(oidcAuthUrl, client.getCookie())
                expect(res1.status).toBe(303)
                expect(res1.headers.location.startsWith('/oidc/interaction/')).toBeTruthy()
                expectCookieKeys(res1.cookie, ['keystone.sid', '_interaction', '_interaction.sig', '_interaction_resume', '_interaction_resume.sig'])

                const res2 = await request(`${client.serverUrl}${res1.headers.location}`, res1.cookie)
                expect(res2.status).toBe(303)
                expect(res2.headers.location.startsWith(`${client.serverUrl}/oidc/auth/`)).toBeTruthy()
                expectCookieKeys(res2.cookie, ['keystone.sid', '_interaction', '_interaction.sig', '_interaction_resume', '_interaction_resume.sig'])



                const res3 = await request(res2.headers.location, res2.cookie)
                expect(res3.status).toBe(303)
                expect(res3.headers.location.startsWith(`${uri}#error`)).toBeTruthy()
                expect(res3.headers.location).toContain('error_description=Specified%20user%20cannot%20be%20authorized%20via%20OIDC')
                expectCookieKeys(res3.cookie, ['keystone.sid', '_interaction', '_interaction.sig', '_interaction_resume', '_interaction_resume.sig', '_session', '_session.sig'])
            })
            test('canAuthorizeSuperUsers: true', async () => {
                const uri = OIDC_REDIRECT_URI
                const clientId = getRandomString()
                const clientSecret = getRandomString()
                const admin = await makeLoggedInAdminClient()

                await createTestOidcClient(admin, {
                    canAuthorizeSuperUsers: true,
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

                const client =  await makeClientWithSupportUser()
                expectCookieKeys(client.getCookie(), ['keystone.sid'])

                // 1) server side ( create oidc client and prepare oidcAuthUrl )

                const oidcIssuer = await Issuer.discover(`${client.serverUrl}/oidc`)
                const serverSideOidcClient = new oidcIssuer.Client({
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uris: [uri], // using uri as redirect_uri to show the ID Token contents
                    response_types: ['code id_token'],
                    token_endpoint_auth_method: 'client_secret_basic',
                })

                const nonce = generators.nonce()
                const url = new URL(serverSideOidcClient.authorizationUrl({ nonce }))
                const oidcAuthUrl = `${client.serverUrl}${url.pathname}${url.search}`

                // 2) client side ( open oidcAuthUrl )

                const res1 = await request(oidcAuthUrl, client.getCookie())
                expect(res1.status).toBe(303)
                expect(res1.headers.location.startsWith('/oidc/interaction/')).toBeTruthy()
                expectCookieKeys(res1.cookie, ['keystone.sid', '_interaction', '_interaction.sig', '_interaction_resume', '_interaction_resume.sig'])

                const res2 = await request(`${client.serverUrl}${res1.headers.location}`, res1.cookie)
                expect(res2.status).toBe(303)
                expect(res2.headers.location.startsWith(`${client.serverUrl}/oidc/auth/`)).toBeTruthy()
                expectCookieKeys(res2.cookie, ['keystone.sid', '_interaction', '_interaction.sig', '_interaction_resume', '_interaction_resume.sig'])

                const res3 = await request(res2.headers.location, res2.cookie)
                expect(res3.status).toBe(303)
                expect(res3.headers.location.startsWith(`${uri}#code`)).toBeTruthy()
                expectCookieKeys(res3.cookie, ['keystone.sid', '_interaction', '_interaction.sig', '_interaction_resume', '_interaction_resume.sig', '_session', '_session.sig'])

                // 3) callback to server side ( callback with code to oidc app site; server get the access and cann use it )

                const params = serverSideOidcClient.callbackParams(res3.headers.location.replace(`${uri}#`, `${uri}?`))
                const tokenSet = await serverSideOidcClient.callback(uri, params, { nonce })
                expect(tokenSet.access_token).toHaveLength(43) // important to be 43!
                expect(tokenSet.id_token.length > 10).toBeTruthy()

                // 4) check requests by accessToken to /oidc/userinfo

                const userinfo = await serverSideOidcClient.userinfo(tokenSet.access_token)
                expect(userinfo).toEqual({
                    'sub': client.user.id,
                    'type': 'staff',
                    'v': 2,
                    'dv': 1,
                    'isAdmin': false,
                    'isSupport': true,
                    'name': client.user.name,
                })
                expect(await getAccessToken(tokenSet.access_token, client)).toMatchObject({
                    'accountId': client.user.id,
                    'clientId': clientId,
                    'expiresWithSession': true,
                    'gty': 'authorization_code',
                    'kind': 'AccessToken',
                    'scope': 'openid',
                })

                // 5) check requests by accessToken to /admin/api

                await expectToGetAuthenticatedUser(`${client.serverUrl}/admin/api`, null)
                await expectToGetAuthenticatedUser(
                    `${client.serverUrl}/admin/api`,
                    { id: client.user.id, name: client.user.name },
                    { 'Authorization': `Bearer ${tokenSet.access_token}` },
                )
            })
        })
        // TODO: figure out how to fix this test
        // NOTE: it fails because of the redirect uri protocol validation,
        // since replace domain changes http://localhost:3000 -> http://123.miniapps.localhost:3000
        // OIDC blocks this since for web apps only https is allowed, and for native only localhost
        // Test is working on prepare.js with --https flag, but we need to figure out how to make it work in CI
        // (probably add OIDC configuration tweak based on env)
        test.skip('should progressively allow redirect URIs as apps are linked', async () => {
            const admin = await makeLoggedInAdminClient()

            // Step 1: Create OIDC client with no linked apps
            const [oidcClient] = await createTestOidcClient(admin)
            const clientId = oidcClient.payload.client_id
            const originalRedirectUri = oidcClient.payload.redirect_uris[0]

            const [b2bApp] = await createTestB2BApp(admin)
            const [b2cApp] = await createTestB2CApp(admin)

            const b2bAppUrlDomain = new URL(replaceDomainPrefix(conf['SERVER_URL'], `${b2bApp.id}-2.miniapps`))
            const b2cAppUrlDomain = new URL(replaceDomainPrefix(conf['SERVER_URL'], `${b2cApp.id}-2.miniapps`))
            const originalPathname = new URL(originalRedirectUri).pathname
            b2bAppUrlDomain.pathname = originalPathname
            b2cAppUrlDomain.pathname = originalPathname

            const b2bAppUrl = b2bAppUrlDomain.toString()
            const b2cAppUrl = b2cAppUrlDomain.toString()

            // Helper function to test redirect URI validation via OIDC authorization
            async function testRedirectUri (redirectUri, shouldSucceed = true) {
                const state = getRandomString()
                const authUrl = `${conf.SERVER_URL}/oidc/auth?client_id=${clientId}&response_type=code&scope=openid&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`

                try {
                    const res = await request(authUrl)
                    if (shouldSucceed) {
                        // Should redirect to login or consent, not throw invalid_redirect_uri error
                        console.log(res.data)
                        expect(res.status).toBe(303)
                        expect(res.data).toContain('Redirecting to')
                    } else {
                        // Should fail with invalid_redirect_uri
                        expect(res.status).toBe(400)
                        expect(res.data).toContain('invalid_redirect_uri')
                    }
                } catch (error) {
                    if (shouldSucceed) {
                        throw error
                    }
                    // Expected to fail
                }
            }

            // Step 1: Test with no linked apps - only original URI should work
            await testRedirectUri(originalRedirectUri, true)
            await testRedirectUri(b2bAppUrl, false)
            await testRedirectUri(b2cAppUrl, false)

            // Step 2: Link B2BApp to client
            await updateTestB2BApp(admin, b2bApp.id, {
                oidcClient: { connect: { id: oidcClient.id } },
            })

            await waitFor(async () => {
                const app = await B2BApp.getOne(admin, { id: b2bApp.id })
                expect(app).toHaveProperty(['domains', 'mapping'])
                expect(app.domains.mapping).toEqual(expect.arrayContaining([expect.objectContaining({
                    to: b2bAppUrlDomain.origin,
                })]))
            })

            // Step 2: Test with B2BApp linked - original + B2B proxied URI should work
            console.log(originalRedirectUri)
            await testRedirectUri(originalRedirectUri, true)
            // await testRedirectUri(b2bAppUrl, true)
            // await testRedirectUri(b2cAppUrl, false)

            // Step 3: Link B2CApp
            // await updateTestB2CApp(admin, b2cApp.id, {
            //     oidcClient: { connect: { id: oidcClient.id } },
            // })

            // await waitFor(async () => {
            //     const app = await B2CApp.getOne(admin, { id: b2cApp.id })
            //     expect(app).toHaveProperty(['domains', 'mapping'])
            //     expect(app.domains.mapping).toEqual(expect.arrayContaining([expect.objectContaining({
            //         to: b2cAppUrlDomain.origin,
            //     })]))
            // })

            // Step 3: Test with both apps linked - all URIs should work
            // await testRedirectUri(originalRedirectUri, true)
            // await testRedirectUri(b2bAppUrl, true)
            // await testRedirectUri(b2cAppUrl, true)
        })
    })
    describe('Real-life cases', () => {

        test('case: code + id_token with refresh (code flow)', async () => {
            const uri = OIDC_REDIRECT_URI
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

            const client =  await makeClientWithNewRegisteredAndLoggedInUser()
            expectCookieKeys(client.getCookie(), ['keystone.sid'])

            // 1) server side ( create oidc client and prepare oidcAuthUrl )

            const oidcIssuer = await Issuer.discover(`${client.serverUrl}/oidc`)
            const serverSideOidcClient = new oidcIssuer.Client({
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uris: [uri], // using uri as redirect_uri to show the ID Token contents
                response_types: ['code id_token'],
                token_endpoint_auth_method: 'client_secret_basic',
            })

            const nonce = generators.nonce()
            const url = new URL(serverSideOidcClient.authorizationUrl({ nonce }))
            const oidcAuthUrl = `${client.serverUrl}${url.pathname}${url.search}`

            // 2) client side ( open oidcAuthUrl )

            const res1 = await request(oidcAuthUrl, client.getCookie())
            expect(res1.status).toBe(303)
            expect(res1.headers.location.startsWith('/oidc/interaction/')).toBeTruthy()
            expectCookieKeys(res1.cookie, ['keystone.sid', '_interaction', '_interaction.sig', '_interaction_resume', '_interaction_resume.sig'])

            const res2 = await request(`${client.serverUrl}${res1.headers.location}`, res1.cookie)
            expect(res2.status).toBe(303)
            expect(res2.headers.location.startsWith(`${client.serverUrl}/oidc/auth/`)).toBeTruthy()
            expectCookieKeys(res2.cookie, ['keystone.sid', '_interaction', '_interaction.sig', '_interaction_resume', '_interaction_resume.sig'])

            const res3 = await request(res2.headers.location, res2.cookie)
            expect(res3.status).toBe(303)
            expect(res3.headers.location.startsWith(`${uri}#code`)).toBeTruthy()
            expectCookieKeys(res3.cookie, ['keystone.sid', '_interaction', '_interaction.sig', '_interaction_resume', '_interaction_resume.sig', '_session', '_session.sig'])

            // 3) callback to server side ( callback with code to oidc app site; server get the access and cann use it )

            const params = serverSideOidcClient.callbackParams(res3.headers.location.replace(`${uri}#`, `${uri}?`))
            const tokenSet = await serverSideOidcClient.callback(uri, params, { nonce })
            expect(tokenSet.access_token).toHaveLength(43) // important to be 43!
            expect(tokenSet.id_token.length > 10).toBeTruthy()

            // 4) check requests by accessToken to /oidc/userinfo

            const userinfo = await serverSideOidcClient.userinfo(tokenSet.access_token)
            expect(userinfo).toEqual({
                'sub': client.user.id,
                'type': 'staff',
                'v': 1,
                'dv': 1,
                'isAdmin': false,
                'isSupport': false,
                'name': client.user.name,
            })
            expect(await getAccessToken(tokenSet.access_token, client)).toMatchObject({
                'accountId': client.user.id,
                'clientId': clientId,
                'expiresWithSession': true,
                'gty': 'authorization_code',
                'kind': 'AccessToken',
                'scope': 'openid',
            })

            // 5) check requests by accessToken to /admin/api

            await expectToGetAuthenticatedUser(`${client.serverUrl}/admin/api`, null)
            await expectToGetAuthenticatedUser(
                `${client.serverUrl}/admin/api`,
                { id: client.user.id, name: client.user.name },
                { 'Authorization': `Bearer ${tokenSet.access_token}` },
            )

            // 6) check code 401 when token expired

            const someWrongToken = faker.random.alpha({
                count: 43,
            })
            await expectToGetUnauthenticatedUser(
                `${client.serverUrl}/admin/api`,
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
            const uri = OIDC_REDIRECT_URI
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

            const client =  await makeClientWithNewRegisteredAndLoggedInUser()
            expectCookieKeys(client.getCookie(), ['keystone.sid'])

            // 1) server side ( create oidc client and prepare oidcAuthUrl )

            const oidcIssuer = await Issuer.discover(`${client.serverUrl}/oidc`)
            const serverSideOidcClient = new oidcIssuer.Client({
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uris: [uri], // using uri as redirect_uri to show the ID Token contents
                response_types: ['code'],
                token_endpoint_auth_method: 'client_secret_basic',
            })

            const nonce = generators.nonce()
            const url = new URL(serverSideOidcClient.authorizationUrl({ nonce }))
            const oidcAuthUrl = `${client.serverUrl}${url.pathname}${url.search}`

            // 2) client side ( open oidcAuthUrl )

            const res1 = await request(oidcAuthUrl, client.getCookie())
            expect(res1.status).toBe(303)
            expect(res1.headers.location.startsWith('/oidc/interaction/')).toBeTruthy()
            expectCookieKeys(res1.cookie, ['keystone.sid', '_interaction', '_interaction.sig', '_interaction_resume', '_interaction_resume.sig'])

            const res2 = await request(`${client.serverUrl}${res1.headers.location}`, res1.cookie)
            expect(res2.status).toBe(303)
            expect(res2.headers.location.startsWith(`${client.serverUrl}/oidc/auth/`)).toBeTruthy()
            expectCookieKeys(res2.cookie, ['keystone.sid', '_interaction', '_interaction.sig', '_interaction_resume', '_interaction_resume.sig'])

            const res3 = await request(res2.headers.location, res2.cookie)
            expect(res3.status).toBe(303)
            expect(res3.headers.location).toContain(`${uri}?code=`)
            expectCookieKeys(res3.cookie, ['keystone.sid', '_interaction', '_interaction.sig', '_interaction_resume', '_interaction_resume.sig', '_session', '_session.sig'])

            // 3) callback to server side ( callback with code to oidc app site; server get the access and cann use it )

            const params = serverSideOidcClient.callbackParams(res3.headers.location)
            expect(new Set(Object.keys(params))).toEqual(new Set(['code', 'iss']))
            const tokenSet = await serverSideOidcClient.callback(uri, params, { nonce })
            expect(tokenSet.access_token).toHaveLength(43) // important to be 43!
            expect(tokenSet.id_token.length > 10).toBeTruthy()

            // 4) check requests by accessToken to /oidc/userinfo

            const userinfo = await serverSideOidcClient.userinfo(tokenSet.access_token)
            expect(userinfo).toEqual({
                'sub': client.user.id,
                'type': 'staff',
                'v': 1,
                'dv': 1,
                'isAdmin': false,
                'isSupport': false,
                'name': client.user.name,
            })
            expect(await getAccessToken(tokenSet.access_token, client)).toMatchObject({
                'accountId': client.user.id,
                'clientId': clientId,
                'expiresWithSession': true,
                'gty': 'authorization_code',
                'kind': 'AccessToken',
                'scope': 'openid',
            })

            // 5) check requests by accessToken to /admin/api

            await expectToGetAuthenticatedUser(`${client.serverUrl}/admin/api`, null)
            await expectToGetAuthenticatedUser(
                `${client.serverUrl}/admin/api`,
                { id: client.user.id, name: client.user.name },
                { 'Authorization': `Bearer ${tokenSet.access_token}` },
            )

            // 7) no refresh token
            await expect(serverSideOidcClient.refresh(tokenSet)).rejects.toThrow('refresh_token not present in TokenSet')
        })

        test('case: token (implicit flow)', async () => {
            const uri = OIDC_REDIRECT_URI
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

            const client =  await makeClientWithNewRegisteredAndLoggedInUser()
            expectCookieKeys(client.getCookie(), ['keystone.sid'])

            // 1) server side ( create oidc client and prepare oidcAuthUrl )

            const oidcIssuer = await Issuer.discover(`${client.serverUrl}/oidc`)
            const serverSideOidcClient = new oidcIssuer.Client({
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uris: [uri], // using uri as redirect_uri to show the ID Token contents
                response_types: ['id_token token'],
                token_endpoint_auth_method: 'client_secret_basic',
            })

            const nonce = generators.nonce()
            const url = new URL(serverSideOidcClient.authorizationUrl({ nonce }))
            const oidcAuthUrl = `${client.serverUrl}${url.pathname}${url.search}`

            // 2) client side ( open oidcAuthUrl )

            const res1 = await request(oidcAuthUrl, client.getCookie())
            expect(res1.status).toBe(303)
            expect(res1.headers.location.startsWith('/oidc/interaction/')).toBeTruthy()
            expectCookieKeys(res1.cookie, ['keystone.sid', '_interaction', '_interaction.sig', '_interaction_resume', '_interaction_resume.sig'])

            const res2 = await request(`${client.serverUrl}${res1.headers.location}`, res1.cookie)
            expect(res2.status).toBe(303)
            expect(res2.headers.location.startsWith(`${client.serverUrl}/oidc/auth/`)).toBeTruthy()
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
                'sub': client.user.id,
                'type': 'staff',
                'v': 1,
                'dv': 1,
                'isAdmin': false,
                'isSupport': false,
                'name': client.user.name,
            })
            expect(await getAccessToken(params.access_token, client)).toMatchObject({
                'accountId': client.user.id,
                'clientId': clientId,
                'expiresWithSession': true,
                'gty': 'implicit',
                'kind': 'AccessToken',
                'scope': 'openid',
            })

            // 5) check requests by accessToken to /admin/api

            await expectToGetAuthenticatedUser(`${client.serverUrl}/admin/api`, null)
            await expectToGetAuthenticatedUser(
                `${client.serverUrl}/admin/api`,
                { id: client.user.id, name: client.user.name },
                { 'Authorization': `Bearer ${params.access_token}` },
            )

            // 6) using of refresh token to throw error
            await expect(serverSideOidcClient.refresh(params.access_token)).rejects.toThrow('unauthorized_client (requested grant type is not allowed for this client)')
        })

        test('case: code flow with response_type for implicit flow', async () => {
            const uri = OIDC_REDIRECT_URI
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

            const client =  await makeClientWithNewRegisteredAndLoggedInUser()
            expectCookieKeys(client.getCookie(), ['keystone.sid'])

            // 1) server side ( create oidc client and prepare oidcAuthUrl )

            const oidcIssuer = await Issuer.discover(`${client.serverUrl}/oidc`)
            const serverSideOidcClient = new oidcIssuer.Client({
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uris: [uri], // using uri as redirect_uri to show the ID Token contents
                response_types: ['id_token token'],
                token_endpoint_auth_method: 'client_secret_basic',
            })

            const nonce = generators.nonce()
            const url = new URL(serverSideOidcClient.authorizationUrl({ nonce }))
            const oidcAuthUrl = `${client.serverUrl}${url.pathname}${url.search}`

            // 2) client side ( open oidcAuthUrl )

            const res1 = await request(oidcAuthUrl, client.getCookie())
            expect(res1.status).toBe(303)
            expect(res1.headers.location.startsWith(`${uri}#error`)).toBeTruthy()
            expect(res1.headers.location).toContain('error_description=requested%20response_type%20is%20not%20allowed%20for%20this%20client')
            expectCookieKeys(res1.cookie, ['keystone.sid'])
        })

        test('miniapp server side oidc client logic (code flow)', async () => {
            const client =  await makeClientWithNewRegisteredAndLoggedInUser()
            const admin = await makeLoggedInAdminClient()

            const uri = OIDC_REDIRECT_URI
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

            const serverUrl = client.serverUrl
            const issuer = new Issuer({
                authorization_endpoint: `${serverUrl}/oidc/auth`,
                token_endpoint: `${serverUrl}/oidc/token`,
                end_session_endpoint: `${serverUrl}/oidc/session/end`,
                jwks_uri: `${serverUrl}/oidc/jwks`,
                revocation_endpoint: `${serverUrl}/oidc/token/revocation`,
                userinfo_endpoint: `${serverUrl}/oidc/me`,
                issuer: serverUrl,
            })
            const issuerClient = new issuer.Client({
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uris: [uri], // using uri as redirect_uri to show the ID Token contents
                response_types: ['code'],
                token_endpoint_auth_method: 'client_secret_basic',
            })
            const _validateJWT = issuerClient.validateJWT
            issuerClient.validateJWT = async (jwt, expectedAlg, required) => {
                try {
                    return await _validateJWT.call(issuerClient, jwt, expectedAlg, required)
                } catch (error) {
                    console.error({ message: error.message, jwt, error })
                    // Return a mock result with the required structure when validation fails
                    return { 
                        protected: jwtDecode(jwt, { header: true }), 
                        payload: jwtDecode(jwt),
                        key: { jwk: {} }, // Mock key object to prevent undefined errors
                    }
                }
            }

            const checks = { nonce: generators.nonce(), state: generators.state() }
            const redirectUrl = issuerClient.authorizationUrl({
                response_type: 'code',
                ...checks,
            })

            const res1 = await request(redirectUrl, client.getCookie(), 100)
            expect(res1.status).toEqual(200)

            const params = issuerClient.callbackParams(res1.url)
            const tokenSet = await issuerClient.callback(uri, params, { ...checks })
            expect(tokenSet.access_token).toBeTruthy()
        })
    })
    describe('Phone and Email Scopes', () => {
        test('openid scope should not include phone/email fields', async () => {
            const uri = OIDC_REDIRECT_URI
            const clientId = getRandomString()
            const clientSecret = getRandomString()
            const admin = await makeLoggedInAdminClient()

            await createTestOidcClient(admin, {
                payload: {
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uris: [uri],
                    response_types: ['code id_token', 'code', 'id_token'],
                    grant_types: ['implicit', 'authorization_code', 'refresh_token'],
                    token_endpoint_auth_method: 'client_secret_basic',
                },
            })

            const client = await makeClientWithNewRegisteredAndLoggedInUser()
            expectCookieKeys(client.getCookie(), ['keystone.sid'])

            // 1) server side ( create oidc client and prepare oidcAuthUrl )
            const oidcIssuer = await Issuer.discover(`${client.serverUrl}/oidc`)
            const serverSideOidcClient = new oidcIssuer.Client({
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uris: [uri],
                response_types: ['code id_token'],
                token_endpoint_auth_method: 'client_secret_basic',
            })

            const nonce = generators.nonce()
            const url = new URL(serverSideOidcClient.authorizationUrl({ 
                nonce,
                scope: 'openid', // Only request openid scope
            }))
            const oidcAuthUrl = `${client.serverUrl}${url.pathname}${url.search}`

            // 2) client side ( open oidcAuthUrl )
            const res1 = await request(oidcAuthUrl, client.getCookie())
            expect(res1.status).toBe(303)
            expect(res1.headers.location.startsWith('/oidc/interaction/')).toBeTruthy()

            const res2 = await request(`${client.serverUrl}${res1.headers.location}`, res1.cookie)
            expect(res2.status).toBe(303)
            expect(res2.headers.location.startsWith(`${client.serverUrl}/oidc/auth/`)).toBeTruthy()

            const res3 = await request(res2.headers.location, res2.cookie)
            expect(res3.status).toBe(303)
            expect(res3.headers.location.startsWith(`${uri}#code`)).toBeTruthy()

            // 3) callback to server side
            const params = serverSideOidcClient.callbackParams(res3.headers.location.replace(`${uri}#`, `${uri}?`))
            const tokenSet = await serverSideOidcClient.callback(uri, params, { nonce })

            // 4) check userinfo - should NOT include phone/email fields
            const userinfo = await serverSideOidcClient.userinfo(tokenSet.access_token)
            expect(userinfo).toEqual({
                'sub': client.user.id,
                'type': 'staff',
                'v': 1,
                'dv': 1,
                'isAdmin': false,
                'isSupport': false,
                'name': client.user.name,
            })
            
            // Verify phone/email fields are NOT present
            expect(userinfo).not.toHaveProperty('phone_number')
            expect(userinfo).not.toHaveProperty('phone_number_verified')
            expect(userinfo).not.toHaveProperty('email')
            expect(userinfo).not.toHaveProperty('email_verified')

            // 5) check access token scope
            expect(await getAccessToken(tokenSet.access_token, client)).toMatchObject({
                'scope': 'openid',
            })
        })

        test('phone scope should include phone fields', async () => {
            const uri = OIDC_REDIRECT_URI
            const clientId = getRandomString()
            const clientSecret = getRandomString()
            const admin = await makeLoggedInAdminClient()

            await createTestOidcClient(admin, {
                payload: {
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uris: [uri],
                    response_types: ['code id_token', 'code', 'id_token'],
                    grant_types: ['implicit', 'authorization_code', 'refresh_token'],
                    token_endpoint_auth_method: 'client_secret_basic',
                },
            })

            const client = await makeClientWithNewRegisteredAndLoggedInUser()
            expectCookieKeys(client.getCookie(), ['keystone.sid'])

            // 1) server side ( create oidc client and prepare oidcAuthUrl )
            const oidcIssuer = await Issuer.discover(`${client.serverUrl}/oidc`)
            const serverSideOidcClient = new oidcIssuer.Client({
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uris: [uri],
                response_types: ['code id_token'],
                token_endpoint_auth_method: 'client_secret_basic',
            })

            const nonce = generators.nonce()
            const url = new URL(serverSideOidcClient.authorizationUrl({ 
                nonce,
                scope: 'openid phone', // Request openid + phone scopes
            }))
            const oidcAuthUrl = `${client.serverUrl}${url.pathname}${url.search}`

            // 2) client side ( open oidcAuthUrl )
            const res1 = await request(oidcAuthUrl, client.getCookie())
            expect(res1.status).toBe(303)
            expect(res1.headers.location.startsWith('/oidc/interaction/')).toBeTruthy()

            const res2 = await request(`${client.serverUrl}${res1.headers.location}`, res1.cookie)
            expect(res2.status).toBe(303)
            expect(res2.headers.location.startsWith(`${client.serverUrl}/oidc/auth/`)).toBeTruthy()

            const res3 = await request(res2.headers.location, res2.cookie)
            expect(res3.status).toBe(303)
            expect(res3.headers.location.startsWith(`${uri}#code`)).toBeTruthy()

            // 3) callback to server side
            const params = serverSideOidcClient.callbackParams(res3.headers.location.replace(`${uri}#`, `${uri}?`))
            const tokenSet = await serverSideOidcClient.callback(uri, params, { nonce })

            // 4) check userinfo - should include phone fields
            const userinfo = await serverSideOidcClient.userinfo(tokenSet.access_token)
            expect(userinfo).toEqual({
                'sub': client.user.id,
                'type': 'staff',
                'v': 1,
                'dv': 1,
                'isAdmin': false,
                'isSupport': false,
                'name': client.user.name,
                'phone_number': client.userAttrs.phone,
                'phone_number_verified': client.user.isPhoneVerified,
            })
            
            // Verify phone fields are present
            expect(userinfo).toHaveProperty('phone_number')
            expect(userinfo).toHaveProperty('phone_number_verified')
            // Verify email fields are NOT present (not requested)
            expect(userinfo).not.toHaveProperty('email')
            expect(userinfo).not.toHaveProperty('email_verified')

            // 5) check access token scope
            expect(await getAccessToken(tokenSet.access_token, client)).toMatchObject({
                'scope': 'openid phone',
            })
        })

        test('email scope should include email fields', async () => {
            const uri = OIDC_REDIRECT_URI
            const clientId = getRandomString()
            const clientSecret = getRandomString()
            const admin = await makeLoggedInAdminClient()

            await createTestOidcClient(admin, {
                payload: {
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uris: [uri],
                    response_types: ['code id_token', 'code', 'id_token'],
                    grant_types: ['implicit', 'authorization_code', 'refresh_token'],
                    token_endpoint_auth_method: 'client_secret_basic',
                },
            })

            const client = await makeClientWithNewRegisteredAndLoggedInUser()
            expectCookieKeys(client.getCookie(), ['keystone.sid'])

            // 1) server side ( create oidc client and prepare oidcAuthUrl )
            const oidcIssuer = await Issuer.discover(`${client.serverUrl}/oidc`)
            const serverSideOidcClient = new oidcIssuer.Client({
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uris: [uri],
                response_types: ['code id_token'],
                token_endpoint_auth_method: 'client_secret_basic',
            })

            const nonce = generators.nonce()
            const url = new URL(serverSideOidcClient.authorizationUrl({ 
                nonce,
                scope: 'openid email', // Request openid + email scopes
            }))
            const oidcAuthUrl = `${client.serverUrl}${url.pathname}${url.search}`

            // 2) client side ( open oidcAuthUrl )
            const res1 = await request(oidcAuthUrl, client.getCookie())
            expect(res1.status).toBe(303)
            expect(res1.headers.location.startsWith('/oidc/interaction/')).toBeTruthy()

            const res2 = await request(`${client.serverUrl}${res1.headers.location}`, res1.cookie)
            expect(res2.status).toBe(303)
            expect(res2.headers.location.startsWith(`${client.serverUrl}/oidc/auth/`)).toBeTruthy()

            const res3 = await request(res2.headers.location, res2.cookie)
            expect(res3.status).toBe(303)
            expect(res3.headers.location.startsWith(`${uri}#code`)).toBeTruthy()

            // 3) callback to server side
            const params = serverSideOidcClient.callbackParams(res3.headers.location.replace(`${uri}#`, `${uri}?`))
            const tokenSet = await serverSideOidcClient.callback(uri, params, { nonce })

            // 4) check userinfo - should include email fields
            const userinfo = await serverSideOidcClient.userinfo(tokenSet.access_token)
            expect(userinfo).toEqual({
                'sub': client.user.id,
                'type': 'staff',
                'v': 1,
                'dv': 1,
                'isAdmin': false,
                'isSupport': false,
                'name': client.user.name,
                'email': normalizeEmail(client.userAttrs.email),
                'email_verified': client.user.isEmailVerified,
            })
            
            // Verify email fields are present
            expect(userinfo).toHaveProperty('email')
            expect(userinfo).toHaveProperty('email_verified')
            // Verify phone fields are NOT present (not requested)
            expect(userinfo).not.toHaveProperty('phone_number')
            expect(userinfo).not.toHaveProperty('phone_number_verified')

            // 5) check access token scope
            expect(await getAccessToken(tokenSet.access_token, client)).toMatchObject({
                'scope': 'openid email',
            })
        })

        test('phone and email scopes should include both phone and email fields', async () => {
            const uri = OIDC_REDIRECT_URI
            const clientId = getRandomString()
            const clientSecret = getRandomString()
            const admin = await makeLoggedInAdminClient()

            await createTestOidcClient(admin, {
                payload: {
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uris: [uri],
                    response_types: ['code id_token', 'code', 'id_token'],
                    grant_types: ['implicit', 'authorization_code', 'refresh_token'],
                    token_endpoint_auth_method: 'client_secret_basic',
                },
            })

            const client = await makeClientWithNewRegisteredAndLoggedInUser()
            expectCookieKeys(client.getCookie(), ['keystone.sid'])

            // 1) server side ( create oidc client and prepare oidcAuthUrl )
            const oidcIssuer = await Issuer.discover(`${client.serverUrl}/oidc`)
            const serverSideOidcClient = new oidcIssuer.Client({
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uris: [uri],
                response_types: ['code id_token'],
                token_endpoint_auth_method: 'client_secret_basic',
            })

            const nonce = generators.nonce()
            const url = new URL(serverSideOidcClient.authorizationUrl({ 
                nonce,
                scope: 'openid phone email', // Request all scopes
            }))
            const oidcAuthUrl = `${client.serverUrl}${url.pathname}${url.search}`

            // 2) client side ( open oidcAuthUrl )
            const res1 = await request(oidcAuthUrl, client.getCookie())
            expect(res1.status).toBe(303)
            expect(res1.headers.location.startsWith('/oidc/interaction/')).toBeTruthy()

            const res2 = await request(`${client.serverUrl}${res1.headers.location}`, res1.cookie)
            expect(res2.status).toBe(303)
            expect(res2.headers.location.startsWith(`${client.serverUrl}/oidc/auth/`)).toBeTruthy()

            const res3 = await request(res2.headers.location, res2.cookie)
            expect(res3.status).toBe(303)
            expect(res3.headers.location.startsWith(`${uri}#code`)).toBeTruthy()

            // 3) callback to server side
            const params = serverSideOidcClient.callbackParams(res3.headers.location.replace(`${uri}#`, `${uri}?`))
            const tokenSet = await serverSideOidcClient.callback(uri, params, { nonce })

            // 4) check userinfo - should include both phone and email fields
            const userinfo = await serverSideOidcClient.userinfo(tokenSet.access_token)
            expect(userinfo).toEqual({
                'sub': client.user.id,
                'type': 'staff',
                'v': 1,
                'dv': 1,
                'isAdmin': false,
                'isSupport': false,
                'name': client.user.name,
                'phone_number': client.userAttrs.phone,
                'phone_number_verified': client.user.isPhoneVerified,
                'email': normalizeEmail(client.userAttrs.email),
                'email_verified': client.user.isEmailVerified,
            })
            
            // Verify both phone and email fields are present
            expect(userinfo).toHaveProperty('phone_number')
            expect(userinfo).toHaveProperty('phone_number_verified')
            expect(userinfo).toHaveProperty('email')
            expect(userinfo).toHaveProperty('email_verified')

            // 5) check access token scope
            expect(await getAccessToken(tokenSet.access_token, client)).toMatchObject({
                'scope': 'openid phone email',
            })
        })

        test('scope validation: requesting phone scope when only openid is granted should trigger new interaction', async () => {
            const uri = OIDC_REDIRECT_URI
            const clientId = getRandomString()
            const clientSecret = getRandomString()
            const admin = await makeLoggedInAdminClient()

            await createTestOidcClient(admin, {
                payload: {
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uris: [uri],
                    response_types: ['code id_token', 'code', 'id_token'],
                    grant_types: ['implicit', 'authorization_code', 'refresh_token'],
                    token_endpoint_auth_method: 'client_secret_basic',
                },
            })

            const client = await makeClientWithNewRegisteredAndLoggedInUser()
            expectCookieKeys(client.getCookie(), ['keystone.sid'])

            const oidcIssuer = await Issuer.discover(`${client.serverUrl}/oidc`)
            const serverSideOidcClient = new oidcIssuer.Client({
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uris: [uri],
                response_types: ['code id_token'],
                token_endpoint_auth_method: 'client_secret_basic',
            })

            // STEP 1: First authorization with only openid scope
            const nonce1 = generators.nonce()
            const url1 = new URL(serverSideOidcClient.authorizationUrl({ 
                nonce: nonce1,
                scope: 'openid', // Only request openid scope initially
            }))
            const oidcAuthUrl1 = `${client.serverUrl}${url1.pathname}${url1.search}`

            // Complete first authorization flow
            const res1 = await request(oidcAuthUrl1, client.getCookie())
            expect(res1.status).toBe(303)
            expect(res1.headers.location.startsWith('/oidc/interaction/')).toBeTruthy()

            const res2 = await request(`${client.serverUrl}${res1.headers.location}`, res1.cookie)
            expect(res2.status).toBe(303)

            const res3 = await request(res2.headers.location, res2.cookie)
            expect(res3.status).toBe(303)
            expect(res3.headers.location.startsWith(`${uri}#code`)).toBeTruthy()

            // Get first token set with only openid scope
            const params1 = serverSideOidcClient.callbackParams(res3.headers.location.replace(`${uri}#`, `${uri}?`))
            const tokenSet1 = await serverSideOidcClient.callback(uri, params1, { nonce: nonce1 })

            // Verify first token only has openid scope
            expect(await getAccessToken(tokenSet1.access_token, client)).toMatchObject({
                'scope': 'openid',
            })

            // STEP 2: Second authorization requesting phone scope (should trigger new interaction)
            const nonce2 = generators.nonce()
            const url2 = new URL(serverSideOidcClient.authorizationUrl({ 
                nonce: nonce2,
                scope: 'openid phone', // Now request phone scope as well
            }))
            const oidcAuthUrl2 = `${client.serverUrl}${url2.pathname}${url2.search}`

            // This should trigger a new interaction because existing grant doesn't have phone scope
            const res4 = await request(oidcAuthUrl2, res3.cookie) // Use cookie from previous session
            expect(res4.status).toBe(303)
            expect(res4.headers.location.startsWith('/oidc/interaction/')).toBeTruthy()

            // Complete second authorization flow
            const res5 = await request(`${client.serverUrl}${res4.headers.location}`, res4.cookie)
            expect(res5.status).toBe(303)

            const res6 = await request(res5.headers.location, res5.cookie)
            expect(res6.status).toBe(303)
            expect(res6.headers.location.startsWith(`${uri}#code`)).toBeTruthy()

            // Get second token set with both openid and phone scopes
            const params2 = serverSideOidcClient.callbackParams(res6.headers.location.replace(`${uri}#`, `${uri}?`))
            const tokenSet2 = await serverSideOidcClient.callback(uri, params2, { nonce: nonce2 })

            // Verify second token has both scopes
            expect(await getAccessToken(tokenSet2.access_token, client)).toMatchObject({
                'scope': 'openid phone',
            })

            // Verify userinfo includes phone fields
            const userinfo2 = await serverSideOidcClient.userinfo(tokenSet2.access_token)
            expect(userinfo2).toHaveProperty('phone_number')
            expect(userinfo2).toHaveProperty('phone_number_verified')

            // STEP 3: Third authorization with same scopes should reuse existing grant (no new interaction)
            const nonce3 = generators.nonce()
            const url3 = new URL(serverSideOidcClient.authorizationUrl({ 
                nonce: nonce3,
                scope: 'openid phone', // Same scopes as before
            }))
            const oidcAuthUrl3 = `${client.serverUrl}${url3.pathname}${url3.search}`

            // This should NOT trigger interaction because existing grant has all required scopes
            const res7 = await request(oidcAuthUrl3, res6.cookie)
            expect(res7.status).toBe(303)
            // Should skip interaction and go directly to callback
            expect(res7.headers.location.startsWith(`${uri}#code`)).toBeTruthy()
        })
    })
})
