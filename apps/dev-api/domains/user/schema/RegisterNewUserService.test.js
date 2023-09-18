const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { getById, getSchemaCtx } = require('@open-condo/keystone/schema')
const { expectToThrowGQLError, makeClient, catchErrorFrom } = require('@open-condo/keystone/test.utils')

const { USER_ALREADY_EXISTS, ACTION_NOT_FOUND, PASSWORD_TOO_SIMPLE } = require('@dev-api/domains/user/constants/errors')
const { ConfirmPhoneAction } = require('@dev-api/domains/user/utils/serverSchema')
const {
    startConfirmPhoneActionByTestClient,
    completeConfirmPhoneActionByTestClient,
    registerNewTestUser,
    createTestPhone,
} = require('@dev-api/domains/user/utils/testSchema')

describe('RegisterNewUserService', () => {
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
    test('Cannot register with expired ConfirmPhoneAction', async () => {
        const client = await makeClient()
        const [{ actionId }] = await startConfirmPhoneActionByTestClient({}, client)
        const { code } = await getById('ConfirmPhoneAction', actionId)
        expect(code).toBeDefined()

        const { keystone: context } = getSchemaCtx('ConfirmPhoneAction')
        const [{ status }] = await completeConfirmPhoneActionByTestClient(actionId, { code }, client)
        expect(status).toEqual('success')

        await ConfirmPhoneAction.update(context, actionId, {
            dv: 1,
            sender: { fingerprint: 'test-update', dv: 1 },
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
        const { code } = await getById('ConfirmPhoneAction', actionId)
        expect(code).toBeDefined()

        const { keystone: context } = getSchemaCtx('ConfirmPhoneAction')
        const [{ status }] = await completeConfirmPhoneActionByTestClient(actionId, { code }, client)
        expect(status).toEqual('success')

        await ConfirmPhoneAction.update(context, actionId, {
            dv: 1,
            sender: { fingerprint: 'test-update', dv: 1 },
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