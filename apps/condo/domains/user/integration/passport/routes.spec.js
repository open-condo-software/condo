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
                    name: 'mobile-sdk',
                    strategy: 'oidcTokenUserInfo',
                    options: {
                        clients: {
                            'some-client-id': {
                                identityType: 'some-provider-name',
                                userInfoURL: 'https://oidc.auth.example.com/userInfo',
                                trustPhone: true,
                                trustEmail: true,
                            },
                        },
                    },
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
const { createTestEmail } = require('@condo/domains/user/utils/testSchema')

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

    beforeAll(async () => {
        const client = await makeClient()
        // NOTE: Not equal to conf['SERVER_URL'], since it runs separate KS in spec via setFakeClientMode
        agent = request.agent(client.serverUrl)
    })
    afterEach(() => {
        nock.cleanAll()
        syncUserSpy.mockClear()
    })
    afterAll(() => {
        nock.cleanAll()
        syncUserSpy.mockRestore()
    })

    describe.each([STAFF, RESIDENT])('%p', (userType) => {
        test('GitHub Strategy', async () => {
            const [userResponse, emailsResponse] = mockGithubEndpoints()
            const profile = mockGithubProfileGeneration(userResponse, emailsResponse)

            const authResponse = await agent.get(`/api/auth/github?userType=${userType}`)
            expect(authResponse.status).toEqual(302)
            expect(authResponse.headers).toHaveProperty('location')
            const redirectUrl = new URL(authResponse.headers.location)
            expect(redirectUrl.host).toEqual('github.com')
            expect(redirectUrl.pathname).toEqual('/login/oauth/authorize')
            expect(redirectUrl.searchParams.get('response_type')).toEqual('code')
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
        test('OIDC Token UserInfo', async () => {
            const [userResponse, emailsResponse] = mockGithubEndpoints()
            const profile = mockGithubProfileGeneration(userResponse, emailsResponse)

            const authResponse = await agent.get(`/api/auth/github?userType=${userType}`)
            expect(authResponse.status).toEqual(302)
            expect(authResponse.headers).toHaveProperty('location')
            const redirectUrl = new URL(authResponse.headers.location)
            expect(redirectUrl.host).toEqual('github.com')
            expect(redirectUrl.pathname).toEqual('/login/oauth/authorize')
            expect(redirectUrl.searchParams.get('response_type')).toEqual('code')
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
    })
})