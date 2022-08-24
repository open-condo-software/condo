const faker = require('faker')
const { createTestUser, registerNewUser, createTestPhone, createTestEmail, createTestLandlineNumber } = require('@condo/domains/user/utils/testSchema')
const { REGISTER_NEW_USER_MUTATION } = require('@condo/domains/user/gql')
const { makeLoggedInAdminClient, makeClient, makeLoggedInClient, waitFor } = require('@condo/keystone/test.utils')
const { expectToThrowGQLError } = require('@condo/domains/common/utils/testSchema')

const { errors } = require('./RegisterNewUserService')
const { Message } = require('@condo/domains/notification/utils/testSchema')
const { REGISTER_NEW_USER_MESSAGE_TYPE, WELCOME_NEW_USER_MESSAGE_TYPE } = require('../../notification/constants/constants')
const { i18n } = require('@condo/locales/loader')
const { translationStringKeyForEmailSubject } = require('@condo/domains/notification/templates')
const { prepareMessageToSend } = require('@condo/domains/notification/transports/email')
const conf = require('@condo/config')

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

describe('Notifications', () => {
    test('Create new user sent REGISTER_NEW_USER_MESSAGE_TYPE and WELCOME_NEW_USER_MESSAGE_TYPE messages', async () => {
        const [user, attrs] = await registerNewUser(await makeClient())
        const client = await makeLoggedInClient(attrs)

        await waitFor(async () => {
            const messages = await Message.getAll(client, { user: { id: user.id } })
            expect(messages).toHaveLength(2)
            expect(messages[0].processingMeta).not.toBeNull()
            expect(messages[1].processingMeta).not.toBeNull()
            // TODO(pahaz): it looks like we need to arise password
            expect(messages[0]).toMatchObject({
                type: REGISTER_NEW_USER_MESSAGE_TYPE,
                meta: {
                    dv: 1,
                    userId: user.id,
                    userName: attrs.name,
                    userPhone: attrs.phone,
                    userEmail: attrs.email,
                    userPassword: attrs.password,
                },
            })
            expect(messages[1]).toMatchObject({
                type: WELCOME_NEW_USER_MESSAGE_TYPE,
                meta: {
                    dv: 1,
                    userId: user.id,
                    userName: user.name,
                    userPhone: attrs.phone,
                    userEmail: attrs.email,
                },
            })

            const expectedSubject = i18n(translationStringKeyForEmailSubject(WELCOME_NEW_USER_MESSAGE_TYPE),
                { locale: conf.DEFAULT_LOCALE, meta: { userName: attrs.name } })
            const { subject } = await prepareMessageToSend(messages[1])
            expect(subject).toMatch(expectedSubject)
        })
    })
})