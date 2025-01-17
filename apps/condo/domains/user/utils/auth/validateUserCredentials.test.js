/**
 * @jest-environment node
 */

const index = require('@app/condo/index')

const conf = require('@open-condo/config')
const { makeLoggedInAdminClient, makeClient } = require('@open-condo/keystone/test.utils')
const { setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { registerNewUser } = require('@condo/domains/user/utils/testSchema')

const { validateUserCredentials } = require('./validateUserCredentials')

const {
    makeClientWithSupportUser,
    makeClientWithStaffUser,
    makeClientWithResidentUser,
    makeClientWithServiceUser,
    createTestUser,
} = require('../testSchema')


setFakeClientMode(index, { excludeApps: ['NextApp'] })

describe('function "validateUserCredentials"', () => {
    let adminClient

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
    })

    test('should correct work', async () => {
        const [registeredUser, userAttrs] = await registerNewUser(adminClient)
        console.log('qwas:::', { adminClient })
        const res = await validateUserCredentials({ phone: userAttrs.phone, userType: 'staff' }, { password: userAttrs.password })
        console.log('asdads:::', { res })
        expect(res).toBeDefined()
    })
})
