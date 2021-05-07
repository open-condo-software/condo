const { makeClient, makeLoggedInAdminClient } = require('@core/keystone/test.utils')
const { SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION } = require('@condo/domains/user/gql')
const { createTestUser } = require('@condo/domains/user/utils/testSchema')

describe('Auth by phone and password', () => {

    test('valid password', async () => {
        const [user, userAttrs] = await createTestUser(await makeLoggedInAdminClient())
        const { phone, password } = userAttrs
        const client = await makeClient()
        const res1 = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, { phone, password })
        expect(res1.errors).toEqual(undefined)
        expect(res1.data.obj.item.id).toEqual(user.id)
    })

    test('not valid password', async () => {
        const [_, userAttrs] = await createTestUser(await makeLoggedInAdminClient())
        const { phone, password } = userAttrs
        const client = await makeClient()
        const res1 = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, { phone, password: password + Math.random() })
        expect(JSON.stringify(res1.errors)).toContain('passwordAuth:secret:mismatch')
    })

    test('not valid phone', async () => {
        const [_, userAttrs] = await createTestUser(await makeLoggedInAdminClient())
        const { phone, password } = userAttrs
        const client = await makeClient()
        const res1 = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, { phone: phone + Math.random(), password })        
        expect(JSON.stringify(res1.errors)).toContain('notfound.error')
    })

})
