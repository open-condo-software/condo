const { createValidRuRoutingNumber } = require('@condo/domains/banking/utils/testSchema/bankAccount')
const { validateRoutingNumber } = require('@condo/domains/banking/utils/validate/routingNumber.utils')
const { SPACE_SYMBOLS, SPACE_SYMBOL_LABLES } = require('@condo/domains/common/utils/string.utils')

const SPACES = SPACE_SYMBOLS.split('')


describe('validateRoutingNumber', () => {
    describe('Ru', () => {

        const COUNTRY_CODE_RU = 'ru'
        const VALID_RU_ROUTING_NUMBER = ['045809749', '042612466', '043194972']
        const WRONG_LENGTH_RU_ROUTING_NUMBER = '0484528544'
        const WRONG_FORMAT_RU_ROUTING_NUMBER = '04845B854'
        const WRONG_CODE_COUNTRY_RU_ROUTING_NUMBER = '588453854'

        VALID_RU_ROUTING_NUMBER.forEach(routingNumber => {
            test(`should pass if valid: (${routingNumber})`, () => {
                const { result } = validateRoutingNumber(routingNumber, COUNTRY_CODE_RU)
                expect(result).toBe(true)
            })

            SPACES.forEach(spaceSymbol => {
                test(`should pass if valid: (${routingNumber}) with spaces symbol (${SPACE_SYMBOL_LABLES[spaceSymbol] || spaceSymbol})`, () => {
                    const routingNumberValue = `${spaceSymbol}${routingNumber}${spaceSymbol}`

                    const { result } = validateRoutingNumber(routingNumberValue, COUNTRY_CODE_RU)
                    expect(result).toBe(true)
                })
            })
        })

        test('routing number from generator should pass', () => {
            const routingNumber = createValidRuRoutingNumber()
            const { result } = validateRoutingNumber(routingNumber, COUNTRY_CODE_RU)
            expect(result).toBe(true)
        })

        test('should fail if has wrong length', () => {
            const { result, errors } = validateRoutingNumber(WRONG_LENGTH_RU_ROUTING_NUMBER, COUNTRY_CODE_RU)
            expect(result).toBe(false)
            expect(errors[0]).toBe('Routing number length was expected to be 9, but received 10')
        })
        test('should fail if contain invalid chars', () => {
            const { result, errors } = validateRoutingNumber(WRONG_FORMAT_RU_ROUTING_NUMBER, COUNTRY_CODE_RU)
            expect(result).toBe(false)
            expect(errors[0]).toBe('Routing number can contain only digits')
        })
        test('should fail if empty', () => {
            const { result, errors } = validateRoutingNumber('', COUNTRY_CODE_RU)
            expect(result).toBe(false)
            expect(errors[0]).toBe('Routing number is empty')
        })
        test('for wrong country code as Ru routing number', () => {
            const { result, errors } = validateRoutingNumber(WRONG_CODE_COUNTRY_RU_ROUTING_NUMBER, COUNTRY_CODE_RU)
            expect(result).toBe(false)
            expect(errors[0]).toBe('For RU organizations country code is 04, but routing number have 58')
        })
    })
})
