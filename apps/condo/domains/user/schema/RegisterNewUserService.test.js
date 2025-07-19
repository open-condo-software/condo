const { faker } = require('@faker-js/faker')

const {
    makeLoggedInAdminClient,
    makeClient,
    expectToThrowGraphQLRequestError,
    catchErrorFrom,
} = require('@open-condo/keystone/test.utils')
const { expectToThrowGQLError } = require('@open-condo/keystone/test.utils')

const { COMMON_ERRORS } = require('@condo/domains/common/constants/errors')
const { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } = require('@condo/domains/user/constants/common')
const {
    createTestUser,
    registerNewUser,
    createTestPhone,
    createTestEmail,
    createTestLandlineNumber,
    makeClientWithNewRegisteredAndLoggedInUser,
    User,
} = require('@condo/domains/user/utils/testSchema')

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
        await expectToThrowGQLError(
            async () => await registerNewUser(client, { name, phone, password, email }),
            errors.USER_WITH_SPECIFIED_PHONE_ALREADY_EXISTS,
            'user',
        )
    })

    test('user cannot be registered again if phone registered for soft deleted user', async () => {
        const admin = await makeLoggedInAdminClient()
        const [user, userAttrs] = await createTestUser(admin)
        await User.softDelete(admin, user.id)
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
            COMMON_ERRORS.WRONG_PHONE_FORMAT,
            'obj',
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

        await expectToThrowGQLError(
            async () => await registerNewUser(client, { name, phone, password, email }),
            errors.USER_WITH_SPECIFIED_EMAIL_ALREADY_EXISTS,
            'user',
        )
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
            '"data.password"; String cannot represent a non string value',
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

    test('register with no token', async () => {
        const client = await makeClient()

        // TODO(pahaz): DOMA-10368 use expectToThrowGQLError
        await catchErrorFrom(async () => {
            await registerNewUser(client, { confirmPhoneActionToken: null })
        }, ({ errors }) => {
            expect(errors).toMatchObject([{
                name: 'UserInputError',
                message: 'Variable "$data" got invalid value null at "data.confirmPhoneActionToken"; Expected non-nullable type "String!" not to be null.',
                extensions: { code: 'BAD_USER_INPUT' },
            }])
        })
    })

    test('register with empty token', async () => {
        const client = await makeClient()

        await expectToThrowGQLError(
            async () => await registerNewUser(client, { confirmPhoneActionToken: '' }),
            errors.NO_CONFIRM_PHONE_ACTION_TOKEN,
            'user',
        )
    })
})
