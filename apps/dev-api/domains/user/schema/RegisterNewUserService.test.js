const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { expectToThrowGQLError, makeClient, catchErrorFrom } = require('@open-condo/keystone/test.utils')

const { USER_ALREADY_EXISTS, ACTION_NOT_FOUND, PASSWORD_TOO_SIMPLE } = require('@dev-api/domains/user/constants/errors')
const {
    ConfirmPhoneAction,
    startConfirmPhoneActionByTestClient,
    completeConfirmPhoneActionByTestClient,
    registerNewTestUser,
    createTestPhone,
    makeLoggedInAdminClient,
    updateTestConfirmPhoneAction,
} = require('@dev-api/domains/user/utils/testSchema')

describe('RegisterNewUserService', () => {
    // NOTE: admin client used to simulate expiration / deletion of action cases
    let adminClient
    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
    })
    test('Basic registration case must work', async () => {
        const phone = createTestPhone()
        const name = faker.internet.userName()
        const [user] = await registerNewTestUser({
            phone,
            name,
        })
        expect(user).toHaveProperty('id')
    })
    test('Cannot register another user with existing phone', async () => {
        const phone = createTestPhone()
        const [user] = await registerNewTestUser({
            phone,
        })
        expect(user).toHaveProperty('id')
        await expectToThrowGQLError(async () => {
            await registerNewTestUser({
                phone,
            })
        }, {
            code: BAD_USER_INPUT,
            type: USER_ALREADY_EXISTS,
        }, 'result')
    })
    test('Cannot register user with non-verified phone', async () => {
        const client = await makeClient()
        const [{ actionId }] = await startConfirmPhoneActionByTestClient({}, client)
        expect(actionId).toBeDefined()

        await expectToThrowGQLError(async () => {
            await registerNewTestUser({ actionId }, client)
        }, {
            code: BAD_USER_INPUT,
            type: ACTION_NOT_FOUND,
        }, 'result')
    })
    test('Cannot use same ConfirmPhoneAction twice', async () => {
        const client = await makeClient()
        const [{ actionId }] = await startConfirmPhoneActionByTestClient({}, client)
        const { code } = await ConfirmPhoneAction.getOne(adminClient, { id: actionId })
        expect(code).toBeDefined()

        const [{ status }] = await completeConfirmPhoneActionByTestClient(actionId, { code }, client)
        expect(status).toEqual('success')

        const [user, { phone }] =  await registerNewTestUser({ actionId }, client)
        expect(user).toHaveProperty('id')

        await expectToThrowGQLError(async () => {
            await registerNewTestUser({ actionId, phone }, client)
        }, {
            code: BAD_USER_INPUT,
            type: ACTION_NOT_FOUND,
        }, 'result')

        const action = await ConfirmPhoneAction.getOne(adminClient, { id: actionId })
        expect(action).not.toBeDefined()
    })
    test('Cannot register with expired ConfirmPhoneAction', async () => {
        const client = await makeClient()
        const [{ actionId }] = await startConfirmPhoneActionByTestClient({}, client)
        const { code } = await ConfirmPhoneAction.getOne(adminClient, { id: actionId })
        expect(code).toBeDefined()
        
        const [{ status }] = await completeConfirmPhoneActionByTestClient(actionId, { code }, client)
        expect(status).toEqual('success')


        await updateTestConfirmPhoneAction(adminClient, actionId, {
            expiresAt: dayjs().toISOString(),
        })

        await expectToThrowGQLError(async () => {
            await registerNewTestUser({ actionId }, client)
        }, {
            code: BAD_USER_INPUT,
            type: ACTION_NOT_FOUND,
        }, 'result')
    })
    test('Cannot register with deleted ConfirmPhoneAction', async () => {
        const client = await makeClient()
        const [{ actionId }] = await startConfirmPhoneActionByTestClient({}, client)
        const { code } = await ConfirmPhoneAction.getOne(adminClient, { id: actionId })
        expect(code).toBeDefined()

        const [{ status }] = await completeConfirmPhoneActionByTestClient(actionId, { code }, client)
        expect(status).toEqual('success')

        await updateTestConfirmPhoneAction(adminClient, actionId, {
            deletedAt: dayjs().toISOString(),
        })

        await expectToThrowGQLError(async () => {
            await registerNewTestUser({ actionId }, client)
        }, {
            code: BAD_USER_INPUT,
            type: ACTION_NOT_FOUND,
        }, 'result')
    })
    describe('Cannot register user with short / simple password',  () => {
        const phone = createTestPhone()
        const cases = [
            ['short password', faker.internet.password(8)],
            ['simple password', '121212323232'],
            ['phone', phone],
        ]

        test.each(cases)('%p', async (_, password) => {
            await catchErrorFrom(async () => {
                await registerNewTestUser({
                    phone,
                    password,
                })
            }, ({ errors }) => {
                expect(errors).toHaveLength(1)
                expect(errors[0]).toHaveProperty(['originalError', 'errors'])
                const originalErrors = errors[0].originalError.errors
                expect(originalErrors).toHaveLength(1)
                expect(originalErrors[0]).toHaveProperty('path', ['obj'])
                expect(originalErrors[0]).toHaveProperty('name', 'GQLError')
                expect(originalErrors[0]).toHaveProperty(['extensions', 'code'], BAD_USER_INPUT)
                expect(originalErrors[0]).toHaveProperty(['extensions', 'type'], PASSWORD_TOO_SIMPLE)
            })
        })
    })
})