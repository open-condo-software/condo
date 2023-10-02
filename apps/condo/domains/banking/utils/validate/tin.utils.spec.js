const { createValidRuTin10, createValidRuTin12 } = require('@condo/domains/banking/utils/testSchema/bankAccount')
const { validateTin } = require('@condo/domains/banking/utils/validate/tin.utils')
const { SPACE_SYMBOLS, SPACE_SYMBOL_LABLES } = require('@condo/domains/common/utils/string.utils')

const SPACES = SPACE_SYMBOLS.split('')

describe('validateTin', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
    describe('Ru', () => {

        const COUNTRY_CODE_RU = 'ru'
        const VALID_RU_TINS = ['1654019570', '6311095616', '500110474504']
        const WRONG_LENGTH_TIN = '01234556789'
        const WRONG_FORMAT_TIN = '01234b567890'
        const INVALID_CONTROL_SUM_TIN_10 = '1234567810'
        const INVALID_CONTROL_SUM_TIN_12 = '500110474556'

        VALID_RU_TINS.forEach(tin => {
            test(`should pass for valid 10 or 12 char INN (${tin})`, () => {
                const { result } = validateTin(tin, COUNTRY_CODE_RU)
                expect(result).toBe(true)
            })

            SPACES.forEach(spaceSymbol => {
                test(`should pass for valid 10 or 12 char INN (${tin}) with spaces symbol (${SPACE_SYMBOL_LABLES[spaceSymbol] || spaceSymbol})`, () => {
                    const tinValue = `${spaceSymbol}${tin}${spaceSymbol}`

                    const { result } = validateTin(tinValue, COUNTRY_CODE_RU)
                    expect(result).toBe(true)
                })
            })
        })
        test('should pass for valid 10 number INN', () => {
            const tin = createValidRuTin10()
            const { result } = validateTin(tin, COUNTRY_CODE_RU)
            expect(result).toBe(true)
        })
        test('should pass for valid 12 number INN', () => {
            const tin = createValidRuTin12()
            const { result } = validateTin(tin, COUNTRY_CODE_RU)
            expect(result).toBe(true)
        })
        test('should fail for invalid length', () => {
            const { result, errors } = validateTin(WRONG_LENGTH_TIN, COUNTRY_CODE_RU)
            expect(result).toBe(false)
            expect(errors[0]).toBe('Ru tin length was expected to be 10 or 12, but received 11')
        })
        test('should fail for invalid chars', () => {
            const { result, errors } = validateTin(WRONG_FORMAT_TIN, COUNTRY_CODE_RU)
            expect(result).toBe(false)
            expect(errors[0]).toBe('Tin can contain only digits')
        })
        test('should fail for empty', () => {
            const { result, errors } = validateTin('', COUNTRY_CODE_RU)
            expect(result).toBe(false)
            expect(errors[0]).toBe('Tin is empty')
        })
        test('should fail because of invalid control sum for invalid INN with 10 chars', () => {
            const { result, errors } = validateTin(INVALID_CONTROL_SUM_TIN_10, COUNTRY_CODE_RU)
            expect(result).toBe(false)
            expect(errors[0]).toBe('Control sum is not valid for tin')
        })
        test('should fail because of invalid control sum for invalid INN with 12 chars', () => {
            const { result, errors } = validateTin(INVALID_CONTROL_SUM_TIN_12, COUNTRY_CODE_RU)
            expect(result).toBe(false)
            expect(errors[0]).toBe('Control sum is not valid for tin')
        })
    })
})
