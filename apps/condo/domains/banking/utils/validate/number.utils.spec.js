const { createValidRuNumber } = require('@condo/domains/banking/utils/testSchema/bankAccount')
const { validateNumber } = require('@condo/domains/banking/utils/validate/number.utils')
const { SPACE_SYMBOLS, SPACE_SYMBOL_LABLES } = require('@condo/domains/common/utils/string.utils')

const SPACES = SPACE_SYMBOLS.split('')


describe('validateNumber', () => {
    describe('Ru', () => {

        const COUNTRY_CODE_RU = 'ru'
        const VALID_RU_ROUTING_NUMBER = '045809749'
        const VALID_NUMBER = [
            {
                number: '40647859100000003330',
                routingNumber: '040033685',
            },
            {
                number: '50300807000000002104',
                routingNumber: '044712578',
            },
        ]
        const WRONG_LENGTH_NUMBER = '4064785910000000333043'
        const WRONG_FORMAT_NUMBER = '4064V85910000D003330'
        const INVALID_CONTROL_SUM_NUMBER = {
            number: '50300807000003002104',
            routingNumber: '044712576',
        }

        VALID_NUMBER.forEach(data => {
            const { number, routingNumber } = data

            test(`should pass if valid: (${number})`, () => {
                const { result } = validateNumber(number, routingNumber, COUNTRY_CODE_RU)
                expect(result).toBe(true)
            })

            SPACES.forEach(spaceSymbol => {
                test(`should pass if valid: (${number}) with spaces symbol (${SPACE_SYMBOL_LABLES[spaceSymbol] || spaceSymbol})`, () => {
                    const numberValue = `${spaceSymbol}${number}${spaceSymbol}`

                    const { result } = validateNumber(numberValue, routingNumber, COUNTRY_CODE_RU)
                    expect(result).toBe(true)
                })
            })
        })
        test('should pass if valid number from generator', () => {
            const number = createValidRuNumber(VALID_RU_ROUTING_NUMBER)
            const { result } = validateNumber(number, VALID_RU_ROUTING_NUMBER)
            expect(result).toBe(true)
        })
        test('should fail if has wrong length', () => {
            const { result, errors } = validateNumber(WRONG_LENGTH_NUMBER, VALID_RU_ROUTING_NUMBER, COUNTRY_CODE_RU)
            expect(result).toBe(false)
            expect(errors[0]).toBe('Number length was expected to be 20, but received 22')
        })
        test('should fail if contains invalid chars', () => {
            const { result, errors } = validateNumber(WRONG_FORMAT_NUMBER, VALID_RU_ROUTING_NUMBER, COUNTRY_CODE_RU)
            expect(result).toBe(false)
            expect(errors[0]).toBe('Number can contain only digits')
        })
        test('should fail if value is empty', () => {
            const { result, errors } = validateNumber('', VALID_RU_ROUTING_NUMBER, COUNTRY_CODE_RU)
            expect(result).toBe(false)
            expect(errors[0]).toBe('Number is empty')
        })
        test('should fail if control sum is wrong', () => {
            const { number, routingNumber } = INVALID_CONTROL_SUM_NUMBER
            const { result, errors } = validateNumber(number, routingNumber, COUNTRY_CODE_RU)
            expect(result).toBe(false)
            expect(errors[0]).toBe('Control sum is not valid for number')
        })
    })
})
