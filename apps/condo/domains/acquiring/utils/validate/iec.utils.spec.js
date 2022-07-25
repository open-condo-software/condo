const { SPACE_SYMBOLS, SPACE_SYMBOL_LABLES } = require('@condo/domains/common/utils/string.utils')
const { validateIec } = require('@condo/domains/acquiring/utils/validate/iec.utils')

const SPACES = SPACE_SYMBOLS.split('')

const VALID_IECS = ['173501639', '2179AB218', '11654G965']
const WRONG_LENGTH_IEC = '60814396'
const WRONG_FORMAT_IEC = '123BD3647'

describe('validateIec()', () => {
    VALID_IECS.forEach(iec => {
        test(`for valid RU IEC (${iec})`, () => {
            const { result } = validateIec(iec)
            expect(result).toBe(true)
        })

        SPACES.forEach(spaceSymbol => {
            test(`for valid RU IEC (${iec}) with spaces symbol (${SPACE_SYMBOL_LABLES[spaceSymbol] || spaceSymbol})`, () => {
                const iecValue = `${spaceSymbol}${iec}${spaceSymbol}`

                const { result } = validateIec(iecValue)
                expect(result).toBe(true)
            })
        })
    })

    test('wrong length number as RU IEC', () => {
        const { result, errors } = validateIec(WRONG_LENGTH_IEC)
        expect(result).toBe(false)
        expect(errors[0]).toBe('Iec length was expected to be 9, but received 8')
    })
    test('wrong format as RU IEC', () => {
        const { result, errors } = validateIec(WRONG_FORMAT_IEC)
        expect(result).toBe(false)
        expect(errors[0]).toBe('Invalid iec format')
    })
    test('for empty value as RU IEC', () => {
        const { result, errors } = validateIec('')
        expect(result).toBe(false)
        expect(errors[0]).toBe('Iec is empty')
    })
})

module.exports = {
    VALID_IECS,
    WRONG_LENGTH_IEC,
    WRONG_FORMAT_IEC,
}
