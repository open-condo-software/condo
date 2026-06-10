jest.mock('@open-condo/keystone/schema')
jest.mock('@condo/domains/user/utils/serverSchema')
jest.mock('@condo/domains/user/integration/max/sync/syncUser')
jest.mock('@condo/domains/user/integration/max/utils/validations')
jest.mock('@open-condo/config', () => {
    const conf = jest.requireActual('@open-condo/config')
    const mockConfig = jest.fn().mockImplementation((_, name) => {
        if (name === 'MAX_OAUTH_CONFIG') {
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

const { RESIDENT, STAFF } = require('@condo/domains/user/constants/common')
const { MaxOauthRoutes } = require('@condo/domains/user/integration/max/routes')
const { syncUser, getIdentity } = require('@condo/domains/user/integration/max/sync/syncUser')
const { ERRORS, HttpError } = require('@condo/domains/user/integration/max/utils/errors')
const { getMaxAuthDataValidationError, isRedirectUrlValid } = require('@condo/domains/user/integration/max/utils/validations')
const { User } = require('@condo/domains/user/utils/serverSchema')

const RESIDENT_BOT_ID = '123456'
const ALLOWED_REDIRECT_URLS = ['https://example.com', 'https://app.example.com']
// maxAuthData as it appears in req.query: a percent-encoded query string
// _getMaxAuthData does decodeURIComponent(maxAuthDataQP) then feeds it to URLSearchParams
const MOCK_MAX_AUTH_DATA_QP = 'user=%7B%22id%22%3A1%7D&auth_date=1234567890&hash=abc'

function expectResultError (res, error) {
    expect(res.status).toHaveBeenCalledWith(error.statusCode)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error }))
}

function createMockReqResNext (query = {}, user = null) {
    const req = {
        id: 'test_req_id',
        query: { botId: RESIDENT_BOT_ID, ...query },
        session: { save: jest.fn(), regenerate: jest.fn(() => null) },
        user,
        url: '/api/max/auth?botId=123456',
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

describe('MaxOauthRoutes', () => {
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
        getMaxAuthDataValidationError.mockReturnValue(null)
        isRedirectUrlValid.mockImplementation(jest.requireActual('@condo/domains/user/integration/max/utils/validations').isRedirectUrlValid)

        routes = new MaxOauthRoutes()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('startAuth', () => {
        const mockUserId = faker.random.alphaNumeric(10)
        const expectRedirectToCallback = expect.stringContaining(`max/auth/callback?botId=${RESIDENT_BOT_ID}`)
        // NOTE: "authFlow=needAuth" is required to show the phone form on resident-app auth page
        // instead of restarting the Max auth flow (infinite redirect loop otherwise)
        const expectRedirectToAuthPage = expect.stringMatching(/\/auth\?.*authFlow=needAuth/)

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
                maxAuthData: MOCK_MAX_AUTH_DATA_QP,
                ...query,
            }, user)
            getIdentity.mockResolvedValueOnce(identity)
            await routes.startAuth(req, res, next)
            expect(res.redirect.mock.calls[0][0].toString()).toEqual(expectedRedirect)
            expect(mockContext._sessionManager.endAuthedSession).toHaveBeenCalledTimes(expectedToEndSession ? 1 : 0)
        })
    })

    describe('completeAuth', () => {

        test('should successfully complete auth and redirect', async () => {
            const [redirectUrl] = ALLOWED_REDIRECT_URLS
            const { req, res, next } = createMockReqResNext({
                redirectUrl,
                userType: MOCK_USER.type,
                maxAuthData: MOCK_MAX_AUTH_DATA_QP,
            })

            await routes.completeAuth(req, res, next)

            expect(next).not.toHaveBeenCalled()
            expect(res.redirect.mock.calls[0][0].toString()).toEqual(redirectUrl)
            expect(syncUser).toHaveBeenCalled()
            expect(User.getOne).toHaveBeenCalled()
            expect(next).not.toHaveBeenCalled()
        })

        test('should return error for super users', async () => {
            const { req, res, next } = createMockReqResNext({
                redirectUrl: ALLOWED_REDIRECT_URLS[0],
                userType: MOCK_USER.type,
                maxAuthData: MOCK_MAX_AUTH_DATA_QP,
            })
            User.getOne.mockResolvedValueOnce({
                ...MOCK_USER,
                isSupport: true,
            })

            await routes.completeAuth(req, res, next)
            expectResultError(res, new HttpError(ERRORS.SUPER_USERS_NOT_ALLOWED).toJSON())
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
                    maxAuthData: MOCK_MAX_AUTH_DATA_QP,
                },
                expectedError: ERRORS.INVALID_REDIRECT_URL,
            },
            {
                name: 'should return error for unsupported user type',
                reqResNextParams: {
                    redirectUrl: ALLOWED_REDIRECT_URLS[0],
                    userType: STAFF,
                    maxAuthData: MOCK_MAX_AUTH_DATA_QP,
                },
                expectedError: ERRORS.NOT_SUPPORTED_USER_TYPE,
            },
            {
                name: 'should call next with error when auth data validation fails',
                reqResNextParams: {
                    redirectUrl: ALLOWED_REDIRECT_URLS[0],
                    userType: MOCK_USER.type,
                    maxAuthData: MOCK_MAX_AUTH_DATA_QP,
                },
                beforeCall: () => getMaxAuthDataValidationError.mockReturnValueOnce(ERRORS.VALIDATION_AUTH_DATA_SIGN_INVALID),
                expectedError: ERRORS.VALIDATION_AUTH_DATA_SIGN_INVALID,
            },
        ]

        test.each(testCases)('$name', async ({ reqResNextParams, expectedError, beforeCall }) => {
            const { req, res, next } = createMockReqResNext(reqResNextParams)
            await beforeCall?.()
            await expect(async () => await routes._validateParameters(req, res, next))
                .rejects.toThrow(new HttpError(expectedError))
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
                await expect(async () => await routes.authorizeUser(req, mockContext, user.id))
                    .rejects.toThrow(new HttpError(ERRORS.SUPER_USERS_NOT_ALLOWED))
                expect(res.redirect).not.toHaveBeenCalled()
            })
        })
    })
})
