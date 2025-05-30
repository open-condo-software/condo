jest.mock('@open-condo/keystone/schema')
jest.mock('@condo/domains/user/utils/serverSchema')
jest.mock('@condo/domains/user/integration/telegram/sync/syncUser')
jest.mock('@condo/domains/user/integration/telegram/utils/validations')
jest.mock('@condo/domains/user/integration/telegram/utils/params')


const { faker } = require('@faker-js/faker')

const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { RESIDENT } = require('@condo/domains/user/constants/common')
const { TelegramOauthRoutes } = require('@condo/domains/user/integration/telegram/routes')
const { syncUser } = require('@condo/domains/user/integration/telegram/sync/syncUser')
const { ERROR_MESSAGES } = require('@condo/domains/user/integration/telegram/utils/errors')
const { getRedirectUrl, getUserType } = require('@condo/domains/user/integration/telegram/utils/params')
const { validateTgAuthData } = require('@condo/domains/user/integration/telegram/utils/validations')
const { User } = require('@condo/domains/user/utils/serverSchema')

function expectResultError (res, errorMessage) {
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: errorMessage }))
}

describe('TelegramOauthRoutes', () => {
    const BOT_TOKEN = faker.random.alphaNumeric(30)
    const ALLOWED_REDIRECT_URLS = ['https://example.com', 'https://app.example.com']
    const ALLOWED_USER_TYPES = ['resident', 'staff']
    const RESIDENT_REDIRECT_URI = '/resident-dashboard'
    const MOCK_TOKEN = faker.random.alphaNumeric(10)
    const MOCK_USER = {
        id: faker.random.alphaNumeric(10),
        type: RESIDENT,
        isSupport: false,
        isAdmin: false,
    }

    let routes
    let mockContext

    beforeEach(() => {
        mockContext = {
            knex: jest.fn(),
            _sessionManager: {
                startAuthedSession: jest.fn().mockResolvedValue(MOCK_TOKEN),
            },
            lists: {
                User: {},
            },
        }

        getSchemaCtx.mockReturnValue({ keystone: mockContext })
        User.getOne.mockImplementation(async () => ({ ...MOCK_USER }))

        syncUser.mockResolvedValue({ id: MOCK_USER.id })
        validateTgAuthData.mockReturnValue(null)
        getRedirectUrl.mockReturnValue(ALLOWED_REDIRECT_URLS[0])
        getUserType.mockReturnValue(ALLOWED_USER_TYPES[0])

        routes = new TelegramOauthRoutes(
            'asd',
            BOT_TOKEN,
            ALLOWED_REDIRECT_URLS,
            ALLOWED_USER_TYPES,
            RESIDENT_REDIRECT_URI
        )
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('completeAuth', () => {
        const VALID_TG_AUTH_DATA = {
            id: faker.random.alphaNumeric(10),
            first_name: 'Test',
            auth_date: Date.now(),
            hash: 'valid_hash',
        }

        function createMockReqResNext (body = {}, query = {}) {
            return {
                req: {
                    id: 'test_req_id',
                    body,
                    query,
                    user: null,
                },
                res: {
                    redirect: jest.fn(),
                    status: jest.fn().mockReturnThis(),
                    json: jest.fn(),
                },
                next: jest.fn(),
            }
        }

        test('should successfully complete auth and redirect with token', async () => {
            const { req, res, next } = createMockReqResNext(VALID_TG_AUTH_DATA)

            await routes.completeAuth(req, res, next)

            expect(next).not.toHaveBeenCalled()
            expect(res.redirect.mock.calls[0][0].toString()).toEqual(expect.stringContaining(`token=${MOCK_TOKEN}`))
            expect(syncUser).toHaveBeenCalled()
            expect(User.getOne).toHaveBeenCalled()
            expect(next).not.toHaveBeenCalled()
        })

        test('should redirect resident to default page when redirectUrl is nil', async () => {
            const { req, res, next } = createMockReqResNext(VALID_TG_AUTH_DATA)
            getRedirectUrl.mockReturnValueOnce(null)
            getRedirectUrl.mockReturnValueOnce(null)
            User.getOne.mockResolvedValueOnce({
                ...MOCK_USER,
                type: 'resident',
            })

            await routes.completeAuth(req, res, next)

            expect(res.redirect.mock.calls[0][0].toString()).toEqual(expect.stringContaining(RESIDENT_REDIRECT_URI))
            expect(next).not.toHaveBeenCalled()
        })

        test('should redirect staff to /tour when redirectUrl is nil', async () => {
            const { req, res, next } = createMockReqResNext(VALID_TG_AUTH_DATA)
            getRedirectUrl.mockReturnValueOnce(null)
            getRedirectUrl.mockReturnValueOnce(null)
            User.getOne.mockResolvedValueOnce({
                ...MOCK_USER,
                type: 'staff',
            })

            await routes.completeAuth(req, res, next)

            expect(res.redirect.mock.calls[0][0].toString()).toEqual(expect.stringContaining('/tour'))
            expect(next).not.toHaveBeenCalled()
        })

        test('should call next with error for invalid redirect URL', async () => {
            const { req, res, next } = createMockReqResNext(VALID_TG_AUTH_DATA)
            getRedirectUrl.mockReturnValueOnce('https://invalid.com')

            await routes.completeAuth(req, res, next)

            expectResultError(res, ERROR_MESSAGES.INVALID_REDIRECT_URL)
            expect(res.redirect).not.toHaveBeenCalled()
        })

        test('should call next with error for unsupported user type', async () => {
            const { req, res, next } = createMockReqResNext(VALID_TG_AUTH_DATA)
            getUserType.mockReturnValueOnce('invalid_type')

            await routes.completeAuth(req, res, next)
            expectResultError(res, ERROR_MESSAGES.NOT_SUPPORTED_USER_TYPE)
            expect(res.redirect).not.toHaveBeenCalled()
        })

        test('should call next with error when body is missing', async () => {
            const { req, res, next } = createMockReqResNext()
            delete req['body']

            await routes.completeAuth(req, res, next)
            expectResultError(res, ERROR_MESSAGES.BODY_MISSING)
            expect(res.redirect).not.toHaveBeenCalled()
        })

        test('should call next with error when auth data validation fails', async () => {
            const { req, res, next } = createMockReqResNext(VALID_TG_AUTH_DATA)
            validateTgAuthData.mockReturnValueOnce(ERROR_MESSAGES.VALIDATION_AUTH_DATA_SIGN_INVALID)

            await routes.completeAuth(req, res, next)
            expectResultError(res, ERROR_MESSAGES.VALIDATION_AUTH_DATA_SIGN_INVALID)
            expect(res.redirect).not.toHaveBeenCalled()
        })

        test('should call next with error for super users', async () => {
            const { req, res, next } = createMockReqResNext(VALID_TG_AUTH_DATA)
            User.getOne.mockResolvedValueOnce({
                ...MOCK_USER,
                isSupport: true,
            })

            await routes.completeAuth(req, res, next)
            expectResultError(res, ERROR_MESSAGES.SUPER_USERS_NOT_ALLOWED)
            expect(res.redirect).not.toHaveBeenCalled()
        })
    })

    describe('authorizeUser', () => {
        function createMockReqRes (query = {}) {
            return {
                req: {
                    query,
                    user: null,
                },
                res: {
                    status: jest.fn().mockReturnThis(),
                    redirect: jest.fn(),
                    json: jest.fn(),
                },
                next: jest.fn(),
            }
        }

        test('should add token to redirect URL when provided', async () => {
            const { req, res } = createMockReqRes({ redirectUrl: 'https://example.com' })
            getRedirectUrl.mockReturnValueOnce('https://example.com')

            await routes.authorizeUser(req, res, mockContext, MOCK_USER.id)

            expect(res.redirect.mock.calls[0][0].toString()).toEqual(expect.stringContaining(`token=${MOCK_TOKEN}`))
        })

        test('should redirect resident to default page when redirectUrl is nil', async () => {
            const { req, res } = createMockReqRes()
            User.getOne.mockResolvedValueOnce({
                ...MOCK_USER,
                type: 'resident',
            })
            getRedirectUrl.mockReturnValueOnce(null)

            await routes.authorizeUser(req, res, mockContext, MOCK_USER.id)

            expect(res.redirect.mock.calls[0][0].toString()).toEqual(expect.stringContaining(RESIDENT_REDIRECT_URI))
        })

        test('should redirect staff to /tour when redirectUrl is nil', async () => {
            const { req, res } = createMockReqRes()
            getRedirectUrl.mockReturnValueOnce(null)
            User.getOne.mockResolvedValueOnce({
                ...MOCK_USER,
                type: 'staff',
            })

            await routes.authorizeUser(req, res, mockContext, MOCK_USER.id)

            expect(res.redirect.mock.calls[0][0].toString()).toEqual(expect.stringContaining('/tour'))
        })
        
        describe('does not authorize super users', () => {
            const { req, res } = createMockReqRes()
            
            const users = [
                {
                    isSupport: true,
                    isAdmin: false,
                },
                {
                    isSupport: false,
                    isAdmin: true,
                },
                {
                    isSupport: true,
                    isAdmin: true,
                },
            ].map(user => {
                return {
                    ...MOCK_USER,
                    ...user,
                }
            }).flatMap(user => {
                return [
                    { ...user, type: 'staff' },
                    { ...user, type: 'resident' },
                ]
            })
            
            test.each(users)('isSupport:$isSupport isAdmin:$isAdmin type:$type', async (user) => {
                User.getOne.mockResolvedValueOnce(user)
                await routes.authorizeUser(req, res, mockContext, user.id)

                expect(res.redirect).not.toHaveBeenCalled()
                expectResultError(res, ERROR_MESSAGES.SUPER_USERS_NOT_ALLOWED)
            })
            
        })
        
    })
})


























