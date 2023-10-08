const { faker } = require('@faker-js/faker')

const { catchErrorFrom } = require('@open-condo/keystone/test.utils')

const { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } = require('@condo/domains/user/constants/common')
const { GQL_ERRORS } = require('@condo/domains/user/constants/errors')
const { createTestPhone } = require('@condo/domains/user/utils/testSchema')

const { passwordValidations } = require('./validateHelpers')


const expectToThrowError = async (func, error) => {
    await catchErrorFrom(func, ({ extensions }) => {
        expect(extensions.message).toEqual(error.message)
        expect(extensions.type).toEqual(error.type)
    })
}

describe('Validate helpers', () => {
    describe('Password validations', () => {
        describe('valid cases', () => {
            const validCases = [
                ['4 different characters', '1234432112334'],
                ['with space', '123  qwe'],
                ['non-standard password 1', '😀😃😄😁😆😅😂🤣🙃🤯'],
                ['non-standard password 2', '漢字史籀漢字史籀'],
                ['numeric', '1234567890'],
                ['cyrillic', 'йцукенгшщЙЦУКЕНГШ'],
                ['latin', 'qertyuWERTYU'],
                ['symbols', '!@#$%^&*()_'],
                ['combine', '1йq!ЙQ 😀漢'],
                ['random', faker.internet.password()],
                ['random long', faker.internet.password(MAX_PASSWORD_LENGTH)],
                ['random short', faker.internet.password(MIN_PASSWORD_LENGTH)],
                ['contains spaces at start and end', ' 123 456 '],
                ['contains many spaces at start and end', '   123 456   '],
                ['contains spaces at start', ' 123 456'],
                ['contains many spaces at start', '   123 456'],
                ['contains spaces at end', '123 456 '],
                ['contains many spaces at end', '123 456   '],
                ['non-standard contains TAB at start and end', '\t😀😃😄 😆😅😂\t'],
            ]

            test.each(validCases)('%s', async (caseName, password) => {
                expect(await passwordValidations({}, password)).toBeUndefined()
            })
        })

        describe('invalid cases', () => {
            describe('common cases', () => {
                const invalidCases = [
                    ['wrong format', faker.datatype.number(), GQL_ERRORS.WRONG_PASSWORD_FORMAT],
                    ['empty line', '', GQL_ERRORS.INVALID_PASSWORD_LENGTH],
                    ['very short', faker.internet.password(MIN_PASSWORD_LENGTH - 1), GQL_ERRORS.INVALID_PASSWORD_LENGTH],
                    ['very long', faker.internet.password(MAX_PASSWORD_LENGTH + 1), GQL_ERRORS.INVALID_PASSWORD_LENGTH],
                    ['only spaces', '1111111111', GQL_ERRORS.PASSWORD_CONSISTS_OF_SMALL_SET_OF_CHARACTERS],
                    ['few different characters', '12331212312123', GQL_ERRORS.PASSWORD_CONSISTS_OF_SMALL_SET_OF_CHARACTERS],
                    ['non-standard very short', '😀😃😄😁😆😅😂', GQL_ERRORS.INVALID_PASSWORD_LENGTH],
                ]

                test.each(invalidCases)('%s', async (caseName, password, error) => {
                    await expectToThrowError(async () => {
                        await passwordValidations({}, password)
                    }, error)
                })
            })

            describe('cases with email', () => {
                const email = faker.internet.email()
                const invalidCases = [
                    ['password is email', email, GQL_ERRORS.PASSWORD_CONTAINS_EMAIL],
                    ['email + password', email + faker.internet.password(), GQL_ERRORS.PASSWORD_CONTAINS_EMAIL],
                    ['password + email', faker.internet.password() + email, GQL_ERRORS.PASSWORD_CONTAINS_EMAIL],
                    ['uppercase password = email', (faker.internet.password() + email).toUpperCase(), GQL_ERRORS.PASSWORD_CONTAINS_EMAIL],
                ]

                test.each(invalidCases)('%s', async (caseName, password, error) => {
                    await expectToThrowError(async () => {
                        await passwordValidations({}, password, email)
                    }, error)
                })
            })

            describe('cases with phone', () => {
                const phone = createTestPhone()
                const invalidCases = [
                    ['password is phone', phone, GQL_ERRORS.PASSWORD_CONTAINS_PHONE],
                    ['phone + password', phone + faker.internet.password(), GQL_ERRORS.PASSWORD_CONTAINS_PHONE],
                    ['password + phone', faker.internet.password() + phone, GQL_ERRORS.PASSWORD_CONTAINS_PHONE],
                    ['uppercase password = phone', (faker.internet.password() + phone).toUpperCase(), GQL_ERRORS.PASSWORD_CONTAINS_PHONE],
                ]

                test.each(invalidCases)('%s', async (caseName, password, error) => {
                    await expectToThrowError(async () => {
                        await passwordValidations({}, password, null, phone)
                    }, error)
                })
            })
        })
    })
})