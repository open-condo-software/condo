const { createValidRuClassificationCode } = require('@condo/domains/banking/utils/testSchema/bankAccount')
const { validateClassificationCode } = require('@condo/domains/banking/utils/validate/classificationCode.utils')
const { SPACE_SYMBOLS, SPACE_SYMBOL_LABLES } = require('@condo/domains/common/utils/string.utils')

const SPACES = SPACE_SYMBOLS.split('')


describe('validateClassificationCode', () => {
    describe('Ru', () => {

        const COUNTRY_CODE_RU = 'ru'
        const VALID_RU_CLASSIFICATION_CODE = ['90205039900060030131', '18205049900160030200', '15305036900250030200']
        const WRONG_LENGTH_RU_CLASSIFICATION_CODE = '902050399000600301311'
        const WRONG_FORMAT_RU_CLASSIFICATION_CODE = 'A0205039900060030131'

        VALID_RU_CLASSIFICATION_CODE.forEach(code => {
            test(`should pass if valid: (${code})`, () => {
                const { result } = validateClassificationCode(code, COUNTRY_CODE_RU)
                expect(result).toBe(true)
            })

            SPACES.forEach(spaceSymbol => {
                test(`should pass if valid: (${code}) with spaces symbol (${SPACE_SYMBOL_LABLES[spaceSymbol] || spaceSymbol})`, () => {
                    const classificationCodeValue = `${spaceSymbol}${code}${spaceSymbol}`

                    const { result } = validateClassificationCode(classificationCodeValue, COUNTRY_CODE_RU)
                    expect(result).toBe(true)
                })
            })
        })

        test('classification code from generator should pass', () => {
            const code = createValidRuClassificationCode()
            const { result } = validateClassificationCode(code, COUNTRY_CODE_RU)
            expect(result).toBe(true)
        })

        test('should fail if has wrong length', () => {
            const { result, errors } = validateClassificationCode(WRONG_LENGTH_RU_CLASSIFICATION_CODE, COUNTRY_CODE_RU)
            expect(result).toBe(false)
            expect(errors[0]).toBe('Classification code length was expected to be 20, but received 21')
        })
        test('should fail if contain invalid chars', () => {
            const { result, errors } = validateClassificationCode(WRONG_FORMAT_RU_CLASSIFICATION_CODE, COUNTRY_CODE_RU)
            expect(result).toBe(false)
            expect(errors[0]).toBe('Classification code can contain only digits')
        })
        test('should fail if empty', () => {
            const { result, errors } = validateClassificationCode('', COUNTRY_CODE_RU)
            expect(result).toBe(false)
            expect(errors[0]).toBe('Classification code is empty')
        })
    })
})