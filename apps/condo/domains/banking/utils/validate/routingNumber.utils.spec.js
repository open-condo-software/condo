const { SPACE_SYMBOLS, SPACE_SYMBOL_LABLES } = require('@condo/domains/common/utils/string.utils')
const { validateRoutingNumber } = require('@condo/domains/banking/utils/validate/routingNumber.utils')
const { createValidRuRoutingNumber } = require('@condo/domains/banking/utils/testSchema/bankAccountGenerate')

const SPACES = SPACE_SYMBOLS.split('')

const COUNTRY_CODE_RU = 'ru'
const VALID_RU_ROUTING_NUMBER = ['045809749', '042612466', '043194972']
const WRONG_LENGTH_RU_ROUTING_NUMBER = '0484528544'
const WRONG_FORMAT_RU_ROUTING_NUMBER = '04845B854'
const WRONG_CODE_COUNTRY_RU_ROUTING_NUMBER = '588453854'


describe('validateRoutingNumber', () => {
    VALID_RU_ROUTING_NUMBER.forEach(routingNumber => {
        test(`for valid RU ROUTING NUMBER (${routingNumber})`, () => {
            const { result } = validateRoutingNumber(routingNumber, COUNTRY_CODE_RU)
            expect(result).toBe(true)
        })

        SPACES.forEach(spaceSymbol => {
            test(`for valid RU ROUTING NUMBER (${routingNumber}) with spaces symbol (${SPACE_SYMBOL_LABLES[spaceSymbol] || spaceSymbol})`, () => {
                const routingNumberValue = `${spaceSymbol}${routingNumber}${spaceSymbol}`

                const { result } = validateRoutingNumber(routingNumberValue, COUNTRY_CODE_RU)
                expect(result).toBe(true)
            })
        })
    })

    test('for wrong length number as RU ROUTING NUMBER', () => {
        const { result, errors } = validateRoutingNumber(WRONG_LENGTH_RU_ROUTING_NUMBER, COUNTRY_CODE_RU)
        expect(result).toBe(false)
        expect(errors[0]).toBe('Routing number length was expected to be 9, but received 10')
    })
    test('for contains invalid characters as RU ROUTING NUMBER', () => {
        const { result, errors } = validateRoutingNumber(WRONG_FORMAT_RU_ROUTING_NUMBER, COUNTRY_CODE_RU)
        expect(result).toBe(false)
        expect(errors[0]).toBe('Routing number can contain only digits')
    })
    test('for empty value as RU ROUTING NUMBER', () => {
        const { result, errors } = validateRoutingNumber('', COUNTRY_CODE_RU)
        expect(result).toBe(false)
        expect(errors[0]).toBe('Routing number is empty')
    })
    test('for create valid RU ROUTING NUMBER', () => {
        const routingNumber = createValidRuRoutingNumber()
        const { result } = validateRoutingNumber(routingNumber, COUNTRY_CODE_RU)
        expect(result).toBe(true)
    })
    test('for wrong country code as RU ROUTING NUMBER', () => {
        const { result, errors } = validateRoutingNumber(WRONG_CODE_COUNTRY_RU_ROUTING_NUMBER, COUNTRY_CODE_RU)
        expect(result).toBe(false)
        expect(errors[0]).toBe('For RU organizations country code is 04, but routing number have 58')
    })
})

module.exports = {
    VALID_RU_ROUTING_NUMBER,
    WRONG_LENGTH_RU_ROUTING_NUMBER,
    WRONG_FORMAT_RU_ROUTING_NUMBER,
}
