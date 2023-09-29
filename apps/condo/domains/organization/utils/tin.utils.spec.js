const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { SPACE_SYMBOLS, SPACE_SYMBOL_LABLES } = require('@condo/domains/common/utils/string.utils')
const { isValidTin } = require('@condo/domains/organization/utils/tin.utils')

const SPACES = SPACE_SYMBOLS.split('')
const VALID_RU_TIN_10 = '1654019570'
const VALID_RU_TIN_10_1 = '6311095616'
const VALID_RU_TIN_12 = '500110474504'
const VALID_TINS = [VALID_RU_TIN_10, VALID_RU_TIN_10_1, VALID_RU_TIN_12]
const INVALID_RU_TIN_10 = '01234556789'
const INVALID_RU_TIN_12 = '0123455678901'
const SOME_RANDOM_LETTERS = 'ABCDEFGHIJ'

describe('isValidTin()', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
    VALID_TINS.forEach(tin => {
        test(`for valid 10 or 12 char RU INN (${tin})`, () => {
            expect(isValidTin(tin, RUSSIA_COUNTRY)).toBe(true)
        })
        SPACES.forEach(spaceSymbol => {
            test(`for valid 10 or 12 char RU INN (${tin}) with spaces symbol (${SPACE_SYMBOL_LABLES[spaceSymbol] || spaceSymbol})`, () => {
                const tinValue = `${spaceSymbol}${tin}${spaceSymbol}`

                expect(isValidTin(tinValue, RUSSIA_COUNTRY)).toBe(true)
            })
        })
    })
    test('for valid 12 char RU INN ', () => {
        // NOTE: we need INNs only for organizations, that is of 10 chars length.
        // So valid 12 char length person INN doesn`t suit
        expect(isValidTin(VALID_RU_TIN_12, RUSSIA_COUNTRY)).toBe(true)
    })
    test('for invalid 10 digits as RU INN', () => {
        expect(isValidTin(INVALID_RU_TIN_10, RUSSIA_COUNTRY)).toBe(false)
    })
    test('for invalid 12 digits as RU INN', () => {
        expect(isValidTin(INVALID_RU_TIN_12, RUSSIA_COUNTRY)).toBe(false)
    })
    test('for invalid random letters as RU INN', () => {
        expect(isValidTin(SOME_RANDOM_LETTERS, RUSSIA_COUNTRY)).toBe(false)
    })
    test('for invalid random wrong length number as RU INN', () => {
        expect(isValidTin(Math.floor(999 + Math.random() * 1000000), RUSSIA_COUNTRY)).toBe(false)
    })
})

module.exports = {
    VALID_RU_TIN_10,
    VALID_RU_TIN_12,
    INVALID_RU_TIN_10,
    INVALID_RU_TIN_12,
    SOME_RANDOM_LETTERS,
}
