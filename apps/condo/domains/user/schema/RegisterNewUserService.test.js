const faker = require('faker')
const { createTestUser, registerNewUser, createTestPhone, createTestEmail, createTestLandlineNumber } = require('@condo/domains/user/utils/testSchema')
const { REGISTER_NEW_USER_MUTATION } = require('@condo/domains/user/gql')
const { makeLoggedInAdminClient, makeClient } = require('@core/keystone/test.utils')
const { expectToThrowGQLError } = require('@condo/domains/common/utils/testSchema')

const { errors } = require('./RegisterNewUserService')

describe('RegisterNewUserService', () => {
    test('register new user', async () => {
        const client = await makeClient()
        const name = faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}')
        const [user] = await registerNewUser(client, { name })
        expect(user.id).toMatch(/^[0-9a-zA-Z-_]+$/)
        expect(user.name).toMatch(name)
    })

    test('register user with existed phone', async () => {
        const admin = await makeLoggedInAdminClient()
        const [, userAttrs] = await createTestUser(admin)
        const client = await makeClient()
        const name = faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}')
        const password = faker.internet.password()
        const email = createTestEmail()
        const phone = userAttrs.phone
        const dv = 1
        const sender = { dv: 1, fingerprint: 'tests' }
        const { errors } = await client.mutate(REGISTER_NEW_USER_MUTATION, {
            data: {
                dv,
                sender,
                name,
                phone,
                password,
                email,
            },
        })
        expect(errors).toMatchObject([{
            message: 'User with specified phone already exists',
            name: 'GQLError',
            path: ['user'],
            extensions: {
                mutation: 'registerNewUser',
                variable: ['data', 'phone'],
                code: 'BAD_USER_INPUT',
                type: 'NOT_UNIQUE',
            },
        }])
    })

    test('register user with landline phone number', async () => {
        const client = await makeClient()
        const phone = createTestLandlineNumber()

        await expectToThrowGQLError(
            async () => await registerNewUser(client, { phone }),
            errors.WRONG_PHONE_FORMAT,
            'user',
        )
    })

    test('register user with existed email', async () => {
        const admin = await makeLoggedInAdminClient()
        const [, userAttrs] = await createTestUser(admin)
        const client = await makeClient()
        const name = faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}')
        const password = faker.internet.password()
        const email = userAttrs.email
        const phone = createTestPhone()
        const dv = 1
        const sender = { dv: 1, fingerprint: 'tests' }
        const { errors } = await client.mutate(REGISTER_NEW_USER_MUTATION, {
            data: {
                dv,
                sender,
                name,
                phone,
                password,
                email,
            },
        })
        expect(errors).toMatchObject([{
            message: 'User with specified email already exists',
            name: 'GQLError',
            path: ['user'],
            extensions: {
                mutation: 'registerNewUser',
                variable: ['data', 'email'],
                code: 'BAD_USER_INPUT',
                type: 'NOT_UNIQUE',
            },
        }])
    })

    test('register with empty password', async () => {
        const client = await makeClient()
        const name = faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}')
        const password = ''
        await expectToThrowGQLError(
            async () => await registerNewUser(client, { name, password }),
            errors.PASSWORD_IS_TOO_SHORT,
            'user',
        )
    })

    test('register with weak password', async () => {
        const client = await makeClient()
        const name = faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}')
        const password = '123456789'
        await expectToThrowGQLError(
            async () => await registerNewUser(client, { name, password }),
            errors.PASSWORD_IS_FREQUENTLY_USED,
            'user',
        )
    })

    test('register user with short password', async () => {
        const client = await makeClient()
        const name = faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}')
        const password = 'akwfn'

        await expectToThrowGQLError(
            async () => await registerNewUser(client, { name, password }),
            errors.PASSWORD_IS_TOO_SHORT,
            'user',
        )
    })

    test('register with wrong token', async () => {
        const client = await makeClient()
        const confirmPhoneActionToken = faker.datatype.uuid()

        await expectToThrowGQLError(
            async () => await registerNewUser(client, { confirmPhoneActionToken }),
            errors.UNABLE_TO_FIND_CONFIRM_PHONE_ACTION,
            'user',
        )
    })
})
