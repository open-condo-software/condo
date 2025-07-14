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
            },
        ]

        if (name === 'PASSPORT_GITHUB') {
            return JSON.stringify(passportGithubConfig)
        }

        if (name === 'PASSPORT_OIDC') {
            return JSON.stringify(passportOidcConfig)
        }

        if (name === 'USER_EXTERNAL_IDENTITY_TYPES') {
            return '["github", "oidc-default"]'
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
    OidcClient,
    createTestOidcClient,
    updateTestOidcClient,
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

const mockOidcProvider = (baseUrl, clientId) => {
    const userProfile = {
        sub: faker.datatype.uuid(),
        name: 'John Doe',
        email: `${faker.datatype.uuid()}@gmail.com`,
        email_verified: true,
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

        const existingGithubClient = await OidcClient.getOne(admin, {
            clientId: 'github', deletedAt: null, isEnabled: true,
        })
        if (existingGithubClient) {
            await updateTestOidcClient(admin, existingGithubClient.id, { deletedAt: existingGithubClient.createdAt })
        }

        await createTestOidcClient(admin, {
            clientId: 'github',
            payload: {
                client_id: 'github',
                grant_types: ['implicit', 'authorization_code', 'refresh_token'],
                client_secret: faker.random.alphaNumeric(12),
                redirect_uris: ['https://httpbin.org/anything'],
                response_types: ['code id_token', 'code', 'id_token'],
                token_endpoint_auth_method: 'client_secret_basic',
            },
        })

        const existingOidcClient = await OidcClient.getOne(admin, {
            clientId: 'oidc-default', deletedAt: null, isEnabled: true,
        })
        if (existingOidcClient) {
            await updateTestOidcClient(admin, existingOidcClient.id, { deletedAt: existingOidcClient.createdAt })
        }
        await createTestOidcClient(admin, {
            clientId: 'oidc-default',
            payload: {
                client_id: 'oidc-default',
                grant_types: ['implicit', 'authorization_code', 'refresh_token'],
                client_secret: faker.random.alphaNumeric(12),
                redirect_uris: ['https://httpbin.org/anything'],
                response_types: ['code id_token', 'code', 'id_token'],
                token_endpoint_auth_method: 'client_secret_basic',
            },
        })

    })

    afterAll(async () => {
        nock.cleanAll()
        const oidcClients = await OidcClient.getAll(admin, { clientId_in: ['github', 'oidc-default'], deletedAt: null })

        for (const client of oidcClients) {
            await updateTestOidcClient(admin, client.id, { deletedAt: client.createdAt })
        }
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

        test('Should not create token if oidc client disabled or deleted', async () => {
            const fakedUserId = faker.datatype.uuid()
            const fakedUserEmail = faker.datatype.uuid() + '@gmail.com'
            mockGithubUrls(fakedUserId, fakedUserEmail)

            // Temporary disable github oidc client
            const githubClient = await OidcClient.getOne(admin, { clientId: 'github', deletedAt: null })
            await updateTestOidcClient(admin, githubClient.id, { isEnabled: false })

            const response = await agent.get('/api/auth/github?userType=staff')
            expect(response.statusCode).toEqual(302)

            const tokenResponse = await agent.get('/api/auth/github/callback?code=some_gh_code')
            expect(tokenResponse.statusCode).toEqual(403)
            expect(tokenResponse.body).toHaveProperty('error', 'Authentication failed')
            expect(tokenResponse.body).toHaveProperty('message', 'Oidc client not found')

            // Check deletedAt also restrict token creation
            await updateTestOidcClient(admin, githubClient.id, { isEnabled: true, deletedAt: new Date().toISOString() })

            mockGithubUrls(fakedUserId, fakedUserEmail)

            const response1 = await agent.get('/api/auth/github?userType=staff')
            expect(response1.statusCode).toEqual(302)

            const tokenResponse1 = await agent.get('/api/auth/github/callback?code=some_gh_code')
            expect(tokenResponse1.statusCode).toEqual(403)
            expect(tokenResponse1.body).toHaveProperty('error', 'Authentication failed')
            expect(tokenResponse1.body).toHaveProperty('message', 'Oidc client not found')

            // Rollback client settings
            await updateTestOidcClient(admin, githubClient.id, { isEnabled: true, deletedAt: null })
        })
    })

    describe('GitHub authentication flow', () => {
        test('should create user, userExternalIdentity and return oidc token', async () => {
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

            const userMeta = {
                email: fakedUserEmail,
                phone: null,
                provider: 'github',
            }

            const userExternalIdentity = await UserExternalIdentity.getOne(admin, { identityId: fakedUserId })
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

            userExternalIdentity = await UserExternalIdentity.getOne(admin, { identityId: fakedUserId })
            expect(userExternalIdentity).toBeUndefined()
            mockGithubUrls(fakedUserId, fakedUserEmail)

            // Register new user and external identity
            const loginResponse = await agent.get('/api/auth/github?userType=staff')
            expect(loginResponse.statusCode).toEqual(302)
            const response = await agent.get('/api/auth/github/callback?code=some_gh_code')
            expect(response.statusCode).toEqual(200)
            expect(response.body).toHaveProperty('accessToken')

            userExternalIdentity = await UserExternalIdentity.getOne(admin, { identityId: fakedUserId })
            expect(userExternalIdentity).toHaveProperty('identityType', 'github')
            expect(userExternalIdentity).toHaveProperty('user')
            expect(userExternalIdentity).toHaveProperty('userType', 'staff')

            user = await UserAdmin.getOne(admin, { id: userExternalIdentity.user.id })
            expect(user).toHaveProperty('email', fakedUserEmail.toLowerCase())

            // Call authorization flow second time to make sure it's not creating another user
            mockGithubUrls(fakedUserId, fakedUserEmail)
            await agent.get('/api/auth/github?userType=staff')
            const reauthResponse = await agent.get('/api/auth/github/callback?code=some_gh_code')
            expect(reauthResponse.statusCode).toEqual(200)
            expect(reauthResponse.body).toHaveProperty('accessToken')
            expect(reauthResponse.body.accessToken).not.toEqual(response.body.accessToken)

            const existingUserExternalIdentity = await UserExternalIdentity.getOne(admin, { identityId: fakedUserId })
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

            expect(staffTokenResponse.statusCode).toEqual(200)
            expect(staffTokenResponse.body).toHaveProperty('accessToken')

            const staffUserExternalIdentity = await UserExternalIdentity.getOne(admin, { identityId: fakedUserId, userType: 'staff' })
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

            expect(residentTokenResponse.statusCode).toEqual(200)
            expect(residentTokenResponse.body).toHaveProperty('accessToken')

            const residentUserExternalIdentity = await UserExternalIdentity.getOne(admin, { identityId: fakedUserId, userType: 'resident' })
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
            expect(residentTokenResponse.body.accessToken).not.toEqual(staffTokenResponse.body.accessToken)
        })

        test('should be able to make authorized request with oidc token', async () => {
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

    describe('OIDC authentication flow', () => {
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
    })
})
