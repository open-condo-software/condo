const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { makeClient, expectToThrowGQLError } = require('@open-condo/keystone/test.utils')

const {
    CONFIRM_PHONE_ACTION_TTL_IN_SEC,
    CONFIRM_PHONE_ACTION_CODE_LENGTH,
    CONFIRM_PHONE_ACTION_DAILY_LIMIT_BY_IP,
    CONFIRM_PHONE_ACTION_DAILY_LIMIT_BY_PHONE,
    CONFIRM_PHONE_ACTION_MAX_ATTEMPTS,
} = require('@dev-portal-api/domains/user/constants')
const { ERRORS } = require('@dev-portal-api/domains/user/schema/ConfirmPhoneActionService')
const {
    ConfirmPhoneAction,
    createTestPhone,
    startConfirmPhoneActionByTestClient,
    completeConfirmPhoneActionByTestClient, makeLoggedInAdminClient,
} = require('@dev-portal-api/domains/user/utils/testSchema')

describe('ConfirmPhoneActionService', () => {
    let adminClient
    beforeAll(async ()=> {
        adminClient = await makeLoggedInAdminClient()
    })
    describe('Basic flow', () => {
        test('Can verify phone by verification code', async () => {
            const client = await makeClient()
            const [startResult] = await startConfirmPhoneActionByTestClient({}, client)
            expect(startResult).toHaveProperty('actionId')

            // NOTE: admin client is used to read a confirmation code
            const createdAction = await ConfirmPhoneAction.getOne(adminClient, { id: startResult.actionId })
            expect(createdAction).toHaveProperty('code')
            expect(createdAction.code).toHaveLength(CONFIRM_PHONE_ACTION_CODE_LENGTH)
            expect(createdAction).toHaveProperty('deletedAt', null)
            expect(createdAction).toHaveProperty('isVerified', false)
            expect(createdAction).toHaveProperty('expiresAt')
            expect(dayjs(createdAction.expiresAt).isBefore(dayjs().add(CONFIRM_PHONE_ACTION_TTL_IN_SEC, 's'))).toBe(true)

            const [completeResult] = await completeConfirmPhoneActionByTestClient(startResult.actionId, {
                code: createdAction.code,
            }, client)
            expect(completeResult).toHaveProperty('status', 'success')

            // NOTE: admin client is used to read a confirmation code
            const updatedAction = await ConfirmPhoneAction.getOne(adminClient, { id: startResult.actionId })
            expect(updatedAction).toHaveProperty('code', createdAction.code)
            expect(updatedAction).toHaveProperty('deletedAt', null)
            expect(updatedAction).toHaveProperty('isVerified', true)
            expect(updatedAction).toHaveProperty('expiresAt', createdAction.expiresAt)
        })
    })
    describe('Guards', () => {
        describe('IP guard', () => {
            test(`Should allow only ${CONFIRM_PHONE_ACTION_DAILY_LIMIT_BY_IP} new actions from a single IP per day`, async () => {
                const client = await makeClient()
                for (let i = 0; i < CONFIRM_PHONE_ACTION_DAILY_LIMIT_BY_IP; i++) {
                    const [startResult] = await startConfirmPhoneActionByTestClient({}, client)
                    expect(startResult).toHaveProperty('actionId')
                }

                await expectToThrowGQLError(async () => {
                    await startConfirmPhoneActionByTestClient({}, client)
                }, ERRORS.SMS_FOR_IP_DAY_LIMIT_REACHED, 'result')
            })
        })
        describe('Phone guard', () => {
            test(`Each phone number can be confirmed only ${CONFIRM_PHONE_ACTION_DAILY_LIMIT_BY_PHONE} times per day`, async () => {
                const phone = createTestPhone()
                for (let i = 0; i < CONFIRM_PHONE_ACTION_DAILY_LIMIT_BY_PHONE; i++) {
                    const client = await makeClient()
                    const [startResult] = await startConfirmPhoneActionByTestClient({ phone }, client)
                    expect(startResult).toHaveProperty('actionId')
                }
                const client = await makeClient()
                await expectToThrowGQLError(async () => {
                    await startConfirmPhoneActionByTestClient({ phone }, client)
                }, ERRORS.SMS_FOR_PHONE_DAY_LIMIT_REACHED, 'result')
            })
        })
        describe('Attempts guard', () => {
            test(`Each confirm action can be guessed ${CONFIRM_PHONE_ACTION_MAX_ATTEMPTS} times before it becomes invalid`, async () => {
                const client = await makeClient()
                const [startResult] = await startConfirmPhoneActionByTestClient({}, client)
                expect(startResult).toHaveProperty('actionId')
                // NOTE: admin client is used to read a confirmation code
                const createdAction = await ConfirmPhoneAction.getOne(adminClient, { id: startResult.actionId })
                expect(createdAction).toHaveProperty('code')

                for (let i = 0; i < CONFIRM_PHONE_ACTION_MAX_ATTEMPTS; i++) {
                    await expectToThrowGQLError(async () => {
                        await completeConfirmPhoneActionByTestClient(startResult.actionId, {
                            code: faker.internet.password(),
                        }, client)
                    }, ERRORS.INVALID_CODE, 'result')
                }

                await expectToThrowGQLError(async () => {
                    await completeConfirmPhoneActionByTestClient(startResult.actionId, {
                        code: createdAction.code,
                    }, client)
                }, ERRORS.ACTION_NOT_FOUND, 'result')
            })
        })
    })
})