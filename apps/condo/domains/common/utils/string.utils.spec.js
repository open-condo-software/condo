const { compareStrI, getEscaped, ESCAPABLE_SYMBOLS, SPACE_SYMBOL_LABLES } = require('./string.utils')
const ESCAPABLE_SYMBOLS_ARRAY = ESCAPABLE_SYMBOLS.split('')

const getTestContents = c => `abcdefg${c}0123456789`

afterAll( () => {
    if (global.gc) {
        global.gc()
    }
})

describe('getEscaped()', () => {
    describe('escapes all escapable symbols correctly', () => {

        for (const c of ESCAPABLE_SYMBOLS_ARRAY) {
            const label = SPACE_SYMBOL_LABLES[c] || c

            test(`${label} => \\${label}`, () => {
                const escaped = getEscaped(getTestContents(c))

                expect(escaped).toEqual(getTestContents(`\\${c}`))
            })
        }
    })
})

describe('compareStrI()', () => {
    describe('compares strings correctly', () => {
        const str1 = '  Привет однако!'
        const str2 = 'пРИВЕТ оДнАкО!    '
        const str3 = 'привет однако.'

        expect(compareStrI(str1, str2)).toBeTruthy()
        expect(compareStrI(str1, str3)).toBeFalsy()
        expect(compareStrI(str2, str3)).toBeFalsy()
    })
})
