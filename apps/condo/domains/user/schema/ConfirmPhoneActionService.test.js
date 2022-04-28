const faker = require('faker')
const { makeClient, makeLoggedInAdminClient } = require('@core/keystone/test.utils')
const {
    createTestPhone,
    createTestConfirmPhoneAction,
    ConfirmPhoneAction,
} = require('@condo/domains/user/utils/testSchema')
const {
    START_CONFIRM_PHONE_MUTATION,
    COMPLETE_CONFIRM_PHONE_MUTATION,
    GET_PHONE_BY_CONFIRM_PHONE_TOKEN_QUERY,
    RESEND_CONFIRM_PHONE_SMS_MUTATION,
} = require('@condo/domains/user/gql')
const {
    CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED,
    CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED,
    CONFIRM_PHONE_SMS_CODE_EXPIRED,
    CONFIRM_PHONE_ACTION_EXPIRED,
    TOO_MANY_REQUESTS,
} = require('@condo/domains/user/constants/errors')
const { CONFIRM_PHONE_SMS_MAX_RETRIES } = require('@condo/domains/user/constants/common')

const captcha = () => {
    return faker.lorem.sentence()
}


describe('ConfirmPhoneAction Service', () => {
    it('can be created by Anonymous', async () => {
        const client = await makeClient()
        const phone = createTestPhone()
        const createInput = { phone, dv: 1, sender: { dv: 1, fingerprint: 'tests' }, captcha: captcha() }
        const { data: { result: { token } } } = await client.mutate(START_CONFIRM_PHONE_MUTATION, { data: createInput })
        expect(token).not.toHaveLength(0)
    })
    it('throw error when is confirming with wrong sms code', async () => {
        const client = await makeClient()
        const admin = await makeLoggedInAdminClient()
        const [{ token }]  = await createTestConfirmPhoneAction(admin, {})
        const wrongLengthSmsCode = 11111
        const confirmInput = { token, smsCode: wrongLengthSmsCode, captcha: captcha() }
        const res = await client.mutate(COMPLETE_CONFIRM_PHONE_MUTATION, { data: confirmInput })
        expect(JSON.stringify(res.errors)).toContain(CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED)
    })

    it('should increment retries on failed attempt', async () => {
        const client = await makeClient()
        const admin = await makeLoggedInAdminClient()
        const [{ token }]  = await createTestConfirmPhoneAction(admin, {})
        const wrongLengthSmsCode = 11111
        const completeInput = { token, smsCode: wrongLengthSmsCode, captcha: captcha() }
        await client.mutate(COMPLETE_CONFIRM_PHONE_MUTATION, { data: completeInput })
        const [actionAfter] = await ConfirmPhoneAction.getAll(admin, { token })
        expect(actionAfter.retries).toBe(1)
    })

    it('marks itself as verified when sms code matches', async () => {
        const client = await makeClient()
        const admin = await makeLoggedInAdminClient()
        const [{ token }]  = await createTestConfirmPhoneAction(admin, {})
        const [actionBefore] = await ConfirmPhoneAction.getAll(admin, { token })
        const completeInput = { token, smsCode: actionBefore.smsCode, captcha: captcha() }
        const { data: { result: { status } } } = await client.mutate(COMPLETE_CONFIRM_PHONE_MUTATION, { data: completeInput })
        expect(status).toBe('ok')
        const [actionAfter] = await ConfirmPhoneAction.getAll(admin, { token })
        expect(actionAfter.isPhoneVerified).toBe(true)
    })

    it('marks itself failed when maximum retries number excided', async () => {
        const client = await makeClient()
        const admin = await makeLoggedInAdminClient()
        const [{ token }]  = await createTestConfirmPhoneAction(admin, {})
        const [actionBefore] = await ConfirmPhoneAction.getAll(admin, { token })
        await ConfirmPhoneAction.update(admin, actionBefore.id, { retries: CONFIRM_PHONE_SMS_MAX_RETRIES + 1 })
        const completeInput = { token, smsCode: actionBefore.smsCode, captcha: captcha() }
        const res = await client.mutate(COMPLETE_CONFIRM_PHONE_MUTATION, { data: completeInput })
        expect(JSON.stringify(res.errors)).toContain(CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED)
    })

    it('throws error when sms code ttl expires', async () => {
        const client = await makeClient()
        const admin = await makeLoggedInAdminClient()
        const [{ token }]  = await createTestConfirmPhoneAction(admin, {})
        const [actionBefore] = await ConfirmPhoneAction.getAll(admin, { token })
        await ConfirmPhoneAction.update(admin, actionBefore.id, {  smsCodeExpiresAt: actionBefore.smsCodeRequestedAt })
        const completeInput = { token, smsCode: actionBefore.smsCode, captcha: captcha() }
        const res = await client.mutate(COMPLETE_CONFIRM_PHONE_MUTATION, { data: completeInput })
        expect(JSON.stringify(res.errors)).toContain(CONFIRM_PHONE_SMS_CODE_EXPIRED)
    })

    it('throws error when confirm phone action expires', async () => {
        const client = await makeClient()
        const admin = await makeLoggedInAdminClient()
        const [{ token }]  = await createTestConfirmPhoneAction(admin, {})
        const [actionBefore] = await ConfirmPhoneAction.getAll(admin, { token })
        await ConfirmPhoneAction.update(admin, actionBefore.id, { expiresAt: actionBefore.requestedAt })
        const completeInput = { token, smsCode: actionBefore.smsCode, captcha: captcha() }
        const res = await client.mutate(COMPLETE_CONFIRM_PHONE_MUTATION, { data: completeInput })
        expect(JSON.stringify(res.errors)).toContain(CONFIRM_PHONE_ACTION_EXPIRED)
    })

    it('gives to Anonymous phone number when he asks with token', async () => {
        const client = await makeClient()
        const phone = createTestPhone()
        const admin = await makeLoggedInAdminClient()
        const [{ token }]  = await createTestConfirmPhoneAction(admin, { phone })
        const getInput = { token, captcha: captcha() }
        const { data: { result: { phone: phoneFromAction } } } = await client.query(GET_PHONE_BY_CONFIRM_PHONE_TOKEN_QUERY, { data: getInput })
        expect(phone).toBe(phoneFromAction)
    })

    it('should change sms code when resend is invoked', async () => {
        const client = await makeClient()
        const admin = await makeLoggedInAdminClient()
        const [{ token }]  = await createTestConfirmPhoneAction(admin, { })
        const [actionBefore] = await ConfirmPhoneAction.getAll(admin, { token })
        expect(actionBefore.smsCode).toBeGreaterThan(0)
        const resendInput = { token, sender: { dv: 1, fingerprint: 'tests' }, captcha: captcha() }
        await client.mutate(RESEND_CONFIRM_PHONE_SMS_MUTATION, { data: resendInput })
        const [actionAfter] = await ConfirmPhoneAction.getAll(admin, { token })
        expect(actionAfter.smsCode).toBeGreaterThan(0)
        expect(actionAfter.smsCode).not.toEqual(actionBefore.smsCode)
    })
    it('should block 2 sms code resend for the same phone', async () => {
        const client = await makeClient()
        const admin = await makeLoggedInAdminClient()
        const [{ token }]  = await createTestConfirmPhoneAction(admin, {})
        const resendInput = { token, sender: { dv: 1, fingerprint: 'tests' }, captcha: captcha() }
        await client.mutate(RESEND_CONFIRM_PHONE_SMS_MUTATION, { data: resendInput })
        const res = await client.mutate(RESEND_CONFIRM_PHONE_SMS_MUTATION, { data: resendInput })
        expect(JSON.stringify(res.errors)).toContain(TOO_MANY_REQUESTS)
    })
})
