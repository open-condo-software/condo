const { faker } = require('@faker-js/faker')
const { gql } = require('graphql-tag')

const {
    makeClient,
    makeLoggedInAdminClient,
} = require('@open-condo/keystone/test.utils')

const { SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION } = require('@condo/domains/user/gql')
const { createTestUser, User, createTestPhone } = require('@condo/domains/user/utils/testSchema')

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

    test('soft deleted user cannot be authorized', async () => {
        const admin = await makeLoggedInAdminClient()
        const [user, userAttrs] = await createTestUser(admin)
        const { phone, password } = userAttrs
        const [deletedUser] = await User.softDelete(admin, user.id)
        expect(deletedUser.deletedAt).not.toBeNull()
        const client = await makeClient()
        const res = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION_WITH_TOKEN, { phone, password })
        expect(res.data.obj).toBeNull()
        expect(res.errors[0].message).toBe('Wrong phone or password')
    })

    test('user without password cannot be authorized', async () => {
        const admin = await makeLoggedInAdminClient()
        const [, userAttrs] = await createTestUser(admin, { password: undefined })
        const { phone } = userAttrs
        const client = await makeClient()
        const res = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION_WITH_TOKEN, { phone, password: '' })
        expect(res.data.obj).toBeNull()
        expect(res.errors[0].message).toBe('Wrong phone or password')
    })

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

    test('not valid credentials (phone)', async () => {
        const admin = await makeLoggedInAdminClient()
        const [, userAttrs] = await createTestUser(admin)
        const { password } = userAttrs
        const client = await makeClient()
        const { errors } = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, {
            phone: createTestPhone(),
            password,
        })
        expect(errors).toMatchObject([{
            message: 'Wrong phone or password',
            name: 'GQLError',
            path: ['obj'],
            extensions: {
                mutation: 'authenticateUserWithPhoneAndPassword',
                message: 'Wrong phone or password',
                code: 'BAD_USER_INPUT',
                type: 'WRONG_CREDENTIALS',
            },
        }])
    })

    test('not valid credentials (password)', async () => {
        const admin = await makeLoggedInAdminClient()
        const [, userAttrs] = await createTestUser(admin)
        const { phone, password } = userAttrs
        const client = await makeClient()
        const { errors } = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, {
            phone,
            password: password + Math.random(),
        })
        expect(errors).toMatchObject([{
            message: 'Wrong phone or password',
            name: 'GQLError',
            path: ['obj'],
            extensions: {
                mutation: 'authenticateUserWithPhoneAndPassword',
                message: 'Wrong phone or password',
                code: 'BAD_USER_INPUT',
                type: 'WRONG_CREDENTIALS',
            },
        }])
    })

    test('not valid phone', async () => {
        const admin = await makeLoggedInAdminClient()
        const [, userAttrs] = await createTestUser(admin)
        const { phone, password } = userAttrs
        const client = await makeClient()
        const { errors } = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, {
            phone: phone + Math.random(),
            password,
        })
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

    test('ip guard works fine', async () => {
        const client = await makeClient()

        for await (const i of Array.from(Array(11).keys())) {
            const phone = createTestPhone()
            const password = faker.datatype.string(42)

            const { errors } = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, { phone, password })

            if (i === 10) {
                expect(errors).toHaveLength(1)
                expect(errors[0]).toMatchObject(expect.objectContaining({
                    message: expect.stringMatching(/You have to wait \d{1,4} seconds to be able to send request again/),
                }))
            } else {
                expect(errors).toHaveLength(1)
                expect(errors[0]).toMatchObject(expect.objectContaining({
                    message: 'Wrong phone or password',
                }))
            }
        }
    })
})
