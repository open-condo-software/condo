const { makeClient, makeLoggedInAdminClient } = require('@core/keystone/test.utils')
const { createTestPhone } = require('@condo/domains/user/utils/testSchema')
const { gql } = require('graphql-tag')

const { 
    CONFIRM_PHONE_ACTION_EXPIRED,
    CONFIRM_PHONE_SMS_CODE_EXPIRED,
    CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED,
    CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED,
} = require('@condo/domains/user/constants/errors')

const {
    CONFIRM_PHONE_SMS_MAX_RETRIES,
} = require('@condo/domains/user/constants/common')

const { 
    START_CONFIRM_PHONE_MUTATION, 
    RESEND_CONFIRM_PHONE_SMS_MUTATION, 
    COMPLETE_CONFIRM_PHONE_MUTATION, 
    GET_PHONE_BY_CONFIRM_PHONE_TOKEN_QUERY,
} = require('@condo/domains/user/gql')

const GET_CONFIRM_PHONE_BY_TOKEN = gql`
    query findConfirmPhoneFromToken($token: String!) {
        confirmPhoneActions: allConfirmPhoneActions(where: { token: $token }) {
            id
            phone
            smsCode
            isPhoneVerified
            smsCodeRequestedAt
            smsCodeExpiresAt
            requestedAt
            expiresAt
            retries
        }
    }
`

const UPDATE_CONFIRM_PHONE_ACTION = gql`
    mutation updateConfirmPhoneAction ($id: ID!, $data: ConfirmPhoneActionUpdateInput) {
        result: updateConfirmPhoneAction(id: $id, data: $data) {
            id            
        }
    }
`

// TODO(zuch): Discuss is it possible to turn off real sms sending during tests

describe('ConfirmPhoneAction Service', () => {
    it('can be created by Anonymous', async () => {
        const client = await makeClient()       
        const phone = createTestPhone()
        const { data: { token } } = await client.mutate(START_CONFIRM_PHONE_MUTATION, { phone, dv: 1, sender: { dv: 1, fingerprint: 'tests' } })
        expect(token).not.toHaveLength(0)
    })

    it('throw error when is confirming with wrong sms code', async () => {
        const client = await makeClient()       
        const phone = createTestPhone()
        const { data: { token } }  = await client.mutate(START_CONFIRM_PHONE_MUTATION, { phone, dv: 1, sender: { dv: 1, fingerprint: 'tests' } })
        const wrongLengthSmsCode = 11111
        const res = await client.mutate(COMPLETE_CONFIRM_PHONE_MUTATION, { token, smsCode: wrongLengthSmsCode })
        expect(JSON.stringify(res.errors)).toContain(CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED)
    })

    it('should increment retries on failed attempt', async () => {
        const client = await makeClient()       
        const phone = createTestPhone()
        const { data: { token } }  = await client.mutate(START_CONFIRM_PHONE_MUTATION, { phone, dv: 1, sender: { dv: 1, fingerprint: 'tests' } })
        const wrongLengthSmsCode = 11111
        await client.mutate(COMPLETE_CONFIRM_PHONE_MUTATION, { token, smsCode: wrongLengthSmsCode })
        const admin = await makeLoggedInAdminClient()
        const { data: { confirmPhoneActions: [actionAfter] } } = await admin.query(GET_CONFIRM_PHONE_BY_TOKEN, { token })
        expect(actionAfter.retries).toBe(1)        
    })

    it('marks itself as verified when sms code matches', async () => {
        const client = await makeClient()       
        const admin = await makeLoggedInAdminClient()        
        const phone = createTestPhone()
        const { data: { token } }  = await client.mutate(START_CONFIRM_PHONE_MUTATION, { phone, dv: 1, sender: { dv: 1, fingerprint: 'tests' } })
        const { data: { confirmPhoneActions: [actionBefore] } } = await admin.query(GET_CONFIRM_PHONE_BY_TOKEN, { token })
        const { data: { status } } = await client.mutate(COMPLETE_CONFIRM_PHONE_MUTATION, { token, smsCode: actionBefore.smsCode })
        expect(status).toBe('ok')
        const { data: { confirmPhoneActions: [actionAfter] } }  = await admin.query(GET_CONFIRM_PHONE_BY_TOKEN, { token })
        expect(actionAfter.isPhoneVerified).toBe(true)
    })

    it('marks itself failed when maximum retries number excided', async () => {
        const client = await makeClient()       
        const phone = createTestPhone()
        const { data: { token } }  = await client.mutate(START_CONFIRM_PHONE_MUTATION, { phone, dv: 1, sender: { dv: 1, fingerprint: 'tests' } })
        const admin = await makeLoggedInAdminClient()
        const { data: { confirmPhoneActions: [actionBefore] } } = await admin.query(GET_CONFIRM_PHONE_BY_TOKEN, { token })
        await admin.mutate(UPDATE_CONFIRM_PHONE_ACTION, { id: actionBefore.id, data: { retries: CONFIRM_PHONE_SMS_MAX_RETRIES + 1 } })
        const res = await client.mutate(COMPLETE_CONFIRM_PHONE_MUTATION, { token, smsCode: actionBefore.smsCode })
        expect(JSON.stringify(res.errors)).toContain(CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED)
    })
    
    it('throws error when sms code ttl expires', async () => {
        const client = await makeClient()       
        const phone = createTestPhone()
        const { data: { token } }  = await client.mutate(START_CONFIRM_PHONE_MUTATION, { phone, dv: 1, sender: { dv: 1, fingerprint: 'tests' } })
        const admin = await makeLoggedInAdminClient()
        const { data: { confirmPhoneActions: [actionBefore] } } = await admin.query(GET_CONFIRM_PHONE_BY_TOKEN, { token })
        await admin.mutate(GET_CONFIRM_PHONE_BY_TOKEN, { id: actionBefore.id, data: { smsCodeExpiresAt: actionBefore.smsCodeRequestedAt } })
        const res = await client.mutate(COMPLETE_CONFIRM_PHONE_MUTATION, { token, smsCode: actionBefore.smsCode })
        expect(JSON.stringify(res.errors)).toContain(CONFIRM_PHONE_SMS_CODE_EXPIRED)
    })
        
    it('throws error when confirm phone action expires', async () => {
        const client = await makeClient()       
        const phone = createTestPhone()
        const { data: { token } }  = await client.mutate(START_CONFIRM_PHONE_MUTATION, { phone, dv: 1, sender: { dv: 1, fingerprint: 'tests' } })
        const admin = await makeLoggedInAdminClient()
        const { data: { confirmPhoneActions: [actionBefore] } } = await admin.query(GET_CONFIRM_PHONE_BY_TOKEN, { token })
        await admin.mutate(UPDATE_CONFIRM_PHONE_ACTION, { id: actionBefore.id, data: { expiresAt: actionBefore.requestedAt } })
        const res = await client.mutate(COMPLETE_CONFIRM_PHONE_MUTATION, { token, smsCode: actionBefore.smsCode })
        expect(JSON.stringify(res.errors)).toContain(CONFIRM_PHONE_ACTION_EXPIRED)
    })

    it('gives to Anonymous phone number when he asks with token', async () => {
        const client = await makeClient()       
        const phone = createTestPhone()
        const { data: { token } }  = await client.mutate(START_CONFIRM_PHONE_MUTATION, { phone, dv: 1, sender: { dv: 1, fingerprint: 'tests' } })
        const { data: { phone: phoneFromAction } } = await client.query(GET_PHONE_BY_CONFIRM_PHONE_TOKEN_QUERY, { token })
        expect(phone).toBe(phoneFromAction)
    })

    it('should change sms code when resend is invoked', async () => {
        const client = await makeClient()       
        const phone = createTestPhone()
        const { data: { token } }  = await client.mutate(START_CONFIRM_PHONE_MUTATION, { phone, dv: 1, sender: { dv: 1, fingerprint: 'tests' } })
        const admin = await makeLoggedInAdminClient()
        const { data: { confirmPhoneActions: [actionBefore] } } = await admin.query(GET_CONFIRM_PHONE_BY_TOKEN, { token })
        expect(actionBefore.smsCode).toBeGreaterThan(0)
        await client.mutate(RESEND_CONFIRM_PHONE_SMS_MUTATION, { token, sender: { dv: 1, fingerprint: 'tests' } })
        const { data: { confirmPhoneActions: [actionAfter] } } = await admin.query(GET_CONFIRM_PHONE_BY_TOKEN, { token })
        expect(actionAfter.smsCode).toBeGreaterThan(0)
        expect(actionAfter.smsCode).not.toEqual(actionBefore.smsCode)        
    })

})
