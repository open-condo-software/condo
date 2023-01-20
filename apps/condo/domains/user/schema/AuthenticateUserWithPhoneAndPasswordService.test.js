const { gql } = require('graphql-tag')

const { makeClient, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION } = require('@condo/domains/user/gql')
const { createTestUser } = require('@condo/domains/user/utils/testSchema')

describe('Auth by phone and password', () => {
    // We need to check that token is also returned for mobile phones. It's the same as SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION
    const SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION_WITH_TOKEN = gql`
        mutation authenticateUserWithPhoneAndPassword ($phone: String!, $password: String!) {
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
        const { errors } = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, { phone, password: password + Math.random() })
        expect(errors).toMatchObject([{
            message: 'Wrong password',
            name: 'GQLError',
            path: ['obj'],
            extensions: {
                mutation: 'authenticateUserWithPhoneAndPassword',
                message: 'Wrong password',
                code: 'BAD_USER_INPUT',
                type: 'WRONG_PASSWORD',
                variable: ['data', 'password'],
            },
        }])
    })

    test('not valid phone', async () => {
        const admin = await makeLoggedInAdminClient()
        const [, userAttrs] = await createTestUser(admin)
        const { phone, password } = userAttrs
        const client = await makeClient()
        const { errors } = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, { phone: phone + Math.random(), password })
        expect(errors).toMatchObject([{
            message: 'Wrong format of provided phone number',
            name: 'GQLError',
            path: ['obj'],
            extensions: {
                mutation: 'authenticateUserWithPhoneAndPassword',
                code: 'BAD_USER_INPUT',
                type: 'WRONG_PHONE_FORMAT',
                variable: ['data', 'phone'],
            },
        }])
    })
})
