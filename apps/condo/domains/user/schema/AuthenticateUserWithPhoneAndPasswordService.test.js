const { makeClient, makeLoggedInAdminClient } = require('@core/keystone/test.utils')
const { SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION } = require('@condo/domains/user/gql')
const { createTestUser } = require('@condo/domains/user/utils/testSchema')
const { WRONG_EMAIL_ERROR, WRONG_PASSWORD_ERROR } = require('@condo/domains/user/constants/errors')
const { gql } = require('graphql-tag')

describe('Auth by phone and password', () => {
    // We need to check that token is also returned for mobile phones. It's the same as SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION
    const SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION_WITH_TOKEN = gql`
        mutation authenticateUserWithPhoneAndPassword($phone: String!, $password: String!) {
            obj: authenticateUserWithPhoneAndPassword(data: { phone: $phone, password: $password }) {
                item {
                    id
                }
                token
            }
        }
    `
    test('valid password', async () => {
        const admin = await makeLoggedInAdminClient()
        const [user, userAttrs] = await createTestUser(admin)
        const { phone, password } = userAttrs
        const client = await makeClient()
        const res1 = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION_WITH_TOKEN, { phone, password })
        expect(res1.errors).toEqual(undefined)
        expect(res1.data.obj.item.id).toEqual(user.id)
        expect(res1.data.obj.token).not.toHaveLength(0)
    })

    test('not valid password', async () => {
        const admin = await makeLoggedInAdminClient()
        const [, userAttrs] = await createTestUser(admin)
        const { phone, password } = userAttrs
        const client = await makeClient()
        const res1 = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, { phone, password: password + Math.random() })
        expect(JSON.stringify(res1.errors)).toContain(WRONG_PASSWORD_ERROR)
    })

    test('not valid phone', async () => {
        const admin = await makeLoggedInAdminClient()
        const [, userAttrs] = await createTestUser(admin)
        const { phone, password } = userAttrs
        const client = await makeClient()
        const res1 = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, { phone: phone + Math.random(), password })
        expect(JSON.stringify(res1.errors)).toContain(WRONG_EMAIL_ERROR)
    })
})
