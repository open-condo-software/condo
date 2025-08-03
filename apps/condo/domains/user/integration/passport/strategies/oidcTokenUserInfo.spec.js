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
                            'some-client-id': {
                                identityType: 'some-provider-name',
                                userInfoURL: 'https://oidc.auth.example.com/userInfo',
                                trustPhone: true,
                                trustEmail: false,
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

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const nock = require('nock')
const request = require('supertest')

const { HTTPStatusByGQLErrorCode } = require('@open-condo/keystone/errors')
const { setFakeClientMode, makeClient } = require('@open-condo/keystone/test.utils')

const { RESIDENT, STAFF } = require('@condo/domains/user/constants/common')
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

function mockUserInfoEndpoint (userInfoURL) {
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

    const u = new URL(userInfoURL)
    nock(u.origin)
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

    let agent
    let serverUrl

    beforeAll(async () => {
        const client = await makeClient()
        // NOTE: Not equal to conf['SERVER_URL'], since it runs separate KS in spec via setFakeClientMode
        serverUrl = client.serverUrl
    })
    beforeEach( () => {
        agent = request.agent(serverUrl)
    })

    afterEach(() => {
        nock.cleanAll()
        syncUserSpy.mockClear()
    })
    afterAll(() => {
        nock.cleanAll()
        syncUserSpy.mockRestore()
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
            client_id: 'some-client-id',
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
                    client_id: 'some-client-id',
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
    })
})