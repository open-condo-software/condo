const { faker } = require('@faker-js/faker')

const { makeClient, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')
const { catchErrorFrom } = require('@open-condo/keystone/test.utils')

const { CONFIRM_PHONE_SMS_MAX_RETRIES } = require('@condo/domains/user/constants/common')
const {
    TOO_MANY_REQUESTS,
} = require('@condo/domains/user/constants/errors')
const {
    START_CONFIRM_PHONE_MUTATION,
    COMPLETE_CONFIRM_PHONE_MUTATION,
    GET_PHONE_BY_CONFIRM_PHONE_TOKEN_QUERY,
    RESEND_CONFIRM_PHONE_SMS_MUTATION,
} = require('@condo/domains/user/gql')
const {
    createTestPhone,
    createTestConfirmPhoneAction,
    ConfirmPhoneAction,
} = require('@condo/domains/user/utils/testSchema')


const { completeConfirmPhoneActionByTestClient } = require('../utils/testSchema')

const captcha = () => {
    return faker.lorem.sentence()
}

describe('ConfirmPhoneActionService', () => {
    describe('startConfirmPhoneAction', () => {
        it('can be created by Anonymous', async () => {
            const client = await makeClient()
            const phone = createTestPhone()
            const createInput = { phone, dv: 1, sender: { dv: 1, fingerprint: 'tests' }, captcha: captcha() }
            const { data: { result: { token } } } = await client.mutate(START_CONFIRM_PHONE_MUTATION, { data: createInput })
            expect(token).not.toHaveLength(0)
        })
    })

    describe('completeConfirmPhoneAction', () => {
        it('throws error when wrong sms code was provided', async () => {
            const client = await makeClient()
            const admin = await makeLoggedInAdminClient()
            const [{ token }] = await createTestConfirmPhoneAction(admin, {})
            const wrongLengthSmsCode = 11111
            const attrs = { token, smsCode: wrongLengthSmsCode, captcha: captcha() }
            await catchErrorFrom(async () => {
                await completeConfirmPhoneActionByTestClient(client, attrs)
            }, ({ errors }) => {
                expect(errors).toMatchObject([{
                    message: 'SMS code verification mismatch',
                    path: ['result'],
                    extensions: {
                        mutation: 'completeConfirmPhoneAction',
                        variable: ['data', 'smsCode'],
                        code: 'BAD_USER_INPUT',
                        type: 'SMS_CODE_VERIFICATION_FAILED',
                        message: 'SMS code verification mismatch',
                    },
                }])
            })
        })

        it('should increment retries on failed attempt', async () => {
            const client = await makeClient()
            const admin = await makeLoggedInAdminClient()
            const [{ token }] = await createTestConfirmPhoneAction(admin, {})
            const wrongLengthSmsCode = 11111
            const completeInput = { token, dv: 1, sender: { dv: 1, fingerprint: 'tests' }, smsCode: wrongLengthSmsCode, captcha: captcha() }
            await client.mutate(COMPLETE_CONFIRM_PHONE_MUTATION, { data: completeInput })
            const [actionAfter] = await ConfirmPhoneAction.getAll(admin, { token, dv:1, sender: { dv: 1, fingerprint: 'tests' } })
            expect(actionAfter.retries).toBe(1)
        })

        it('marks itself as verified when sms code matches', async () => {
            const client = await makeClient()
            const admin = await makeLoggedInAdminClient()
            const [{ token }] = await createTestConfirmPhoneAction(admin, {})
            const [actionBefore] = await ConfirmPhoneAction.getAll(admin, { token })
            const attrs = { token, smsCode: actionBefore.smsCode, captcha: captcha() }
            const [{ status }] = await completeConfirmPhoneActionByTestClient(client, attrs)
            expect(status).toBe('ok')
            const [actionAfter] = await ConfirmPhoneAction.getAll(admin, { token })
            expect(actionAfter.isPhoneVerified).toBe(true)
        })

        it('marks itself failed when maximum retries number excided', async () => {
            const client = await makeClient()
            const admin = await makeLoggedInAdminClient()
            const [{ token }] = await createTestConfirmPhoneAction(admin, {})
            const [actionBefore] = await ConfirmPhoneAction.getAll(admin, { token })
            await ConfirmPhoneAction.update(admin, actionBefore.id, { dv: 1, sender: actionBefore.sender, retries: CONFIRM_PHONE_SMS_MAX_RETRIES + 1 })
            const attrs = { token, smsCode: actionBefore.smsCode, captcha: captcha() }
            await catchErrorFrom(async () => {
                await completeConfirmPhoneActionByTestClient(client, attrs)
            }, ({ errors }) => {
                expect(errors).toMatchObject([{
                    message: 'Max retries reached for SMS code confirmation. Try to initiate phone confirmation again',
                    path: ['result'],
                    extensions: {
                        mutation: 'completeConfirmPhoneAction',
                        variable: ['data', 'smsCode'],
                        code: 'BAD_USER_INPUT',
                        type: 'SMS_CODE_MAX_RETRIES_REACHED',
                        message: 'Max retries reached for SMS code confirmation. Try to initiate phone confirmation again',
                    },
                }])
            })
        })

        it('throws error when sms code ttl expires', async () => {
            const client = await makeClient()
            const admin = await makeLoggedInAdminClient()
            const [{ token }] = await createTestConfirmPhoneAction(admin, {})
            const [actionBefore] = await ConfirmPhoneAction.getAll(admin, { token })
            await ConfirmPhoneAction.update(admin, actionBefore.id, { dv: 1, sender: { dv: 1, fingerprint: 'tests' }, smsCodeExpiresAt: actionBefore.smsCodeRequestedAt })
            const attrs = { token, smsCode: actionBefore.smsCode, captcha: captcha() }
            await catchErrorFrom(async () => {
                await completeConfirmPhoneActionByTestClient(client, attrs)
            }, ({ errors }) => {
                expect(errors).toMatchObject([{
                    message: 'SMS code expired. Try to initiate phone confirmation again',
                    path: ['result'],
                    extensions: {
                        mutation: 'completeConfirmPhoneAction',
                        variable: ['data', 'smsCode'],
                        code: 'BAD_USER_INPUT',
                        type: 'SMS_CODE_EXPIRED',
                        message: 'SMS code expired. Try to initiate phone confirmation again',
                    },
                }])
            })
        })

        it('throws error when confirm phone action expires', async () => {
            const client = await makeClient()
            const admin = await makeLoggedInAdminClient()
            const [{ token }] = await createTestConfirmPhoneAction(admin, {})
            const [actionBefore] = await ConfirmPhoneAction.getAll(admin, { token })
            await ConfirmPhoneAction.update(admin, actionBefore.id, { dv: 1, sender: { dv: 1, fingerprint: 'tests' }, expiresAt: actionBefore.requestedAt })
            const attrs = { token, smsCode: actionBefore.smsCode, captcha: captcha() }
            await catchErrorFrom(async () => {
                await completeConfirmPhoneActionByTestClient(client, attrs)
            }, ({ errors }) => {
                expect(errors).toMatchObject([{
                    message: 'Confirm phone action was expired or it could not be found. Try to initiate phone confirmation again',
                    path: ['result'],
                    extensions: {
                        mutation: 'completeConfirmPhoneAction',
                        variable: ['data', 'token'],
                        code: 'BAD_USER_INPUT',
                        type: 'UNABLE_TO_FIND_CONFIRM_PHONE_ACTION',
                        message: 'Confirm phone action was expired or it could not be found. Try to initiate phone confirmation again',
                    },
                }])
            })
        })
    })

    describe('getPhoneByConfirmPhoneActionToken', () => {
        it('gives to Anonymous phone number when he asks with token', async () => {
            const client = await makeClient()
            const phone = createTestPhone()
            const admin = await makeLoggedInAdminClient()
            const [{ token }] = await createTestConfirmPhoneAction(admin, { phone })
            const getInput = { token, captcha: captcha() }
            const { data: { result: { phone: phoneFromAction } } } = await client.query(GET_PHONE_BY_CONFIRM_PHONE_TOKEN_QUERY, { data: getInput })
            expect(phone).toBe(phoneFromAction)
        })
    })

    describe('resendConfirmPhoneActionSms', () => {
        it('should change sms code when resend is invoked', async () => {
            const client = await makeClient()
            const admin = await makeLoggedInAdminClient()
            const [{ token }] = await createTestConfirmPhoneAction(admin, {})
            const [actionBefore] = await ConfirmPhoneAction.getAll(admin, { token })
            expect(actionBefore.smsCode).toBeGreaterThan(0)
            const resendInput = { token, dv: 1, sender: { dv: 1, fingerprint: 'tests' }, captcha: captcha() }
            await client.mutate(RESEND_CONFIRM_PHONE_SMS_MUTATION, { data: resendInput })
            const [actionAfter] = await ConfirmPhoneAction.getAll(admin, { token })
            expect(actionAfter.smsCode).toBeGreaterThan(0)
            expect(actionAfter.smsCode).not.toEqual(actionBefore.smsCode)
        })

        it('should block 2 sms code resend for the same phone', async () => {
            const client = await makeClient()
            const admin = await makeLoggedInAdminClient()
            const [{ token }] = await createTestConfirmPhoneAction(admin, {})
            const resendInput = { token, dv: 1, sender: { dv: 1, fingerprint: 'tests' }, captcha: captcha() }
            await client.mutate(RESEND_CONFIRM_PHONE_SMS_MUTATION, { data: resendInput })
            const res = await client.mutate(RESEND_CONFIRM_PHONE_SMS_MUTATION, { data: resendInput })
            expect(JSON.stringify(res.errors)).toContain(TOO_MANY_REQUESTS)
        })
    })
})
