
const { makeLoggedInAdminClient, makeClient } = require('@core/keystone/test.utils')
const { expectToThrowAccessDeniedErrorToObj } = require('@condo/domains/common/utils/testSchema')

const { ChangePhoneNumberResidentUserService } = require('@condo/domains/user/utils/testSchema')

describe('ChangePhoneNumberResidentUserService', () => {
    describe('Anonymous', () => {
        it('can not change phone with token', async () => {
            const client = await makeClient()
        })
    })
    describe('User', () => {
        it('can not change phone if current phone is not confirmed', async () => {
            //
        })
        it('can change phone with valid token', async () => {
            //
        })
        it('can not change phone if token is used', async () => {
            //
        })
        it('can not change phone if token is not confirmed', async () => {
            //
        })
        it('can not change phone if token is expired', async () => {
            //
        })
    })
})
