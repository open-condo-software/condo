const { getEscaped, ESCAPABLE_SYMBOLS, SPACE_SYMBOL_LABLES } = require('./string.utils')
const ESCAPABLE_SYMBOLS_ARRAY = ESCAPABLE_SYMBOLS.split('')

const getTestContents = c => `abcdefg${c}0123456789`

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
