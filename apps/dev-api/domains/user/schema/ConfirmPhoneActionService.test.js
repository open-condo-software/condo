const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { getById } = require('@open-condo/keystone/schema')
const { makeClient, expectToThrowGQLError } = require('@open-condo/keystone/test.utils')

const {
    CONFIRM_ACTION_TTL_IN_SEC,
    CONFIRM_ACTION_CODE_LENGTH,
    CONFIRM_ACTION_DAILY_LIMIT_BY_IP,
    CONFIRM_ACTION_DAILY_LIMIT_BY_PHONE,
    CONFIRM_ACTION_MAX_ATTEMPTS,
} = require('@dev-api/domains/user/constants')
const { ERRORS } = require('@dev-api/domains/user/schema/ConfirmPhoneActionService')
const {
    createTestPhone,
    startConfirmPhoneActionByTestClient,
    completeConfirmPhoneActionByTestClient,
} = require('@dev-api/domains/user/utils/testSchema')

describe('ConfirmPhoneActionService', () => {
    describe('Basic flow', () => {
        test('Can verify phone by verification code', async () => {
            const client = await makeClient()
            const [startResult] = await startConfirmPhoneActionByTestClient({}, client)
            expect(startResult).toHaveProperty('actionId')
            // Note: ConfirmPhoneAction is not visible outside if server, check its test for more
            const createdAction = await getById('ConfirmPhoneAction', startResult.actionId)
            expect(createdAction).toHaveProperty('code')
            expect(createdAction.code).toHaveLength(CONFIRM_ACTION_CODE_LENGTH)
            expect(createdAction).toHaveProperty('deletedAt', null)
            expect(createdAction).toHaveProperty('isVerified', false)
            expect(createdAction).toHaveProperty('expiresAt')
            expect(dayjs(createdAction.expiresAt).isBefore(dayjs().add(CONFIRM_ACTION_TTL_IN_SEC, 's'))).toBe(true)

            const [completeResult] = await completeConfirmPhoneActionByTestClient(startResult.actionId, {
                code: createdAction.code,
            }, client)
            expect(completeResult).toHaveProperty('status', 'success')

            const updatedAction = await getById('ConfirmPhoneAction', startResult.actionId)
            expect(updatedAction).toHaveProperty('code', createdAction.code)
            expect(updatedAction).toHaveProperty('deletedAt', null)
            expect(updatedAction).toHaveProperty('isVerified', true)
            expect(updatedAction).toHaveProperty('expiresAt', createdAction.expiresAt)
        })
    })
    describe('Guards', () => {
        describe('IP guard', () => {
            test(`Should allow only ${CONFIRM_ACTION_DAILY_LIMIT_BY_IP} new actions from a single IP per day`, async () => {
                const client = await makeClient()
                for (let i = 0; i < CONFIRM_ACTION_DAILY_LIMIT_BY_IP; i++) {
                    const [startResult] = await startConfirmPhoneActionByTestClient({}, client)
                    expect(startResult).toHaveProperty('actionId')
                }

                await expectToThrowGQLError(async () => {
                    await startConfirmPhoneActionByTestClient({}, client)
                }, ERRORS.SMS_FOR_IP_DAY_LIMIT_REACHED, 'result')
            })
        })
        describe('Phone guard', () => {
            test(`Each phone number can be confirmed only ${CONFIRM_ACTION_DAILY_LIMIT_BY_PHONE} times per day`, async () => {
                const phone = createTestPhone()
                for (let i = 0; i < CONFIRM_ACTION_DAILY_LIMIT_BY_PHONE; i++) {
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
            test(`Each confirm action can be guessed ${CONFIRM_ACTION_MAX_ATTEMPTS} times before it expires`, async () => {
                const client = await makeClient()
                const [startResult] = await startConfirmPhoneActionByTestClient({}, client)
                expect(startResult).toHaveProperty('actionId')
                // Note: ConfirmPhoneAction is not visible outside if server, check its test for more
                const createdAction = await getById('ConfirmPhoneAction', startResult.actionId)
                expect(createdAction).toHaveProperty('code')

                for (let i = 0; i < CONFIRM_ACTION_MAX_ATTEMPTS; i++) {
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