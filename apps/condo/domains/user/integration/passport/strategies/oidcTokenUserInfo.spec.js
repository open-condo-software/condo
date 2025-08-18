jest.resetModules()
jest.mock('@open-condo/config', () => {
    const conf = jest.requireActual('@open-condo/config')

    const getter = (_, name) => {
        if (name === 'PASSPORT_CONFIG') {
            return JSON.stringify([
                {
                    name: 'test-oidc-token',
                    strategy: 'oidcTokenUserInfo',
                    options: {
                        clients: {
                            'trusted-client': {
                                identityType: 'some-provider-name',
                                userInfoURL: 'https://oidc.auth.example.com/userInfo',
                                trustPhone: true,
                                trustEmail: false,
                                requireConfirmPhoneAction: false,
                                requireConfirmEmailAction: false,
                            },
                            'require-sms-client': {
                                identityType: 'some-provider-name',
                                userInfoURL: 'https://oidc.auth.example.com/userInfo',
                                trustPhone: false,
                                trustEmail: false,
                                requireConfirmPhoneAction: true,
                                requireConfirmEmailAction: false,
                            },
                            'require-email-client': {
                                identityType: 'some-provider-name',
                                userInfoURL: 'https://oidc.auth.example.com/userInfo',
                                trustPhone: false,
                                trustEmail: false,
                                requireConfirmPhoneAction: false,
                                requireConfirmEmailAction: true,
                            },
                        },
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
const getExistingUserIdentitySpy = jest.spyOn(userUtils, 'getExistingUserIdentity')

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const nock = require('nock')
const request = require('supertest')

const { HTTPStatusByGQLErrorCode } = require('@open-condo/keystone/errors')
const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { RESIDENT, STAFF } = require('@condo/domains/user/constants/common')
const {
    createTestConfirmPhoneAction,
    updateTestConfirmPhoneAction,
    createTestConfirmEmailAction,
    updateTestConfirmEmailAction,
} = require('@condo/domains/user/utils/testSchema')
const { createTestPhone, createTestEmail } = require('@condo/domains/user/utils/testSchema')

function expectGQLErrorResponse (response, errorFields) {
    const status = HTTPStatusByGQLErrorCode[errorFields.code] || 500
    expect(response.status).toEqual(status)
    const body = JSON.parse(response.text)
    expect(body).toEqual({
        errors: [
            expect.objectContaining({
                name: 'GQLError',
                message: expect.stringContaining(''),
                reqId: expect.stringContaining(''),
                errId: expect.stringContaining(''),
                extensions: expect.objectContaining(errorFields),
            }),
        ],
    })
}

function expectAuthCookie (response) {
    expect(response.headers).toHaveProperty('set-cookie')
    expect(response.headers['set-cookie']).toHaveLength(1)
    const cookieValue = response.headers['set-cookie'][0]
    expect(cookieValue).toContain('keystone.sid')
    expect(cookieValue).toContain('HttpOnly;')
}

function mockUserInfoEndpoint (userInfoURL, userData = {}) {
    const userProfile = {
        sub: faker.datatype.uuid(),
        name: faker.name.fullName(),
        phone_number: createTestPhone(),
        phone_number_verified: true,
        email: createTestEmail(),
        email_verified: Math.random() > 0.5,
        ...userData,
    }

    function dummyJSONToToken (obj) {
        return Buffer.from(JSON.stringify(obj), 'utf-8').toString('base64')
    }
    function dummyTokenToJSON (token) {
        const json = Buffer.from(token, 'base64').toString('utf8')
        return JSON.parse(json)
    }

    const token = dummyJSONToToken(userProfile)

    const u = new URL(userInfoURL)
    nock(u.origin)
        .persist()
        .matchHeader('Authorization', `Bearer ${token}`)
        .get(u.pathname)
        .reply(function () {
            const token = this.req.headers.authorization.split(' ')[1]
            try {
                return [200, dummyTokenToJSON(token)]
            } catch {
                return [500, {}]
            }
        })

    return [userProfile, token]
}

describe('OidcTokenUserInfoAuthStrategy custom strategy E2E tests', () => {
    setFakeClientMode(index)

    let admin
    let agent
    let serverUrl

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        // NOTE: Not equal to conf['SERVER_URL'], since it runs separate KS in spec via setFakeClientMode
        serverUrl = admin.serverUrl
    })
    beforeEach( () => {
        // NOTE: x-forwarded-for + trust proxy = bypass rate-limits during tests
        agent = request.agent(serverUrl).set('x-forwarded-for', faker.internet.ip())
    })

    afterEach(() => {
        nock.cleanAll()
        syncUserSpy.mockClear()
        getExistingUserIdentitySpy.mockClear()
    })
    afterAll(() => {
        nock.cleanAll()
        syncUserSpy.mockRestore()
        getExistingUserIdentitySpy.mockRestore()
    })

    describe('Auth endpoint', () => {
        test('Must redirect on callback keeping all query parameters', async () => {
            const queryPayload = {
                user_type: RESIDENT,
                access_token: faker.random.alphaNumeric(32),
                client_id: faker.random.alphaNumeric(12),
                [faker.random.alphaNumeric(12)]: faker.random.alphaNumeric(12),
            }
            const searchString = new URLSearchParams(queryPayload).toString()
            const authResponse = await agent.get(`/api/auth/test-oidc-token?${searchString}`)
            expect(authResponse.status).toEqual(302)
            expect(authResponse.headers).toHaveProperty('location', `/api/auth/test-oidc-token/callback?${searchString}`)
        })
    })
    describe('Callback endpoint', () => {
        const validQuery = {
            access_token: faker.random.alphaNumeric(32),
            client_id: 'trusted-client',
        }
        test.each(Object.keys(validQuery))('Must require single "%p" as query-parameter', async (paramName) => {
            const omitSearch = new URLSearchParams({
                user_type: RESIDENT,
                ...validQuery,
            })
            omitSearch.delete(paramName)
            const omitCallbackResponse = await agent.get(`/api/auth/test-oidc-token/callback?${omitSearch.toString()}`)
            expectGQLErrorResponse(omitCallbackResponse, {
                code: 'BAD_USER_INPUT',
                type: 'MISSING_QUERY_PARAMETER',
                messageInterpolation: {
                    parameter: paramName,
                },
            })

            const duplicateSearch = new URLSearchParams({
                user_type: RESIDENT,
                ...validQuery,
            })
            duplicateSearch.append(paramName, validQuery[paramName])

            const duplicateCallbackResponse = await agent.get(`/api/auth/test-oidc-token/callback?${duplicateSearch.toString()}`)
            expectGQLErrorResponse(duplicateCallbackResponse, {
                code: 'BAD_USER_INPUT',
                type: 'INVALID_PARAMETER',
                messageInterpolation: {
                    parameter: paramName,
                },
            })
        })
        test('Must accept only known client_id parameters', async () => {
            const search = new URLSearchParams({
                user_type: RESIDENT,
                ...validQuery,
                client_id: faker.random.alphaNumeric(32),
            })

            const callbackResponse = await agent.get(`/api/auth/test-oidc-token/callback?${search.toString()}`)
            expectGQLErrorResponse(callbackResponse, {
                code: 'BAD_USER_INPUT',
                type: 'INVALID_PARAMETER',
                messageInterpolation: {
                    parameter: 'client_id',
                },
            })
        })
        describe('Must request userInfo with specified token and call syncUser', () => {
            test.each([RESIDENT, STAFF])('%p', async (userType) => {
                const [userProfile, token] = mockUserInfoEndpoint('https://oidc.auth.example.com/userInfo')
                const search = new URLSearchParams({
                    user_type: userType,
                    client_id: 'trusted-client',
                    access_token: token,
                })
                const callbackResponse = await agent.get(`/api/auth/test-oidc-token/callback?${search.toString()}`)
                expect(callbackResponse).toHaveProperty('status', 302)
                expect(callbackResponse.headers).toHaveProperty('location', '/')
                expectAuthCookie(callbackResponse)

                expect(syncUserSpy).toHaveBeenCalledTimes(1)
                const [, syncProfile, syncUserType, providerInfo, fieldMapping] = syncUserSpy.mock.calls[0]
                expect(syncUserType).toEqual(userType)
                expect(providerInfo).toEqual({
                    name: 'some-provider-name',
                    trustEmail: false,
                    trustPhone: true,
                })
                expect(fieldMapping).toEqual(undefined)
                expect(syncProfile).toEqual(userProfile)
            })
        })
        describe('Must require ConfirmPhoneAction on first authentication if requireConfirmPhoneAction is set to "true". Phone from action must be prioritized over userProfile one', () => {
            describe.each([RESIDENT, STAFF])('%p',  (userType) => {
                test.each([true, false])('phone_number_verified: %p', async (phoneVerified) => {
                    const [userProfile, token] = mockUserInfoEndpoint('https://oidc.auth.example.com/userInfo', { phone_number_verified: phoneVerified })
                    expect(userProfile.phone_number_verified).toEqual(phoneVerified)
                    const search = new URLSearchParams({
                        user_type: userType,
                        client_id: 'require-sms-client',
                        access_token: token,
                    })

                    const confirmedPhone = createTestPhone()
                    expect(confirmedPhone).not.toEqual(userProfile.phone_number)

                    const noCodeCallbackResponse = await agent.get(`/api/auth/test-oidc-token/callback?${search.toString()}`)
                    expect(noCodeCallbackResponse).toHaveProperty('status', 400)
                    expectGQLErrorResponse(noCodeCallbackResponse, {
                        code: 'BAD_USER_INPUT',
                        type: 'MISSING_QUERY_PARAMETER',
                        messageInterpolation: {
                            parameter: 'confirm_phone_action_token',
                        },
                    })

                    const [nonVerifiedAction] = await createTestConfirmPhoneAction(admin, { phone: confirmedPhone })
                    search.set('confirm_phone_action_token', nonVerifiedAction.token)

                    const nonVerifiedCodeResponse = await agent.get(`/api/auth/test-oidc-token/callback?${search.toString()}`)
                    expect(nonVerifiedCodeResponse).toHaveProperty('status', 400)
                    expectGQLErrorResponse(nonVerifiedCodeResponse, {
                        code: 'BAD_USER_INPUT',
                        type: 'INVALID_PARAMETER',
                        messageInterpolation: {
                            parameter: 'confirm_phone_action_token',
                        },
                    })

                    await updateTestConfirmPhoneAction(admin, nonVerifiedAction.id, {
                        isPhoneVerified: true,
                    })

                    const successFirstAuthResponse = await agent.get(`/api/auth/test-oidc-token/callback?${search.toString()}`)
                    expect(successFirstAuthResponse).toHaveProperty('status', 302)
                    expect(successFirstAuthResponse.headers).toHaveProperty('location', '/')

                    expect(getExistingUserIdentitySpy).toHaveBeenCalledTimes(3)
                    expect(syncUserSpy).toHaveBeenCalledTimes(1)
                    const [, syncProfile, syncUserType, providerInfo, fieldMapping] = syncUserSpy.mock.calls[0]
                    expect(syncUserType).toEqual(userType)
                    expect(providerInfo).toEqual({
                        name: 'some-provider-name',
                        trustEmail: false,
                        trustPhone: true,
                    })
                    expect(fieldMapping).toEqual(undefined)
                    expect(syncProfile).toEqual({
                        ...userProfile,
                        phone_number: confirmedPhone,
                        phone_number_verified: true,
                    })

                    const syncedUserId = (await syncUserSpy.mock.results[0].value).id
                    expect(syncedUserId).toBeDefined()


                    search.delete('confirm_phone_action_token')
                    const successSecondAuthResponse = await agent.get(`/api/auth/test-oidc-token/callback?${search.toString()}`)
                    expect(successSecondAuthResponse).toHaveProperty('status', 302)
                    expect(successSecondAuthResponse.headers).toHaveProperty('location', '/')

                    expect(syncUserSpy).toHaveBeenCalledTimes(1)
                    expect(getExistingUserIdentitySpy).toHaveBeenCalledTimes(4)
                    const [, identityProfile, identityUserType, identityProviderInfo, identityFieldMapping] = getExistingUserIdentitySpy.mock.calls[3]
                    expect(identityUserType).toEqual(userType)
                    expect(identityProviderInfo).toEqual({
                        name: 'some-provider-name',
                        trustEmail: false,
                        trustPhone: false,
                    })
                    expect(identityFieldMapping).toEqual(undefined)
                    expect(identityProfile).toEqual(userProfile)

                    const foundIdentity = await getExistingUserIdentitySpy.mock.results[3].value
                    expect(foundIdentity).toHaveProperty(['user', 'id'], syncedUserId)
                })
            })
        })
        describe('Must require ConfirmEmailAction on first authentication if requireConfirmEmailAction is set to "true". Email from action must be prioritized over userProfile one', () => {
            describe.each([RESIDENT, STAFF])('%p',  (userType) => {
                test.each([true, false])('email_verified: %p', async (emailVerified) => {
                    const [userProfile, token] = mockUserInfoEndpoint('https://oidc.auth.example.com/userInfo', { email_verified: emailVerified })
                    expect(userProfile.email_verified).toEqual(emailVerified)
                    const search = new URLSearchParams({
                        user_type: userType,
                        client_id: 'require-email-client',
                        access_token: token,
                    })

                    const confirmedEmail = createTestEmail()
                    expect(confirmedEmail).not.toEqual(userProfile.email)

                    const noCodeCallbackResponse = await agent.get(`/api/auth/test-oidc-token/callback?${search.toString()}`)
                    expect(noCodeCallbackResponse).toHaveProperty('status', 400)
                    expectGQLErrorResponse(noCodeCallbackResponse, {
                        code: 'BAD_USER_INPUT',
                        type: 'MISSING_QUERY_PARAMETER',
                        messageInterpolation: {
                            parameter: 'confirm_email_action_token',
                        },
                    })

                    const [nonVerifiedAction] = await createTestConfirmEmailAction(admin, { email: confirmedEmail })
                    search.set('confirm_email_action_token', nonVerifiedAction.token)

                    const nonVerifiedCodeResponse = await agent.get(`/api/auth/test-oidc-token/callback?${search.toString()}`)
                    expect(nonVerifiedCodeResponse).toHaveProperty('status', 400)
                    expectGQLErrorResponse(nonVerifiedCodeResponse, {
                        code: 'BAD_USER_INPUT',
                        type: 'INVALID_PARAMETER',
                        messageInterpolation: {
                            parameter: 'confirm_email_action_token',
                        },
                    })

                    await updateTestConfirmEmailAction(admin, nonVerifiedAction.id, {
                        isEmailVerified: true,
                    })

                    const successFirstAuthResponse = await agent.get(`/api/auth/test-oidc-token/callback?${search.toString()}`)
                    expect(successFirstAuthResponse).toHaveProperty('status', 302)
                    expect(successFirstAuthResponse.headers).toHaveProperty('location', '/')

                    expect(getExistingUserIdentitySpy).toHaveBeenCalledTimes(3)
                    expect(syncUserSpy).toHaveBeenCalledTimes(1)
                    const [, syncProfile, syncUserType, providerInfo, fieldMapping] = syncUserSpy.mock.calls[0]
                    expect(syncUserType).toEqual(userType)
                    expect(providerInfo).toEqual({
                        name: 'some-provider-name',
                        trustEmail: true,
                        trustPhone: false,
                    })
                    expect(fieldMapping).toEqual(undefined)
                    expect(syncProfile).toEqual({
                        ...userProfile,
                        email: confirmedEmail,
                        email_verified: true,
                    })

                    const syncedUserId = (await syncUserSpy.mock.results[0].value).id
                    expect(syncedUserId).toBeDefined()


                    search.delete('confirm_email_action_token')
                    const successSecondAuthResponse = await agent.get(`/api/auth/test-oidc-token/callback?${search.toString()}`)
                    expect(successSecondAuthResponse).toHaveProperty('status', 302)
                    expect(successSecondAuthResponse.headers).toHaveProperty('location', '/')

                    expect(syncUserSpy).toHaveBeenCalledTimes(1)
                    expect(getExistingUserIdentitySpy).toHaveBeenCalledTimes(4)
                    const [, identityProfile, identityUserType, identityProviderInfo, identityFieldMapping] = getExistingUserIdentitySpy.mock.calls[3]
                    expect(identityUserType).toEqual(userType)
                    expect(identityProviderInfo).toEqual({
                        name: 'some-provider-name',
                        trustEmail: false,
                        trustPhone: false,
                    })
                    expect(identityFieldMapping).toEqual(undefined)
                    expect(identityProfile).toEqual(userProfile)

                    const foundIdentity = await getExistingUserIdentitySpy.mock.results[3].value
                    expect(foundIdentity).toHaveProperty(['user', 'id'], syncedUserId)
                })
            })
        })
    })
})