jest.mock('@open-condo/config', () => {
    const conf = jest.requireActual('@open-condo/config')
    const get = (_, name) => {
        const passportGithubConfig = {
            'clientId': '123',
            'clientSecret': '321',
            'callbackUrl': '/api/auth/github/callback',
            'name': 'github',
            'isEmailTrusted': true,
        }

        const passportOidcConfig = [
            {
                name: 'oidc-default',
                isEmailTrusted: true,
                isPhoneTrusted: true,
                clientID: '123',
                clientSecret: '321',
                callbackURL: '/api/auth/oidc-default/callback',
                authorizationURL: 'https://some-external-oidc.com/authorize',
                tokenURL: 'https://some-external-oidc.com/token',
                userInfoURL: 'https://some-external-oidc.com/userinfo',
                issuer: 'https://some-external-oidc.com',
                scope: 'openid profile',
                fieldMapping: {
                    id: 'sub',
                },
            },
            {
                name: 'oidc-untrusted',
                isEmailTrusted: false,
                isPhoneTrusted: false,
                clientID: '123',
                clientSecret: '321',
                callbackURL: '/api/auth/oidc-untrusted/callback',
                authorizationURL: 'https://some-external-oidc.com/authorize',
                tokenURL: 'https://some-external-oidc.com/token',
                userInfoURL: 'https://some-external-oidc.com/userinfo',
                issuer: 'https://some-external-oidc.com',
                scope: 'openid profile',
                fieldMapping: {
                    id: 'sub',
                },
            },
        ]

        const passportSdkConfig = [
            {
                name: 'sdk-default',
                userInfoURL: 'https://sdk-source.com/userinfo',
                isEmailTrusted: true,
                isPhoneTrusted: true,
                fieldMapping: {
                    id: 'sub',
                },
            },
            {
                name: 'sdk-untrusted',
                userInfoURL: 'https://sdk-source.com/userinfo',
                isEmailTrusted: false,
                isPhoneTrusted: false,
                fieldMapping: {
                    id: 'sub',
                },
            },
        ]

        if (name === 'PASSPORT_GITHUB') {
            return JSON.stringify(passportGithubConfig)
        }

        if (name === 'PASSPORT_OIDC') {
            return JSON.stringify(passportOidcConfig)
        }

        if (name === 'PASSPORT_SDK') {
            return JSON.stringify(passportSdkConfig)
        }

        if (name === 'USER_EXTERNAL_IDENTITY_TYPES') {
            return '["github", "oidc-default", "oidc-untrusted", "sdk-default", "sdk-untrusted"]'
        }
        return conf[name]
    }
    return new Proxy(conf, { get, set: jest.fn() })
})

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const axios = require('axios')
const nock = require('nock')
const request = require('supertest')

const { fetch } = require('@open-condo/keystone/fetch')
const { makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')
const { setFakeClientMode } = require('@open-condo/keystone/test.utils')

const {
    UserExternalIdentity,
    UserAdmin,
    createTestUser,
} = require('@condo/domains/user/utils/testSchema')


const mockGithubUrls = (userId, userEmail) => {
    nock('https://github.com')
        .post('/login/oauth/access_token')
        .reply(200, {
            access_token: 'some_access_token',
            scope:'user:email',
            'token_type': 'bearer',
        })

    const githubUserResponse = {
        'login': userId,
        'id': userId,
        'name': userId,
        'email': userEmail,
    }

    nock('https://api.github.com')
        .get('/user')
        .reply(200, githubUserResponse)

    nock('https://api.github.com')
        .get('/user/emails')
        .reply(200,
            [
                {
                    'email': userEmail,
                    'verified': true,
                    'primary': true,
                    'visibility': 'public',
                },
            ])
}

function createMockJwt (payload) {
    function toBase64Url (data) {
        const base64 = Buffer.from(JSON.stringify(data)).toString('base64')
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    }

    const header = { alg: 'RS256', typ: 'JWT' }
    const signature = 'mock_signature' // A fake signature

    return [
        toBase64Url(header),
        toBase64Url(payload),
        toBase64Url(signature),
    ].join('.')
}

const mockOidcProvider = (
    baseUrl,
    clientId,
    userProfileData = {
        email: `${faker.datatype.uuid()}@gmail.com`,
        isEmailVerified: true,
    }
) => {
    const userProfile = {
        sub: faker.datatype.uuid(),
        name: faker.datatype.uuid(),
        ...userProfileData,
    }

    const idTokenPayload = {
        ...userProfile,
        iss: baseUrl,
        aud: clientId,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        nonce: 'mock-nonce-value',
    }

    const mockData = {
        authCode: 'mock_authorization_code_12345',
        accessToken: 'mock_access_token_abcdefg',
        idToken: createMockJwt(idTokenPayload),
        userProfile,
    }

    const authScope = nock(baseUrl)
        .get('/authorize')
        .query(true) // Match any query parameters
        .reply(function (uri, requestBody) {
            // Dynamically build the redirect URL based on the incoming request.
            const requestUrl = new URL(uri, baseUrl)
            const redirectUri = requestUrl.searchParams.get('redirect_uri')

            const state = requestUrl.searchParams.get('state')

            if (!redirectUri || !state) {
                return [400, 'Missing redirect_uri or state parameter']
            }

            const finalRedirectUrl = new URL(redirectUri)
            finalRedirectUrl.searchParams.append('code', mockData.authCode)
            finalRedirectUrl.searchParams.append('state', state)

            return [302, '', { Location: finalRedirectUrl.toString() }]
        })

    const tokenScope = nock(baseUrl)
        .post('/token', (body) => {
            // Ensure the request is for an authorization code grant and uses our mock code.
            return body.grant_type === 'authorization_code' && body.code === mockData.authCode
        })
        .reply(200, {
            access_token: mockData.accessToken,
            id_token: mockData.idToken,
            token_type: 'Bearer',
            expires_in: 3600,
        })


    const userInfoScope = nock(baseUrl)
        .get('/userinfo')
        .matchHeader('Authorization', `Bearer ${mockData.accessToken}`)
        .reply(200, mockData.userProfile)

    return {
        mockData,
        scopes: {
            authScope,
            tokenScope,
            userInfoScope,
        },
    }
}

const mockSdkProvider = (userProfile = {
    sub: faker.datatype.uuid(),
    name: faker.internet.userName(),
}) => {
    nock('https://sdk-source.com').get('/userinfo')
        .matchHeader('Authorization', 'Bearer some_access_token')
        .reply(200, userProfile)

    return userProfile
}


describe('external authentication', () => {
    setFakeClientMode(index)
    let admin
    let serverUrl
    let agent
    const oidcProviderUrl = 'https://some-external-oidc.com'

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        serverUrl = admin.serverUrl
        agent = request.agent(serverUrl)
        jest.resetModules()
    })
    afterEach(() => {
        nock.cleanAll()
    })

    afterAll(async () => {
        nock.cleanAll()
    })

    describe('Validation', () => {
        test('Auth url without userType query argument should fail', async () => {

            const result = await fetch(serverUrl + '/api/auth/github')
            const json = await result.json()

            expect(result.status).toEqual(400)
            expect(json).toHaveProperty('error', 'Bad Request')
            expect(json).toHaveProperty('message', 'The userType query parameter is required.')
        })

        test('Auth url with wrong userType should fail', async () => {
            const result = await fetch(serverUrl + '/api/auth/github?userType=service')
            const json = await result.json()

            expect(result.status).toEqual(400)
            expect(json).toHaveProperty('error', 'Bad Request')
            expect(json).toHaveProperty('message', 'Valid user types are resident, staff')
        })
    })

    describe('GitHub flow', () => {
        test('should create user, userExternalIdentity and return oidc token', async () => {
            const fakedUserId = faker.datatype.uuid()
            const fakedUserEmail = faker.datatype.uuid() + '@gmail.com'
            mockGithubUrls(fakedUserId, fakedUserEmail)

            const response = await agent.get('/api/auth/github?userType=staff')
            expect(response.statusCode).toEqual(302)

            const tokenResponse = await agent.get('/api/auth/github/callback?code=some_gh_code')

            expect(tokenResponse.statusCode).toEqual(302)
            expect(tokenResponse.headers.location).toEqual('/')
            expect(tokenResponse.headers['set-cookie']).toHaveLength(1)

            const userMeta = {
                email: fakedUserEmail,
                phone: null,
                provider: 'github',
            }

            const userExternalIdentity = await UserExternalIdentity.getOne(admin, { identityId: fakedUserId, identityType: 'github' })
            expect(userExternalIdentity).toHaveProperty('identityType', 'github')
            expect(userExternalIdentity).toHaveProperty('user')
            expect(userExternalIdentity).toHaveProperty('userType', 'staff')
            expect(userExternalIdentity.meta).toMatchObject(userMeta)

            const user = await UserAdmin.getOne(admin, { id: userExternalIdentity.user.id })

            expect(user).toHaveProperty('email', fakedUserEmail.toLowerCase())
            expect(user).toHaveProperty('type', 'staff')
            expect(user).toHaveProperty('isEmailVerified', true)
            expect(user).toHaveProperty('isPhoneVerified', false)
            expect(user).toHaveProperty('isAdmin', false)
            expect(user).toHaveProperty('isSupport', false)
            expect(user.meta).toMatchObject(userMeta)
        })

        test('should be able to authorize already existing user', async () => {
            let userExternalIdentity, user
            const fakedUserId = faker.datatype.uuid()
            const fakedUserEmail = faker.datatype.uuid() + '@gmail.com'

            userExternalIdentity = await UserExternalIdentity.getOne(admin, { identityId: fakedUserId, identityType: 'github' })
            expect(userExternalIdentity).toBeUndefined()
            mockGithubUrls(fakedUserId, fakedUserEmail)

            // Register new user and external identity
            const loginResponse = await agent.get('/api/auth/github?userType=staff')
            expect(loginResponse.statusCode).toEqual(302)
            const response = await agent.get('/api/auth/github/callback?code=some_gh_code')
            expect(response.statusCode).toEqual(302)
            expect(response.headers.location).toEqual('/')

            userExternalIdentity = await UserExternalIdentity.getOne(admin, { identityId: fakedUserId, identityType: 'github' })
            expect(userExternalIdentity).toHaveProperty('identityType', 'github')
            expect(userExternalIdentity).toHaveProperty('user')
            expect(userExternalIdentity).toHaveProperty('userType', 'staff')

            user = await UserAdmin.getOne(admin, { id: userExternalIdentity.user.id })
            expect(user).toHaveProperty('email', fakedUserEmail.toLowerCase())

            // Call authorization flow second time to make sure it's not creating another user
            mockGithubUrls(fakedUserId, fakedUserEmail)
            await agent.get('/api/auth/github?userType=staff')
            const reauthResponse = await agent.get('/api/auth/github/callback?code=some_gh_code')
            expect(reauthResponse.statusCode).toEqual(302)
            expect(reauthResponse.headers.location).toEqual('/')

            const existingUserExternalIdentity = await UserExternalIdentity.getOne(admin, { identityId: fakedUserId, identityType: 'github' })
            expect(existingUserExternalIdentity.id).toEqual(userExternalIdentity.id)
        })

        test('should be able to register resident and staff users for one email as well', async () => {
            const fakedUserId = faker.datatype.uuid()
            const fakedUserEmail = faker.datatype.uuid() + '@gmail.com'
            mockGithubUrls(fakedUserId, fakedUserEmail)

            // Register staff user via first request
            const staffResponse = await agent.get('/api/auth/github?userType=staff')
            expect(staffResponse.statusCode).toEqual(302)

            const staffTokenResponse = await agent.get('/api/auth/github/callback?code=some_gh_code')

            expect(staffTokenResponse.statusCode).toEqual(302)
            expect(staffTokenResponse.headers['set-cookie']).toHaveLength(1)
            // expect(staffTokenResponse.body).toHaveProperty('accessToken')

            const staffUserExternalIdentity = await UserExternalIdentity.getOne(admin, { identityId: fakedUserId, identityType: 'github',  userType: 'staff' })
            expect(staffUserExternalIdentity).toHaveProperty('identityType', 'github')
            expect(staffUserExternalIdentity).toHaveProperty('user')
            expect(staffUserExternalIdentity).toHaveProperty('userType', 'staff')

            const staffUser = await UserAdmin.getOne(admin, { id: staffUserExternalIdentity.user.id })

            expect(staffUser).toHaveProperty('email', fakedUserEmail.toLowerCase())
            expect(staffUser).toHaveProperty('type', 'staff')
            expect(staffUser).toHaveProperty('isEmailVerified', true)
            expect(staffUser).toHaveProperty('isPhoneVerified', false)
            expect(staffUser).toHaveProperty('isAdmin', false)
            expect(staffUser).toHaveProperty('isSupport', false)

            // Register resident user with same credentials (email)
            mockGithubUrls(fakedUserId, fakedUserEmail)
            const residentResponse = await agent.get('/api/auth/github?userType=resident')
            expect(residentResponse.statusCode).toEqual(302)

            const residentTokenResponse = await agent.get('/api/auth/github/callback?code=some_gh_code')

            expect(residentTokenResponse.statusCode).toEqual(302)
            expect(residentTokenResponse.headers['set-cookie']).toHaveLength(1)

            const residentUserExternalIdentity = await UserExternalIdentity.getOne(admin, { identityId: fakedUserId, identityType: 'github',  userType: 'resident' })
            expect(residentUserExternalIdentity).toHaveProperty('identityType', 'github')
            expect(residentUserExternalIdentity).toHaveProperty('user')
            expect(residentUserExternalIdentity).toHaveProperty('userType', 'resident')

            const residentUser = await UserAdmin.getOne(admin, { id: residentUserExternalIdentity.user.id })

            expect(residentUser).toHaveProperty('email', fakedUserEmail.toLowerCase())
            expect(residentUser).toHaveProperty('type', 'resident')
            expect(residentUser).toHaveProperty('isEmailVerified', true)
            expect(residentUser).toHaveProperty('isPhoneVerified', false)
            expect(residentUser).toHaveProperty('isAdmin', false)
            expect(residentUser).toHaveProperty('isSupport', false)

            expect(residentUser.id).not.toEqual(staffUser.id)
            expect(residentUserExternalIdentity.id).not.toEqual(staffUserExternalIdentity.id)
            expect(residentUserExternalIdentity.user.id).not.toEqual(staffUserExternalIdentity.user.id)
            expect(residentUser.id).toEqual(residentUserExternalIdentity.user.id)
            expect(staffUser.id).toEqual(staffUserExternalIdentity.user.id)
            expect(staffTokenResponse.headers['set-cookie'][0]).not.toEqual(residentTokenResponse.headers['set-cookie'][0])
        })

        test.skip('should be able to make authorized request with oidc token', async () => {
            const fakedUserId = faker.datatype.uuid()
            const fakedUserEmail = faker.datatype.uuid() + '@gmail.com'
            mockGithubUrls(fakedUserId, fakedUserEmail)

            const response = await agent.get('/api/auth/github?userType=staff')
            expect(response.statusCode).toEqual(302)

            const tokenResponse = await agent.get('/api/auth/github/callback?code=some_gh_code')

            expect(tokenResponse.statusCode).toEqual(200)
            expect(tokenResponse.body).toHaveProperty('accessToken')
            expect(tokenResponse.body).toHaveProperty('scope', 'openid')
            expect(tokenResponse.body).toHaveProperty('tokenType', 'Bearer')

            const userToken = tokenResponse.body.accessToken

            const oidcResponse = await agent.get('/oidc/me').set({
                'Authorization': 'Bearer ' + userToken,
            })

            const userExternalIdentity = await UserExternalIdentity.getOne(admin, { identityId: fakedUserId, userType: 'staff' })

            expect(oidcResponse.statusCode).toEqual(200)
            expect(oidcResponse.body).toHaveProperty('type', 'staff')
            expect(oidcResponse.body).toHaveProperty('isAdmin', false)
            expect(oidcResponse.body).toHaveProperty('isSupport', false)
            expect(oidcResponse.body).toHaveProperty('name', null)
            expect(oidcResponse.body).toHaveProperty('sub', userExternalIdentity.user.id)
        })
    })

    describe('SDK (custom) flow', () => {
        describe('validation', () => {
            test('Should fail if provider query parameter is missing', async () => {
                mockSdkProvider()

                const response = await agent.get('/api/auth/sdk?userType=staff&access-token=some_access_token')
                expect(response.statusCode).toEqual(400)
                expect(response.headers).not.toHaveProperty('set-cookie')
                expect(response.body).toHaveProperty('error', 'Missing provider query parameter')
                expect(response.body).toHaveProperty('message', 'Provider parameter is required')
            })

            test('Should fail if provider not registered as auth method', async () => {
                mockSdkProvider()

                const response = await agent.get('/api/auth/sdk?provider=abc-provider&userType=staff&access-token=some_access_token')
                expect(response.statusCode).toEqual(400)
                expect(response.headers).not.toHaveProperty('set-cookie')
                expect(response.body).toHaveProperty('error', 'abc-provider is not registered as auth method')
                expect(response.body).toHaveProperty('message', 'Wrong provider value')
            })
            test('Should fail if provider return empty profile', async () => {
                mockSdkProvider({})

                const response = await agent.get('/api/auth/sdk?provider=sdk-default&userType=staff&access-token=some_access_token')
                expect(response.statusCode).toEqual(400)
                expect(response.headers).not.toHaveProperty('set-cookie')
                expect(response.body).toHaveProperty('error', 'User profile empty response')
                expect(response.body).toHaveProperty('message', 'User profile returned empty object')
            })

            test('Should fail if provider missing required query parameter', async () => {
                mockSdkProvider()
                const response = await agent.get('/api/auth/sdk?provider=sdk-default&userType=staff')
                expect(response.statusCode).toEqual(403)
                expect(response.headers).not.toHaveProperty('set-cookie')
                expect(response.body).toHaveProperty('error', 'Missing access token')
                expect(response.body).toHaveProperty('message', 'Query parameter access-token is required')
            })
        })
        describe('trusted provider', () => {
            test('should create user and start authed session', async () => {
                const userProfile = mockSdkProvider({ sub: faker.datatype.uuid(), email: faker.datatype.uuid() + '@gmail.com' })
                const response = await agent.get('/api/auth/sdk?provider=sdk-default&userType=resident&access-token=some_access_token')
                expect(response.statusCode).toEqual(302)
                expect(response.headers['set-cookie']).toHaveLength(1)
                expect(response.headers.location).toMatch('/')

                const userExternalIdentity = await UserExternalIdentity.getOne(admin, {
                    identityId: userProfile.sub, identityType: 'sdk-default',
                })

                const providerMeta = {
                    id: userProfile.sub,
                    email: userProfile.email,
                    isEmailVerified: true,
                    provider: 'sdk-default',
                }

                expect(userExternalIdentity).toHaveProperty('user')
                expect(userExternalIdentity).toHaveProperty('userType', 'resident')
                expect(userExternalIdentity.meta).toMatchObject(providerMeta)

                const user = await UserAdmin.getOne(admin, { id: userExternalIdentity.user.id })
                expect(user).toHaveProperty('email', userProfile.email)
                expect(user).toHaveProperty('type', 'resident')
                expect(user).toHaveProperty('isEmailVerified', true)
                expect(user).toHaveProperty('isPhoneVerified', false)
                expect(user).toHaveProperty('isAdmin', false)
                expect(user).toHaveProperty('isSupport', false)
                expect(user.meta).toMatchObject(providerMeta)
            })

            test('should create user without any credentials', async () => {
                const userProfile = mockSdkProvider()
                const response = await agent.get('/api/auth/sdk?provider=sdk-default&userType=staff&access-token=some_access_token')

                expect(response.statusCode).toEqual(302)
                expect(response.headers['set-cookie']).toHaveLength(1)
                expect(response.headers.location).toMatch('/')

                const userExternalIdentity = await UserExternalIdentity.getOne(admin, {
                    identityId: userProfile.sub, identityType: 'sdk-default',
                })
                const providerMeta = {
                    id: userProfile.sub,
                    email: null,
                    provider: 'sdk-default',
                }

                expect(userExternalIdentity).toHaveProperty('user')
                expect(userExternalIdentity).toHaveProperty('userType', 'staff')
                expect(userExternalIdentity.meta).toMatchObject(providerMeta)

                const user = await UserAdmin.getOne(admin, { id: userExternalIdentity.user.id })
                expect(user).toHaveProperty('name', userProfile.name)
                expect(user).toHaveProperty('email', null)
                expect(user).toHaveProperty('phone', null)
                expect(user).toHaveProperty('type', 'staff')
                expect(user).toHaveProperty('isEmailVerified', false)
                expect(user).toHaveProperty('isPhoneVerified', false)
                expect(user.meta).toMatchObject(providerMeta)
            })

            test('should set isEmailVerified:false if provider sends this info', async () => {
                const userProfile = mockSdkProvider({
                    sub: faker.datatype.uuid(),
                    email: faker.datatype.uuid() + '@gmail.com',
                    isEmailVerified: false,
                })

                const response = await agent.get('/api/auth/sdk?provider=sdk-default&userType=staff&access-token=some_access_token')

                expect(response.statusCode).toEqual(302)
                expect(response.headers['set-cookie']).toHaveLength(1)
                expect(response.headers.location).toMatch('/')

                const userExternalIdentity = await UserExternalIdentity.getOne(admin, {
                    identityId: userProfile.sub, identityType: 'sdk-default',
                })
                const providerMeta = {
                    id: userProfile.sub,
                    email: userProfile.email,
                    isEmailVerified: false,
                    provider: 'sdk-default',
                }

                expect(userExternalIdentity).toHaveProperty('user')
                expect(userExternalIdentity).toHaveProperty('userType', 'staff')
                expect(userExternalIdentity.meta).toMatchObject(providerMeta)

                const user = await UserAdmin.getOne(admin, { id: userExternalIdentity.user.id })
                expect(user).toHaveProperty('email', userProfile.email)
                expect(user).toHaveProperty('phone', null)
                expect(user).toHaveProperty('type', 'staff')
                expect(user).toHaveProperty('isEmailVerified', false)
                expect(user).toHaveProperty('isPhoneVerified', false)
                expect(user.meta).toMatchObject(providerMeta)
            })
        })

        describe('untrusted provider', () => {
            test('should create user without email', async () => {
                const userProfile = mockSdkProvider({
                    sub: faker.datatype.uuid(),
                    email: faker.datatype.uuid() + '@gmail.com',
                    isEmailVerified: true,
                })

                const response = await agent.get('/api/auth/sdk?provider=sdk-untrusted&userType=staff&access-token=some_access_token')
                expect(response.statusCode).toEqual(302)
                expect(response.headers['set-cookie']).toHaveLength(1)
                expect(response.headers.location).toMatch('/')

                const userExternalIdentity = await UserExternalIdentity.getOne(admin, {
                    identityId: userProfile.sub, identityType: 'sdk-untrusted',
                })
                const providerMeta = {
                    id: userProfile.sub,
                    email: userProfile.email,
                    isEmailVerified: true,
                    provider: 'sdk-untrusted',
                }

                expect(userExternalIdentity).toHaveProperty('user')
                expect(userExternalIdentity).toHaveProperty('userType', 'staff')
                expect(userExternalIdentity.meta).toMatchObject(providerMeta)

                const user = await UserAdmin.getOne(admin, { id: userExternalIdentity.user.id })
                expect(user).toHaveProperty('email', null)
                expect(user).toHaveProperty('phone', null)
                expect(user).toHaveProperty('type', 'staff')
                expect(user).toHaveProperty('isEmailVerified', false)
                expect(user).toHaveProperty('isPhoneVerified', false)
                expect(user.meta).toMatchObject(providerMeta)
            })

            test('should not be connected to existing user with same email', async () => {
                const userProfile = mockSdkProvider({ sub: faker.datatype.uuid(), email: faker.datatype.uuid() + '@gmail.com' })
                const [existingUser] = await createTestUser(admin, { email: userProfile.email, isEmailVerified: true, type: 'staff' })
                const response = await agent.get('/api/auth/sdk?provider=sdk-untrusted&userType=staff&access-token=some_access_token')
                expect(response.statusCode).toEqual(302)
                expect(response.headers['set-cookie']).toHaveLength(1)
                expect(response.headers.location).toMatch('/')

                const userExternalIdentity = await UserExternalIdentity.getOne(admin, {
                    identityId: userProfile.sub, identityType: 'sdk-untrusted',
                })
                const providerMeta = {
                    id: userProfile.sub,
                    email: userProfile.email,
                    isEmailVerified: true,
                    provider: 'sdk-untrusted',
                }

                expect(userExternalIdentity).toHaveProperty('user')
                expect(userExternalIdentity).toHaveProperty('userType', 'staff')
                expect(userExternalIdentity.meta).toMatchObject(providerMeta)

                const user = await UserAdmin.getOne(admin, { id: userExternalIdentity.user.id })
                expect(user).toHaveProperty('email', null)
                expect(user).toHaveProperty('phone', null)
                expect(user).toHaveProperty('type', 'staff')
                expect(user).toHaveProperty('isEmailVerified', false)
                expect(user).toHaveProperty('isPhoneVerified', false)
                expect(user.meta).toMatchObject(providerMeta)
                expect(user.id).not.toEqual(existingUser.id)
            })
        })
    })

    describe.skip('OIDC flow', () => {
        describe('trusted provider', () => {
            test('should create user and return internal oidc token', async () => {
                const mockProvider = mockOidcProvider(oidcProviderUrl, '123')
                const { mockData: { userProfile } } = mockProvider

                const response = await agent.get('/api/auth/oidc-default?userType=resident')

                expect(response.statusCode).toEqual(302)

                const oidcAuthResponse = await axios.get(response.headers.location, { maxRedirects: 0 }).catch(e => e.response)

                expect(oidcAuthResponse.status).toBe(302)

                const callbackUrl = new URL(oidcAuthResponse.headers.location)


                const oidcCallbackUrl = callbackUrl.pathname + callbackUrl.search
                const callbackResponse = await agent.get(oidcCallbackUrl)

                expect(callbackResponse.statusCode).toEqual(200)
                expect(callbackResponse.body).toHaveProperty('accessToken')
                expect(callbackResponse.body).toHaveProperty('scope', 'openid')
                expect(callbackResponse.body).toHaveProperty('tokenType', 'Bearer')

                const userExternalIdentity = await UserExternalIdentity.getOne(admin, {
                    identityId: userProfile.sub,
                    identityType: 'oidc-default',
                })

                expect(userExternalIdentity.userType).toEqual('resident')
                expect(userExternalIdentity.meta).toMatchObject({
                    phone: null, email: userProfile.email, provider: 'oidc-default',
                })

                const createdUser = await UserAdmin.getOne(admin, {
                    id: userExternalIdentity.user.id,
                })

                expect(createdUser.meta).toMatchObject(userExternalIdentity.meta)
                expect(createdUser).toHaveProperty('isEmailVerified', true)
                expect(createdUser).toHaveProperty('email', userProfile.email)
                expect(createdUser).toHaveProperty('isAdmin', false)
                expect(createdUser).toHaveProperty('isSupport', false)
            })

            test('should set isEmailVerified:false if trusted provider sends this info', async () => {
                const mockProvider = mockOidcProvider(oidcProviderUrl, '123', {
                    email: faker.datatype.uuid() + '@gmail.com',
                    isEmailVerified: false,
                })
                const { mockData: { userProfile } } = mockProvider

                const response = await agent.get('/api/auth/oidc-default?userType=resident')
                expect(response.statusCode).toEqual(302)
                const oidcAuthResponse = await axios.get(response.headers.location, { maxRedirects: 0 }).catch(e => e.response)
                expect(oidcAuthResponse.status).toBe(302)

                const callbackUrl = new URL(oidcAuthResponse.headers.location)
                const callbackResponse = await agent.get(callbackUrl.pathname + callbackUrl.search)

                expect(callbackResponse.statusCode).toEqual(200)
                const userExternalIdentity = await UserExternalIdentity.getOne(admin, {
                    identityId: userProfile.sub,
                    identityType: 'oidc-default',
                })

                const createdUser = await UserAdmin.getOne(admin, { id: userExternalIdentity.user.id })

                expect(createdUser).toHaveProperty('email', userProfile.email)
                expect(createdUser).toHaveProperty('isEmailVerified', false)
                expect(createdUser.meta).toMatchObject({
                    id: userProfile.sub,
                    isPhoneVerified: true, isEmailVerified: false,
                    email: userProfile.email,
                    phone: null,
                    provider: 'oidc-default',
                })
            })

            test('should connect externalIdentity to existing user', async () => {
                const mockProvider = mockOidcProvider(oidcProviderUrl, '123', {
                    email: faker.datatype.uuid() + '@gmail.com',
                })
                const { mockData: { userProfile } } = mockProvider
                await createTestUser(admin, { email: userProfile.email, isEmailVerified: true, type: 'resident' })

                const existingUser = await UserAdmin.getOne(admin, { email: userProfile.email, isEmailVerified: true, type: 'resident' })

                const response = await agent.get('/api/auth/oidc-default?userType=resident')
                const oidcAuthResponse = await axios.get(response.headers.location, { maxRedirects: 0 }).catch(e => e.response)
                const callbackUrl = new URL(oidcAuthResponse.headers.location)
                const callbackResponse = await agent.get(callbackUrl.pathname + callbackUrl.search)

                expect(callbackResponse.statusCode).toEqual(200)

                const userExternalIdentity = await UserExternalIdentity.getOne(admin, {
                    identityId: userProfile.sub,
                    identityType: 'oidc-default',
                })

                // Connected to already created user with same email and type
                expect(userExternalIdentity.user.id).toEqual(existingUser.id)
                expect(userExternalIdentity.userType).toEqual('resident')
                expect(userExternalIdentity.meta).toMatchObject({
                    email: userProfile.email,
                    id: userProfile.sub,
                    provider: 'oidc-default',
                })

                // Also check if user is not updated on auth flow
                expect(existingUser).toHaveProperty('v', 1)
            })
        })

        describe('untrusted provider', () => {
            test('should create user without email', async () => {
                const mockProvider = mockOidcProvider(oidcProviderUrl, '123', {
                    email: faker.datatype.uuid() + '@gmail.com',
                    isEmailVerified: true,
                })

                const { mockData: { userProfile } } = mockProvider

                const response = await agent.get('/api/auth/oidc-untrusted?userType=staff')
                expect(response.statusCode).toEqual(302)

                const oidcAuthResponse = await axios.get(response.headers.location, { maxRedirects: 0 }).catch(e => e.response)

                expect(oidcAuthResponse.status).toBe(302)

                const callbackUrl = new URL(oidcAuthResponse.headers.location)

                const oidcCallbackUrl = callbackUrl.pathname + callbackUrl.search
                const callbackResponse = await agent.get(oidcCallbackUrl)

                expect(callbackResponse.statusCode).toEqual(200)

                const userExternalIdentity = await UserExternalIdentity.getOne(admin, {
                    identityId: userProfile.sub,
                    identityType: 'oidc-untrusted',
                })

                expect(userExternalIdentity.userType).toEqual('staff')
                expect(userExternalIdentity.meta).toMatchObject({
                    phone: null, email: userProfile.email, provider: 'oidc-untrusted',
                })

                const createdUser = await UserAdmin.getOne(admin, { id: userExternalIdentity.user.id })

                expect(createdUser.meta).toMatchObject(userExternalIdentity.meta)
                expect(createdUser).toHaveProperty('isEmailVerified', false)
                expect(createdUser).toHaveProperty('email', null)
                expect(createdUser).toHaveProperty('phone', null)
            })

            test('should not be connected to existing user with same email', async () => {
                const mockProvider = mockOidcProvider(oidcProviderUrl, '123', {
                    email: faker.datatype.uuid() + '@gmail.com',
                })
                const { mockData: { userProfile } } = mockProvider
                const [existingUser] = await createTestUser(admin, { email: userProfile.email, isEmailVerified: true, type: 'staff' })

                const response = await agent.get('/api/auth/oidc-untrusted?userType=staff')
                const oidcAuthResponse = await axios.get(response.headers.location, { maxRedirects: 0 }).catch(e => e.response)
                const callbackUrl = new URL(oidcAuthResponse.headers.location)
                const callbackResponse = await agent.get(callbackUrl.pathname + callbackUrl.search)
                expect(callbackResponse.statusCode).toEqual(200)

                const userExternalIdentity = await UserExternalIdentity.getOne(admin, { identityId: userProfile.sub, identityType: 'oidc-untrusted' })
                expect(userExternalIdentity.userType).toEqual('staff')

                const createdUser = await UserAdmin.getOne(admin, { id: userExternalIdentity.user.id })

                expect(createdUser.id).not.toEqual(existingUser.id)
                expect(createdUser).toHaveProperty('email', null)
                expect(createdUser).toHaveProperty('isEmailVerified', false)
                expect(createdUser.meta).toMatchObject({
                    id: userProfile.sub,
                    phone: null,
                    email: userProfile.email,
                    provider: 'oidc-untrusted',
                })
            })
        })
    })
})
