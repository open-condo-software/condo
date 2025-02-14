/**
 * Generated by `createservice user.ConfirmEmailActionService '--type=mutations'`
 */

const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const {
    expectToThrowGQLError,
    expectToThrowAuthenticationErrorToResult,
    makeClient,
} = require('@open-condo/keystone/test.utils')

const {
    CONFIRM_EMAIL_ACTION_CODE_LENGTH,
    CONFIRM_EMAIL_ACTION_TTL_IN_SEC,
    CONFIRM_EMAIL_ACTION_DAILY_LIMIT_BY_EMAIL,
    CONFIRM_EMAIL_ACTION_DAILY_LIMIT_BY_USER,
    CONFIRM_EMAIL_ACTION_MAX_ATTEMPTS,
} = require('@dev-portal-api/domains/user/constants')
const {
    makeLoggedInAdminClient,
    makeRegisteredAndLoggedInUser,
    startConfirmEmailActionByTestClient,
    completeConfirmEmailActionByTestClient,
    ConfirmEmailAction,
} = require('@dev-portal-api/domains/user/utils/testSchema')

const { ERRORS } = require('./ConfirmEmailActionService')
 
describe('ConfirmEmailActionService', () => {
    let admin
    let user
    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        user = await makeRegisteredAndLoggedInUser()
    })
    describe('Access tests', () => {
        test('Email verification is not available for non-authorized users', async () => {
            const anonymous = await makeClient()
            await expectToThrowAuthenticationErrorToResult(async () => {
                await startConfirmEmailActionByTestClient(anonymous)
            })
            await expectToThrowAuthenticationErrorToResult(async () => {
                await completeConfirmEmailActionByTestClient(anonymous, faker.datatype.uuid())
            })
        })
    })
    describe('Basic flow', () => {
        test('Logged in user can verify email', async () => {
            const [startResult] = await startConfirmEmailActionByTestClient(user)
            expect(startResult).toHaveProperty('actionId')

            // NOTE: admin client is used to read a confirmation code
            const createdAction = await ConfirmEmailAction.getOne(admin, { id: startResult.actionId })
            expect(createdAction).toHaveProperty('code')
            expect(createdAction.code).toHaveLength(CONFIRM_EMAIL_ACTION_CODE_LENGTH)
            expect(createdAction).toHaveProperty('deletedAt', null)
            expect(createdAction).toHaveProperty('isVerified', false)
            expect(createdAction).toHaveProperty('expiresAt')
            expect(dayjs(createdAction.expiresAt).isBefore(dayjs().add(CONFIRM_EMAIL_ACTION_TTL_IN_SEC, 's'))).toBe(true)

            const [completeResult] = await completeConfirmEmailActionByTestClient(user, startResult.actionId, {
                code: createdAction.code,
            })
            expect(completeResult).toHaveProperty('status', 'success')

            // NOTE: admin client is used to read a confirmation code
            const updatedAction = await ConfirmEmailAction.getOne(admin, { id: startResult.actionId })
            expect(updatedAction).toHaveProperty('code', createdAction.code)
            expect(updatedAction).toHaveProperty('deletedAt', null)
            expect(updatedAction).toHaveProperty('isVerified', true)
            expect(updatedAction).toHaveProperty('expiresAt', createdAction.expiresAt)
        })
    })
    describe('Guards', () => {
        describe('User id guard', () => {
            test(`Each user can confirm emails only ${CONFIRM_EMAIL_ACTION_DAILY_LIMIT_BY_USER} times per day`, async () => {
                const client = await makeRegisteredAndLoggedInUser()
                for (let i = 0; i < CONFIRM_EMAIL_ACTION_DAILY_LIMIT_BY_USER; i++) {
                    const [startResult] = await startConfirmEmailActionByTestClient(client)
                    expect(startResult).toHaveProperty('actionId')
                }

                await expectToThrowGQLError(async () => {
                    await startConfirmEmailActionByTestClient(client)
                }, ERRORS.EMAILS_FOR_USER_DAY_LIMIT_REACHED, 'result')
            })
        })
        describe('Email guard', () => {
            test(`Each email address can be confirmed only ${CONFIRM_EMAIL_ACTION_DAILY_LIMIT_BY_EMAIL} times per day`, async () => {
                const email = faker.internet.email()
                for (let i = 0; i < CONFIRM_EMAIL_ACTION_DAILY_LIMIT_BY_EMAIL; i++) {
                    const client = await makeRegisteredAndLoggedInUser()
                    const [startResult] = await startConfirmEmailActionByTestClient(client, { email })
                    expect(startResult).toHaveProperty('actionId')
                }

                const client = await makeRegisteredAndLoggedInUser()
                await expectToThrowGQLError(async () => {
                    await startConfirmEmailActionByTestClient(client, { email })
                }, ERRORS.EMAILS_FOR_ADDRESS_DAY_LIMIT_REACHED, 'result')
            })
        })
        describe('Attempts guard', () => {
            test(`Each action can be guessed ${CONFIRM_EMAIL_ACTION_MAX_ATTEMPTS} times before it becomes invalid`, async () => {
                const client = await makeRegisteredAndLoggedInUser()
                const [startResult] = await startConfirmEmailActionByTestClient(client)
                expect(startResult).toHaveProperty('actionId')

                // NOTE: admin client is used to read a confirmation code
                const { code } = await ConfirmEmailAction.getOne(admin, { id: startResult.actionId })
                expect(code).toBeDefined()

                for (let i = 0; i < CONFIRM_EMAIL_ACTION_MAX_ATTEMPTS; i++) {
                    await expectToThrowGQLError(async () => {
                        await completeConfirmEmailActionByTestClient(client, startResult.actionId, {
                            code: faker.internet.password(),
                        })
                    }, ERRORS.INVALID_CODE, 'result')
                }

                await expectToThrowGQLError(async () => {
                    await completeConfirmEmailActionByTestClient(client, startResult.actionId, {
                        code,
                    })
                }, ERRORS.ACTION_NOT_FOUND, 'result')
            })
        })
    })
    describe('Logic', () => {
        test('Email must be normalized', async () => {
            const email = `${faker.name.firstName()}.${faker.name.lastName()}@gmail.com`
            const normalizedEmail = email.replace('.', '').toLowerCase()
            const [result] = await startConfirmEmailActionByTestClient(user, { email })
            expect(result).toHaveProperty('actionId')

            // NOTE: admin client is used to read a confirmation code
            const createdAction = await ConfirmEmailAction.getOne(admin, { id: result.actionId })
            expect(createdAction).toHaveProperty('email', normalizedEmail)
        })
    })
})