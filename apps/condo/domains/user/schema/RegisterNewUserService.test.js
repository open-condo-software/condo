const { faker } = require('@faker-js/faker')

const { makeLoggedInAdminClient, makeClient, expectToThrowGraphQLRequestError } = require('@open-condo/keystone/test.utils')
const { expectToThrowGQLError } = require('@open-condo/keystone/test.utils')

const { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } = require('@condo/domains/user/constants/common')
const { REGISTER_NEW_USER_MUTATION } = require('@condo/domains/user/gql')
const { createTestUser, registerNewUser, createTestPhone, createTestEmail, createTestLandlineNumber, makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

const { errors } = require('./RegisterNewUserService')


describe('RegisterNewUserService', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
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
        await expectToThrowGQLError(
            async () => await registerNewUser(client, { name, phone, password, email }),
            errors.USER_WITH_SPECIFIED_PHONE_ALREADY_EXISTS,
            'user',
        )
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
            errors.INVALID_PASSWORD_LENGTH,
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

    test('register user with wrong format password', async () => {
        const client = await makeClient()
        const name = faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}')
        const password = faker.datatype.number()

        await expectToThrowGraphQLRequestError(
            async () => await registerNewUser(client, { name, password }),
            '"data.password"; String cannot represent a non string value'
        )
    })

    test('register user with short password', async () => {
        const client = await makeClient()
        const name = faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}')
        const password = faker.internet.password(MIN_PASSWORD_LENGTH - 1)

        await expectToThrowGQLError(
            async () => await registerNewUser(client, { name, password }),
            errors.INVALID_PASSWORD_LENGTH,
            'user',
        )
    })

    test('register user with password starting or ending with a space', async () => {
        const client = await makeClientWithNewRegisteredAndLoggedInUser()
        const name = faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}')
        const password = '  ' + faker.internet.password() + '  '

        const [user] = await registerNewUser(client, { name, password })
        expect(user.name).toBe(name)
    })

    test('register user with very long password', async () => {
        const client = await makeClientWithNewRegisteredAndLoggedInUser()
        const name = faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}')
        const password = faker.internet.password(MAX_PASSWORD_LENGTH + 1)

        await expectToThrowGQLError(
            async () => await registerNewUser(client, { name, password }),
            errors.INVALID_PASSWORD_LENGTH,
            'user',
        )
    })

    test('register user with password that does not containing at least 4 different characters', async () => {
        const client = await makeClientWithNewRegisteredAndLoggedInUser()
        const name = faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}')
        const password = '12331212312123'

        await expectToThrowGQLError(
            async () => await registerNewUser(client, { name, password }),
            errors.PASSWORD_CONSISTS_OF_SMALL_SET_OF_CHARACTERS,
            'user',
        )
    })

    test('register user with password containing email', async () => {
        const client = await makeClientWithNewRegisteredAndLoggedInUser()
        const name = faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}')
        const email = faker.internet.exampleEmail()
        const password = email + faker.internet.password()

        await expectToThrowGQLError(
            async () => await registerNewUser(client, { name, password, email }),
            errors.PASSWORD_CONTAINS_EMAIL,
            'user',
        )
    })

    test('register user with password containing phone', async () => {
        const client = await makeClientWithNewRegisteredAndLoggedInUser()
        const name = faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}')
        const phone = createTestPhone()
        const password = phone + faker.internet.password()

        await expectToThrowGQLError(
            async () => await registerNewUser(client, { name, password, phone }),
            errors.PASSWORD_CONTAINS_PHONE,
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
