const { SPACE_SYMBOLS, SPACE_SYMBOL_LABLES } = require('@condo/domains/common/utils/string.utils')
const { validateTin } = require('@condo/domains/acquiring/utils/validate/tin.utils')
const { createValidTin } = require('@condo/domains/acquiring/utils/testSchema/recipientGenerate')

const SPACES = SPACE_SYMBOLS.split('')

const VALID_TINS = ['1654019570', '6311095616', '500110474504']
const WRONG_LENGTH_TIN = '01234556789'
const WRONG_FORMAT_TIN = '01234b567890'
const INVALID_CONTROL_SUM_TIN_10 = '1234567810'
const INVALID_CONTROL_SUM_TIN_12 = '500110474556'

describe('validateTin()', () => {
    VALID_TINS.forEach(tin => {
        test(`for valid 10 or 12 char RU INN (${tin})`, () => {
            const { result } = validateTin(tin)
            expect(result).toBe(true)
        })

        SPACES.forEach(spaceSymbol => {
            test(`for valid 10 or 12 char RU INN (${tin}) with spaces symbol (${SPACE_SYMBOL_LABLES[spaceSymbol] || spaceSymbol})`, () => {
                const tinValue = `${spaceSymbol}${tin}${spaceSymbol}`

                const { result } = validateTin(tinValue)
                expect(result).toBe(true)
            })
        })
    })

    test('wrong length number as RU INN', () => {
        const { result, errors } = validateTin(WRONG_LENGTH_TIN)
        expect(result).toBe(false)
        expect(errors[0]).toBe('Tin length was expected to be 10 or 12, but received 11')
    })
    test('contains invalid characters as RU INN', () => {
        const { result, errors } = validateTin(WRONG_FORMAT_TIN)
        expect(result).toBe(false)
        expect(errors[0]).toBe('Tin can contain only numeric digits')
    })
    test('for empty value as RU INN', () => {
        const { result, errors } = validateTin('')
        expect(result).toBe(false)
        expect(errors[0]).toBe('Tin is empty')
    })
    test('for invalid control sum as RU INN with 10 characters', () => {
        const { result, errors } = validateTin(INVALID_CONTROL_SUM_TIN_10)
        expect(result).toBe(false)
        expect(errors[0]).toBe('Control sum is not valid for tin')
    })
    test('for invalid control sum as RU INN with 12 characters', () => {
        const { result, errors } = validateTin(INVALID_CONTROL_SUM_TIN_12)
        expect(result).toBe(false)
        expect(errors[0]).toBe('Control sum is not valid for tin')
    })
    test('for create valid RU INN', () => {
        const tin = createValidTin()
        const { result } = validateTin(tin)
        expect(result).toBe(true)
    })
})

module.exports = {
    VALID_TINS,
    WRONG_LENGTH_TIN,
    WRONG_FORMAT_TIN,
    INVALID_CONTROL_SUM_TIN_10,
    INVALID_CONTROL_SUM_TIN_12,
}
