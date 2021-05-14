const { normalizePhone } = require('./phone')

describe('normalizePhone()', () => {
    test('no data', () => {
        expect(normalizePhone()).toBeUndefined()
    })

    test('empty data', () => {
        expect(normalizePhone('')).toBeUndefined()
    })

    test('real phone +7', () => {
        expect(normalizePhone('+7 (906) 808 88 88')).toEqual('+79068088888')
        expect(normalizePhone('(906) 808 88 88')).toBeUndefined()
        expect(normalizePhone('8 (906) 808 88 88')).toBeUndefined()
        expect(normalizePhone('+7 (343) 808 88 88')).toBeUndefined()
    })

    test('real phone +1', () => {
        expect(normalizePhone('+1 817 569 89 00')).toEqual('+18175698900')
        expect(normalizePhone('817 569 89 00')).toBeUndefined()
        expect(normalizePhone('+1 555 555 1234')).toBeUndefined()
    })

    test('random', () => {
        const data = '+1817' + String(Math.random()).slice(2).slice(-7)
        expect(normalizePhone(data)).toEqual(data)
    })
})
