const faker = require('faker')
const { createTestUser, registerNewUser, createTestPhone, createTestEmail, createTestLandlineNumber } = require('@condo/domains/user/utils/testSchema')
const { REGISTER_NEW_USER_MUTATION } = require('@condo/domains/user/gql')
const { EMAIL_ALREADY_REGISTERED_ERROR, PHONE_ALREADY_REGISTERED_ERROR } = require('@condo/domains/user/constants/errors')
const { makeLoggedInAdminClient, makeClient } = require('@core/keystone/test.utils')


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
        expect(JSON.stringify(errors)).toMatch(PHONE_ALREADY_REGISTERED_ERROR)
    })

    test('register user with landline phone number', async () => {
        const client = await makeClient()
        const phone = createTestLandlineNumber()

        const { data, errors } = await registerNewUser(client, { phone }, { raw: true })

        expect(data).toEqual({ 'user': null })
        expect(errors).toMatchObject([{
            message: 'Wrong format of provided phone number',
            name: 'GraphQLError',
            path: ['user'],
            extensions: {
                argument: 'phone',
                code: 'BAD_USER_INPUT',
                correctExample: '+79991234567',
            },
        }])
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
        expect(JSON.stringify(errors)).toMatch(EMAIL_ALREADY_REGISTERED_ERROR)
    })
})
