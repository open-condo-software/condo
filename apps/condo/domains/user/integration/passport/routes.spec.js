jest.resetModules()
jest.mock('@open-condo/config', () => {
    const conf = jest.requireActual('@open-condo/config')

    const getter = (_, name) => {
        if (name === 'PASSPORT_CONFIG') {
            return JSON.stringify([
                {
                    name: 'github',
                    strategy: 'github',
                    options: {
                        clientID: '12345678',
                        clientSecret: 'some-fake-client-secret',
                    },
                },
                {
                    name: 'test-sdk',
                    strategy: 'oidcTokenUserInfo',
                    options: {
                        clients: {
                            'trusted-client': {
                                identityType: 'some-provider-name',
                                userInfoURL: 'https://oidc.auth.example.com/userInfo',
                                trustPhone: true,
                                trustEmail: true,
                                requireConfirmPhoneAction: false,
                                requireConfirmEmailAction: false,
                            },
                        },
                    },
                    trustPhone: true,
                    trustEmail: true,
                },
                {
                    name: 'some-provider-name',
                    strategy: 'oidc',
                    options: {
                        issuer: 'https://oidc.auth.example.com',
                        authorizationURL: 'https://oidc.auth.example.com/authorize',
                        tokenURL: 'https://oidc.auth.example.com/token',
                        userInfoURL: 'https://oidc.auth.example.com/userInfo',
                        clientID: '87654321',
                        clientSecret: 'some-fake-client-secret',
                    },
                    trustPhone: true,
                    trustEmail: true,
                },
            ])
        }
        return conf[name]
    }

    return new Proxy(conf, { get: getter, set: jest.fn() })
})
// eslint-disable-next-line import/order
const userUtils = require('@condo/domains/user/integration/passport/utils/user')
const syncUserSpy = jest.spyOn(userUtils, 'syncUser')

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const nock = require('nock')
const request = require('supertest')


const conf = require('@open-condo/config')
const { getById, getByCondition } = require('@open-condo/keystone/schema')
const { setFakeClientMode, makeClient } = require('@open-condo/keystone/test.utils')

const { STAFF, RESIDENT } = require('@condo/domains/user/constants/common')
const { createTestEmail, createTestPhone } = require('@condo/domains/user/utils/testSchema')

const { GithubAuthStrategy } = require('./strategies/github')

const AUTHENTICATED_USER_QUERY = '{ authenticatedUser { id type } }'



function mockGithubEndpoints () {
    nock('https://github.com')
        .post('/login/oauth/access_token')
        .reply(200, {
            access_token: 'some_access_token',
            scope:'user:email',
            'token_type': 'bearer',
        })

    const userName = faker.internet.userName()
    const id = faker.datatype.uuid()

    const githubUserResponse = {
        'login': userName,
        'id': id,
    }

    nock('https://api.github.com')
        .get('/user')
        .reply(200, githubUserResponse)

    const emails = [
        { email: createTestEmail(), primary: true, verified: true },
        { email: createTestEmail(), primary: false, verified: true },
        { email: createTestEmail(), primary: false, verified: false },
    ]

    nock('https://api.github.com')
        .get('/user/emails')
        .reply(200, emails)

    return [githubUserResponse, emails]
}

function mockGithubProfileGeneration (githubUserResponse, emails) {
    const processedEmails = emails.map(email => {
        const r = { ...email }
        r.value = r.email
        delete r.email
        return r
    })

    return  {
        username: githubUserResponse.login,
        id: String(githubUserResponse.id),
        emails: processedEmails,
        email: GithubAuthStrategy.findValidEmail(processedEmails),
        provider: 'github',
    }
}

function mockOIDCEndpoints ({
    authorizationURL,
    tokenURL,
    userInfoURL,
} = {}) {
    const userProfile = {
        sub: faker.datatype.uuid(),
        name: faker.name.fullName(),
        phone_number: createTestPhone(),
        phone_number_verified: true,
        email: createTestEmail(),
        email_verified: Math.random() > 0.5,
    }

    function dummyJSONToToken (obj) {
        return Buffer.from(JSON.stringify(obj), 'utf-8').toString('base64')
    }
    function dummyTokenToJSON (token) {
        const json = Buffer.from(token, 'base64').toString('utf8')
        return JSON.parse(json)
    }

    const token = dummyJSONToToken(userProfile)
    const code = dummyJSONToToken(token)

    if (authorizationURL) {
        const u = new URL(authorizationURL)
        nock(u.origin)
            .get(u.pathname)
            .query(true) // Match any query parameters
            .reply(function (uri, requestBody) {
                // Dynamically build the redirect URL based on the incoming request.
                const requestUrl = new URL(uri, u.origin)
                const redirectUri = requestUrl.searchParams.get('redirect_uri')

                const state = requestUrl.searchParams.get('state')

                if (!redirectUri || !state) {
                    return [400, 'Missing redirect_uri or state parameter']
                }

                const finalRedirectUrl = new URL(redirectUri)
                finalRedirectUrl.searchParams.append('code', code)
                finalRedirectUrl.searchParams.append('state', state)

                return [302, '', { Location: finalRedirectUrl.toString() }]
            })
    }

    if (tokenURL) {
        const u = new URL(tokenURL)

        const idTokenPayload = {
            ...userProfile,
            iss: u.origin,
            aud: '87654321',
            exp: Math.floor(Date.now() / 1000) + 3600,
            iat: Math.floor(Date.now() / 1000),
            nonce: 'mock-nonce-value',
        }

        const base64replaced = (payload) => {
            return dummyJSONToToken(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
        }

        const generateIdToken = (payload) => {
            return [base64replaced({ alg: 'RS256', typ: 'JWT' }), base64replaced(payload), base64replaced('fake-signature')].join('.')
        }

        nock(u.origin)
            .post('/token', (body) => {
            // Ensure the request is for an authorization code grant and uses our mock code.
                return body.grant_type === 'authorization_code' && body.code === code
            })
            .reply(function (uri, body) {
                const parsed = new URLSearchParams(body)
                return [200, {
                    access_token: dummyTokenToJSON(parsed.get('code')),
                    id_token: generateIdToken(idTokenPayload),
                    token_type: 'Bearer',
                    expires_in: 3600,
                }]
            })
    }

    if (userInfoURL) {
        const u = new URL(userInfoURL)
        nock(u.origin)
            .get(u.pathname)
            .reply(function () {
                const token = this.req.headers.authorization.split(' ')[1]
                try {
                    return [200, dummyTokenToJSON(token)]
                } catch {
                    return [500, {}]
                }
            })
    }

    return [userProfile, token, code]
}

function expectAuthCookie (response) {
    expect(response.headers).toHaveProperty('set-cookie')
    expect(response.headers['set-cookie']).toHaveLength(1)
    const cookieValue = response.headers['set-cookie'][0]
    expect(cookieValue).toContain('keystone.sid')
    expect(cookieValue).toContain('HttpOnly;')
}

describe('Passport authentication E2E test', () => {
    setFakeClientMode(index)

    let agent
    let serverUrl

    beforeAll(async () => {
        const client = await makeClient()
        // NOTE: Not equal to conf['SERVER_URL'], since it runs separate KS in spec via setFakeClientMode
        serverUrl = client.serverUrl
    })
    beforeEach( () => {
        // NOTE: x-forwarded-for + trust proxy = bypass rate-limits during tests
        agent = request.agent(serverUrl).set('x-forwarded-for', faker.internet.ip())
    })
    afterEach(() => {
        nock.cleanAll()
        syncUserSpy.mockClear()
    })
    afterAll(() => {
        nock.cleanAll()
        syncUserSpy.mockRestore()
    })

    describe('Must login different user types via known strategies', () => {
        describe.each([STAFF, RESIDENT])('%p', (userType) => {
            test('GitHub Strategy', async () => {
                const [userResponse, emailsResponse] = mockGithubEndpoints()
                const profile = mockGithubProfileGeneration(userResponse, emailsResponse)

                const authResponse = await agent.get(`/api/auth/github?user_type=${userType}`)
                expect(authResponse.status).toEqual(302)
                expect(authResponse.headers).toHaveProperty('location')
                const redirectUrl = new URL(authResponse.headers.location)
                expect(redirectUrl.host).toEqual('github.com')
                expect(redirectUrl.pathname).toEqual('/login/oauth/authorize')
                expect(redirectUrl.searchParams.get('response_type')).toEqual('code')
                expect(redirectUrl.searchParams.get('redirect_uri')).toEqual(`${conf['SERVER_URL']}/api/auth/github/callback`)
                expect(redirectUrl.searchParams.get('scope')).toEqual('user:email')
                expect(redirectUrl.searchParams.get('client_id')).toEqual('12345678')

                const callbackResponse = await agent.get('/api/auth/github/callback?code=some_gh_code')
                expect(callbackResponse.status).toEqual(302)
                expect(callbackResponse.headers).toHaveProperty('location', '/')
                expectAuthCookie(callbackResponse)

                expect(syncUserSpy).toHaveBeenCalledTimes(1)
                const [, syncProfile, syncUserType, providerInfo, fieldMapping] = syncUserSpy.mock.calls[0]
                expect(syncUserType).toEqual(userType)
                expect(providerInfo).toEqual({
                    name: 'github',
                    trustEmail: true,
                    trustPhone: false,
                })
                expect(fieldMapping).toEqual(GithubAuthStrategy.fieldMapping)
                expect(syncProfile).toEqual(expect.objectContaining(profile))

                const gqlUserResponse = await agent
                    .post('/admin/api')
                    .set('Content-Type', 'application/json')
                    .send({ query: AUTHENTICATED_USER_QUERY })
                expect(gqlUserResponse.status).toEqual(200)
                expect(gqlUserResponse).toHaveProperty(['body', 'data', 'authenticatedUser', 'id'])
                expect(gqlUserResponse).toHaveProperty(['body', 'data', 'authenticatedUser', 'type'], userType)

                const userId = gqlUserResponse.body.data.authenticatedUser.id

                const user = await getById('User', userId)
                expect(user).toEqual(expect.objectContaining({
                    name: profile.username,

                    email: profile.email.value,
                    isEmailVerified: profile.email.verified,
                    externalEmail: profile.email.value,
                    isExternalEmailVerified: profile.email.verified,

                    phone: null,
                    isPhoneVerified: false,
                    externalPhone: null,
                    isExternalPhoneVerified: false,

                    externalSystemName: 'github',

                    meta: expect.objectContaining({
                        'github': expect.objectContaining(profile),
                    }),
                }))

                const identity = await getByCondition('UserExternalIdentity', {
                    identityId: profile.id,
                    identityType: 'github',
                    userType,
                })
                expect(identity).toHaveProperty('user', userId)
            })
            test('OIDC Strategy', async () => {
                const authorizationURL = 'https://oidc.auth.example.com/authorize'
                const [userResponse, , code] = mockOIDCEndpoints({
                    authorizationURL,
                    tokenURL: 'https://oidc.auth.example.com/token',
                    userInfoURL: 'https://oidc.auth.example.com/userInfo',
                })


                const authResponse = await agent.get(`/api/auth/some-provider-name?user_type=${userType}`)
                expect(authResponse.status).toEqual(302)
                expect(authResponse.headers).toHaveProperty('location')
                const redirectUrl = new URL(authResponse.headers.location)
                const oidcAuthUrl = new URL(authorizationURL)
                expect(redirectUrl.origin).toEqual(oidcAuthUrl.origin)
                expect(redirectUrl.pathname).toEqual(oidcAuthUrl.pathname)
                // https://oidc.auth.example.com/authorize?response_type=code&client_id=12345678&redirect_uri=http%3A%2F%2Flocalhost%3A4007%2Fapi%2Fauth%2Fsome-provider-name%2Fcallback&scope=openid%20openid&state=wC5A%2FZ%2Bt3KelyX3NWwl3LtuM
                expect(redirectUrl.searchParams.get('response_type')).toEqual('code')
                expect(redirectUrl.searchParams.get('client_id')).toEqual('87654321')
                expect(redirectUrl.searchParams.get('redirect_uri')).toEqual(`${conf['SERVER_URL']}/api/auth/some-provider-name/callback`)
                expect(redirectUrl.searchParams.get('scope')).toContain('openid')
                expect(redirectUrl.searchParams.get('state')).toBeDefined()

                const search = new URLSearchParams({
                    state: redirectUrl.searchParams.get('state'),
                    iss: oidcAuthUrl.origin,
                    code,
                })

                const callbackResponse = await agent.get(`/api/auth/some-provider-name/callback?${search.toString()}`)
                expect(callbackResponse.status).toEqual(302)
                expect(callbackResponse.headers).toHaveProperty('location', '/')
                expectAuthCookie(callbackResponse)

                expect(syncUserSpy).toHaveBeenCalledTimes(1)
                const [, syncProfile, syncUserType, providerInfo, fieldMapping] = syncUserSpy.mock.calls[0]
                expect(syncUserType).toEqual(userType)
                expect(providerInfo).toEqual({
                    name: 'some-provider-name',
                    trustEmail: true,
                    trustPhone: true,
                })
                expect(fieldMapping).toEqual({})
                expect(syncProfile).toEqual(userResponse)

                const gqlUserResponse = await agent
                    .post('/admin/api')
                    .set('Content-Type', 'application/json')
                    .send({ query: AUTHENTICATED_USER_QUERY })
                expect(gqlUserResponse.status).toEqual(200)
                expect(gqlUserResponse).toHaveProperty(['body', 'data', 'authenticatedUser', 'id'])
                expect(gqlUserResponse).toHaveProperty(['body', 'data', 'authenticatedUser', 'type'], userType)

                const userId = gqlUserResponse.body.data.authenticatedUser.id

                const user = await getById('User', userId)
                expect(user).toEqual(expect.objectContaining({
                    name: userResponse.name,

                    email: userResponse.email,
                    isEmailVerified: userResponse.email_verified,
                    externalEmail: userResponse.email,
                    isExternalEmailVerified: userResponse.email_verified,

                    phone: userResponse.phone_number,
                    isPhoneVerified: userResponse.phone_number_verified,
                    externalPhone: userResponse.phone_number,
                    isExternalPhoneVerified: userResponse.phone_number_verified,

                    externalSystemName: 'some-provider-name',

                    meta: expect.objectContaining({
                        'some-provider-name': expect.objectContaining(userResponse),
                    }),
                }))

                const identity = await getByCondition('UserExternalIdentity', {
                    identityId: userResponse.sub,
                    identityType: 'some-provider-name',
                    userType,
                })
                expect(identity).toHaveProperty('user', userId)
            })
            test('OIDC Token UserInfo Strategy', async () => {
                const [userResponse, token] = mockOIDCEndpoints({
                    userInfoURL: 'https://oidc.auth.example.com/userInfo',
                })

                const params = new URLSearchParams({
                    user_type: userType,
                    access_token: token,
                    client_id: 'trusted-client',
                })
                const authResponse = await agent.get(`/api/auth/test-sdk?${params.toString()}`)
                expect(authResponse.status).toEqual(302)
                expect(authResponse.headers).toHaveProperty('location')
                const redirectUrl = new URL(authResponse.headers.location, conf['SERVER_URL'])
                expect(redirectUrl.pathname).toEqual('/api/auth/test-sdk/callback')
                expect(redirectUrl.searchParams.get('user_type')).toEqual(userType)
                expect(redirectUrl.searchParams.get('access_token')).toEqual(token)
                expect(redirectUrl.searchParams.get('client_id')).toEqual('trusted-client')

                const callbackResponse = await agent.get(`/api/auth/test-sdk/callback?${params.toString()}`)
                expect(callbackResponse.status).toEqual(302)
                expect(callbackResponse.headers).toHaveProperty('location', '/')
                expectAuthCookie(callbackResponse)

                expect(syncUserSpy).toHaveBeenCalledTimes(1)
                const [, syncProfile, syncUserType, providerInfo, fieldMapping] = syncUserSpy.mock.calls[0]
                expect(syncUserType).toEqual(userType)
                expect(providerInfo).toEqual({
                    name: 'some-provider-name',
                    trustEmail: true,
                    trustPhone: true,
                })
                expect(fieldMapping).toEqual(undefined)
                expect(syncProfile).toEqual(userResponse)

                const gqlUserResponse = await agent
                    .post('/admin/api')
                    .set('Content-Type', 'application/json')
                    .send({ query: AUTHENTICATED_USER_QUERY })
                expect(gqlUserResponse.status).toEqual(200)
                expect(gqlUserResponse).toHaveProperty(['body', 'data', 'authenticatedUser', 'id'])
                expect(gqlUserResponse).toHaveProperty(['body', 'data', 'authenticatedUser', 'type'], userType)

                const userId = gqlUserResponse.body.data.authenticatedUser.id

                const user = await getById('User', userId)
                expect(user).toEqual(expect.objectContaining({
                    name: userResponse.name,

                    email: userResponse.email,
                    isEmailVerified: userResponse.email_verified,
                    externalEmail: userResponse.email,
                    isExternalEmailVerified: userResponse.email_verified,

                    phone: userResponse.phone_number,
                    isPhoneVerified: userResponse.phone_number_verified,
                    externalPhone: userResponse.phone_number,
                    isExternalPhoneVerified: userResponse.phone_number_verified,

                    externalSystemName: 'some-provider-name',

                    meta: expect.objectContaining({
                        'some-provider-name': expect.objectContaining(userResponse),
                    }),
                }))

                const identity = await getByCondition('UserExternalIdentity', {
                    identityId: userResponse.sub,
                    identityType: 'some-provider-name',
                    userType,
                })
                expect(identity).toHaveProperty('user', userId)
            })
        })
    })
    describe('Must return 404 for unregistered providers',  () => {
        test.each([
            ['auth endpoint', `/api/auth/${faker.random.alphaNumeric(12)}?user_type=${STAFF}`],
            ['callback endpoint', `/api/auth/${faker.random.alphaNumeric(12)}/callback?user_type=${STAFF}`],
        ])('%p', async (_, endpoint) => {
            const response = await agent.get(endpoint)
            expect(response.status).toEqual(404)
            const body = JSON.parse(response.error.text)
            expect(body).toEqual({
                errors: [
                    expect.objectContaining({
                        name: 'GQLError',
                        extensions: expect.objectContaining({
                            code: 'NOT_FOUND',
                            type: 'UNKNOWN_PROVIDER',
                        }),
                    }),
                ],
            })
        })
    })
})