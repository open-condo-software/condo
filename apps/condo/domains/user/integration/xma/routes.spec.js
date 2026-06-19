jest.mock('@open-condo/keystone/schema')
jest.mock('@condo/domains/user/utils/serverSchema')
jest.mock('@condo/domains/user/integration/xma/sync/syncUser')
jest.mock('@condo/domains/user/integration/xma/utils/validations')
jest.mock('@open-condo/config', () => {
    const conf = jest.requireActual('@open-condo/config')
    const mockConfig = jest.fn().mockImplementation((_, name) => {
        if (name === 'XMA_CONFIG') {
            return JSON.stringify([
                {
                    botId: '123456',
                    botToken: 'fake-bot-token-1',
                    allowedRedirectUrls: ['https://example.com', 'https://app.example.com'],
                    allowedUserType: 'resident',
                },
                {
                    botId: '234567',
                    botToken: 'fake-bot-token-2',
                    allowedRedirectUrls: ['https://example.com', 'https://app.example.com'],
                    allowedUserType: 'staff',
                },
            ])
        }
        return conf[name]
    })
    return new Proxy(conf, { get: mockConfig, set: jest.fn() })
})

const { faker } = require('@faker-js/faker')

const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { expectToThrowRawGQLError } = require('@open-condo/keystone/test.utils')

const { RESIDENT, STAFF } = require('@condo/domains/user/constants/common')
const { XmaRoutes } = require('@condo/domains/user/integration/xma/routes')
const { syncUser, getIdentity } = require('@condo/domains/user/integration/xma/sync/syncUser')
const { ERRORS } = require('@condo/domains/user/integration/xma/utils/errors')
const { getXmaAuthDataValidationError, isRedirectUrlValid } = require('@condo/domains/user/integration/xma/utils/validations')
const { User } = require('@condo/domains/user/utils/serverSchema')

const RESIDENT_BOT_ID = '123456'
const ALLOWED_REDIRECT_URLS = ['https://example.com', 'https://app.example.com']
// xmaAuthData as it appears in req.query: a percent-encoded query string
// _getXmaAuthData does decodeURIComponent(xmaAuthDataQP) then feeds it to URLSearchParams
const MOCK_XMA_AUTH_DATA_QP = 'user=%7B%22id%22%3A1%7D&auth_date=1234567890&hash=abc'


function createMockReqResNext (query = {}, user = null) {
    const req = {
        id: 'test_req_id',
        query: { botId: RESIDENT_BOT_ID, ...query },
        session: { save: jest.fn(), regenerate: jest.fn(() => null) },
        user,
        url: '/api/xma/auth?botId=123456',
    }
    const res = {
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        end: jest.fn(),
    }
    req.res = res
    res.req = req
    return {
        req,
        res,
        next: jest.fn(),
    }
}

function createMockContext (token) {
    return {
        knex: jest.fn(),
        _sessionManager: {
            startAuthedSession: jest.fn().mockResolvedValue(token),
            endAuthedSession: jest.fn(),
        },
        lists: {
            User: {},
        },
    }
}

describe('XmaRoutes', () => {
    const MOCK_AUTH_TOKEN = faker.random.alphaNumeric(10)
    const MOCK_USER = {
        id: faker.random.alphaNumeric(10),
        type: RESIDENT,
        isSupport: false,
        isAdmin: false,
    }

    let routes
    let mockContext

    beforeEach(() => {
        mockContext = createMockContext(MOCK_AUTH_TOKEN)
        getSchemaCtx.mockReturnValue({ keystone: mockContext })
        User.getOne.mockImplementation(async () => ({ ...MOCK_USER }))
        syncUser.mockResolvedValue({ id: MOCK_USER.id })
        getXmaAuthDataValidationError.mockReturnValue(null)
        isRedirectUrlValid.mockImplementation(jest.requireActual('@condo/domains/user/integration/xma/utils/validations').isRedirectUrlValid)

        routes = new XmaRoutes()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('startAuth', () => {
        const mockUserId = faker.random.alphaNumeric(10)
        const expectRedirectToCallback = expect.stringContaining(`xma/auth/callback?botId=${RESIDENT_BOT_ID}`)
        // NOTE: Mirror the Telegram flow: condo redirects to a relative "/auth" with the "next" param.
        // The resident-app XMA proxy injects "authFlow=needAuth" and rewrites "next" to keep the browser
        // on the resident-app domain (so condo sees the session cookie created during phone auth).
        const expectRedirectToAuthPage = expect.stringMatching(/^\/auth\?next=.*userType=/)

        const testCases = [
            {
                name: 'identity exists, user is authorized, user id and type matches — redirect to callback',
                identity: { user: { id: mockUserId, userType: RESIDENT } },
                user: { id: mockUserId, type: RESIDENT },
                expectedRedirect: expectRedirectToCallback,
            },
            {
                name: 'identity exists, user is authorized, id does not match — logout and redirect to /auth',
                identity: { user: { id: mockUserId, userType: RESIDENT } },
                user: { id: faker.random.alphaNumeric(10), type: RESIDENT },
                expectedRedirect: expectRedirectToAuthPage,
                expectedToEndSession: true,
            },
            {
                name: 'identity exists, user is authorized, is superuser — logout and redirect to /auth',
                identity: { user: { id: mockUserId, userType: RESIDENT } },
                user: { id: mockUserId, type: RESIDENT, isAdmin: true },
                expectedRedirect: expectRedirectToAuthPage,
                expectedToEndSession: true,
            },
            {
                name: 'identity exists, user is authorized, wrong userType — logout and redirect to /auth',
                identity: { user: { id: mockUserId, userType: RESIDENT } },
                user: { id: mockUserId, type: STAFF },
                expectedRedirect: expectRedirectToAuthPage,
                expectedToEndSession: true,
            },
            {
                name: 'identity does not exist, user is not authorized — redirect to /auth',
                expectedRedirect: expectRedirectToAuthPage,
            },
            {
                name: 'identity does not exist, wrong userType — logout and redirect to /auth',
                user: { id: mockUserId, type: STAFF },
                expectedRedirect: expectRedirectToAuthPage,
                expectedToEndSession: true,
            },
            {
                name: 'identity does not exist, user is superuser — logout and redirect to /auth',
                user: { id: mockUserId, type: RESIDENT, isAdmin: true },
                expectedRedirect: expectRedirectToAuthPage,
                expectedToEndSession: true,
            },
            {
                name: 'identity does not exist, user is authorized and valid — redirect to callback',
                user: { id: mockUserId, type: RESIDENT },
                expectedRedirect: expectRedirectToCallback,
            },
        ]

        test.each(testCases)('$name', async ({ identity, query, user, expectedRedirect, expectedToEndSession }) => {
            const { req, res, next } = createMockReqResNext({
                userType: RESIDENT,
                redirectUrl: ALLOWED_REDIRECT_URLS[0],
                xmaAuthData: MOCK_XMA_AUTH_DATA_QP,
                ...query,
            }, user)
            getIdentity.mockResolvedValueOnce(identity)
            await routes.startAuth(req, res, next)
            expect(res.redirect.mock.calls[0][0].toString()).toEqual(expectedRedirect)
            expect(mockContext._sessionManager.endAuthedSession).toHaveBeenCalledTimes(expectedToEndSession ? 1 : 0)
        })

        test('should encode redirectUrl before putting it into callback query param', async () => {
            const originalRedirectUrl = 'https://app.example.com?foo=bar%20baz'
            const expectedEncodedRedirectUrl = encodeURIComponent(originalRedirectUrl)

            const user = { id: mockUserId, type: RESIDENT }
            getIdentity.mockResolvedValueOnce({ user: { id: mockUserId, userType: RESIDENT } })

            const { req, res, next } = createMockReqResNext({
                userType: RESIDENT,
                redirectUrl: originalRedirectUrl,
                xmaAuthData: MOCK_XMA_AUTH_DATA_QP,
            }, user)

            await routes.startAuth(req, res, next)

            const callbackUrl = new URL(res.redirect.mock.calls[0][0].toString())
            expect(callbackUrl.searchParams.get('redirectUrl')).toEqual(expectedEncodedRedirectUrl)
        })
    })

    describe('completeAuth', () => {

        test('should successfully complete auth and redirect', async () => {
            const [redirectUrl] = ALLOWED_REDIRECT_URLS
            const { req, res, next } = createMockReqResNext({
                redirectUrl,
                userType: MOCK_USER.type,
                xmaAuthData: MOCK_XMA_AUTH_DATA_QP,
            })

            await routes.completeAuth(req, res, next)

            expect(next).not.toHaveBeenCalled()
            expect(res.redirect.mock.calls[0][0].toString()).toEqual(redirectUrl)
            expect(syncUser).toHaveBeenCalled()
            expect(User.getOne).toHaveBeenCalled()
            expect(next).not.toHaveBeenCalled()
        })

        test('should decode percent-encoded redirect url from callback query', async () => {
            const redirectUrl = 'https://app.example.com?foo=bar%20baz'
            const { req, res, next } = createMockReqResNext({
                redirectUrl: encodeURIComponent(redirectUrl),
                userType: MOCK_USER.type,
                xmaAuthData: MOCK_XMA_AUTH_DATA_QP,
            })

            await routes.completeAuth(req, res, next)

            expect(res.redirect).toHaveBeenCalledWith(redirectUrl)
        })

        test('should return error for super users', async () => {
            const { req, res, next } = createMockReqResNext({
                redirectUrl: ALLOWED_REDIRECT_URLS[0],
                userType: MOCK_USER.type,
                xmaAuthData: MOCK_XMA_AUTH_DATA_QP,
            })
            User.getOne.mockResolvedValueOnce({
                ...MOCK_USER,
                isSupport: true,
            })

            await expectToThrowRawGQLError(async () => {
                await routes.completeAuth(req, res, next)
            }, ERRORS.SUPER_USERS_NOT_ALLOWED)

            expect(res.redirect).not.toHaveBeenCalled()
        })
    })

    describe('_validateParameters', () => {

        const testCases = [
            {
                name: 'should call next with error for invalid redirect URL',
                reqResNextParams: {
                    redirectUrl: 'https://invalid.com',
                    userType: MOCK_USER.type,
                    xmaAuthData: MOCK_XMA_AUTH_DATA_QP,
                },
                expectedError: ERRORS.INVALID_REDIRECT_URL,
            },
            {
                name: 'should return error for unsupported user type',
                reqResNextParams: {
                    redirectUrl: ALLOWED_REDIRECT_URLS[0],
                    userType: STAFF,
                    xmaAuthData: MOCK_XMA_AUTH_DATA_QP,
                },
                expectedError: ERRORS.NOT_SUPPORTED_USER_TYPE,
            },
            {
                name: 'should call next with error when auth data validation fails',
                reqResNextParams: {
                    redirectUrl: ALLOWED_REDIRECT_URLS[0],
                    userType: MOCK_USER.type,
                    xmaAuthData: MOCK_XMA_AUTH_DATA_QP,
                },
                beforeCall: () => getXmaAuthDataValidationError.mockReturnValueOnce(ERRORS.VALIDATION_AUTH_DATA_SIGN_INVALID),
                expectedError: ERRORS.VALIDATION_AUTH_DATA_SIGN_INVALID,
            },
        ]

        test.each(testCases)('$name', async ({ reqResNextParams, expectedError, beforeCall }) => {
            const { req, res, next } = createMockReqResNext(reqResNextParams)
            await beforeCall?.()
            await expectToThrowRawGQLError(async () => {
                await routes._validateParameters(req, res, next)
            }, expectedError)
            expect(res.redirect).not.toHaveBeenCalled()
        })
    })

    describe('authorizeUser', () => {
        describe('does not authorize super users', () => {
            const { req, res } = createMockReqResNext()

            const users = [
                { isSupport: true, isAdmin: false, rightsSet: false },
                { isSupport: false, isAdmin: true, rightsSet: false },
                { isSupport: false, isAdmin: false, rightsSet: true },
                { isSupport: true, isAdmin: true, rightsSet: true },
            ].map(user => ({ ...MOCK_USER, ...user }))
                .flatMap(user => [
                    { ...user, type: 'staff' },
                    { ...user, type: 'resident' },
                ])

            test.each(users)('isSupport:$isSupport isAdmin:$isAdmin type:$type rightsSet:$rightsSet', async (user) => {
                User.getOne.mockResolvedValueOnce(user)
                await expectToThrowRawGQLError(async () => {
                    await routes.authorizeUser(req, mockContext, user.id)
                }, ERRORS.SUPER_USERS_NOT_ALLOWED)
                expect(res.redirect).not.toHaveBeenCalled()
            })
        })
    })
})
