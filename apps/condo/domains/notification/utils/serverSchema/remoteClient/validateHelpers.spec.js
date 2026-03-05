const { faker } = require('@faker-js/faker')

const { MAX_DEVICE_KEY_LENGTH, MIN_DEVICE_KEY_LENGTH } = require('@condo/domains/notification/constants/constants')
const { getDeviceKeyValidationError, DEVICE_KEY_VALIDATIONS_ERRORS } = require('@condo/domains/notification/utils/serverSchema/remoteClient/validateHelpers')

describe('Validate helpers', () => {
    describe('deviceKey validations', () => {
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
                ['random long', faker.internet.password(MAX_DEVICE_KEY_LENGTH)],
                ['random short', faker.internet.password(MIN_DEVICE_KEY_LENGTH)],
                ['contains spaces at start and end', ' 123 456 '],
                ['contains many spaces at start and end', '   123 456   '],
                ['contains spaces at start', ' 123 456'],
                ['contains many spaces at start', '   123 456'],
                ['contains spaces at end', '123 456 '],
                ['contains many spaces at end', '123 456   '],
                ['non-standard contains TAB at start and end', '\t😀😃😄 😆😅😂\t'],
            ]

            test.each(validCases)('%s', async (_caseName, deviceKey) => {
                expect(getDeviceKeyValidationError(deviceKey)).toBeNull()
            })
        })

        describe('invalid cases', () => {
            describe('common cases', () => {
                const invalidCases = [
                    ['wrong format', faker.datatype.number(), DEVICE_KEY_VALIDATIONS_ERRORS.WRONG_DEVICE_KEY_FORMAT],
                    ['empty line', '', DEVICE_KEY_VALIDATIONS_ERRORS.INVALID_DEVICE_KEY_LENGTH],
                    ['very short', faker.internet.password(MIN_DEVICE_KEY_LENGTH - 1), DEVICE_KEY_VALIDATIONS_ERRORS.INVALID_DEVICE_KEY_LENGTH],
                    ['very long', faker.internet.password(MAX_DEVICE_KEY_LENGTH + 1), DEVICE_KEY_VALIDATIONS_ERRORS.INVALID_DEVICE_KEY_LENGTH],
                    ['only spaces', '1111111111', DEVICE_KEY_VALIDATIONS_ERRORS.DEVICE_KEY_CONSISTS_OF_SMALL_SET_OF_CHARACTERS],
                    ['few different characters', '12331212312123', DEVICE_KEY_VALIDATIONS_ERRORS.DEVICE_KEY_CONSISTS_OF_SMALL_SET_OF_CHARACTERS],
                    ['non-standard very short', '😀😃😄😁😆😅😂', DEVICE_KEY_VALIDATIONS_ERRORS.INVALID_DEVICE_KEY_LENGTH],
                ]

                test.each(invalidCases)('%s', (_caseName, deviceKey, expectedError) => {
                    expect(getDeviceKeyValidationError(deviceKey)).toEqual(expectedError)
                })
            })

        })
    })
})