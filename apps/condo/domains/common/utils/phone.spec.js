const { faker } = require('@faker-js/faker')
const { max, repeat, get } = require('lodash')
const { countryPhoneData } = require('phone')

const { normalizePhone, maskNormalizedPhone } = require('./phone')


describe('normalizePhone()', () => {
    test('no data', () => {
        expect(normalizePhone()).toBeUndefined()
    })

    test('empty data', () => {
        expect(normalizePhone('')).toBeUndefined()
    })

    test('real phone +7', () => {
        expect(normalizePhone('+7 (906) 808 88 88')).toEqual('+79068088888')
        expect(normalizePhone('+7 (906) 808 88 88', true)).toEqual('+79068088888')
        expect(normalizePhone('(906) 808 88 88')).toBeUndefined()
        expect(normalizePhone('8 (906) 808 88 88')).toBeUndefined()
        expect(normalizePhone('+7 (343) 808 88 88')).toBeUndefined()
    })

    test('real phone +7 landline', () => {
        expect(normalizePhone('+7 (34345) 5 88 88', true)).toEqual('+73434558888')
        expect(normalizePhone('+7 (343) 808 88 88', true)).toEqual('+73438088888')
        expect(normalizePhone('(34345) 5 88 88', true)).toBeUndefined()
        expect(normalizePhone('8 (34345) 5 88 88', true)).toBeUndefined()
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

    test('Countries', () => {
        expect(normalizePhone('+35818000000')).toEqual('+35818000000')
        expect(normalizePhone('+3581800000')).toEqual('+3581800000')
    })

    test('Codes', () => {
        const { country_code, mobile_begin_with, phone_number_lengths } = faker.helpers.arrayElement(countryPhoneData.filter(x => get(x, 'mobile_begin_with.length', 0) > 0))
        const length = max(phone_number_lengths)
        const code = String(faker.helpers.arrayElement(mobile_begin_with))
        const phone = faker.phone.number('+' + country_code + code + repeat('#', length - code.length))
        expect(normalizePhone(phone)).toEqual(phone)
    })

    test('with extra or invalid characters', () => {
        expect(normalizePhone('blah-+7 (906) 808 88 88')).toBeUndefined()
        expect(normalizePhone('1blah+7 (906) 808 88 88')).toBeUndefined()
        expect(normalizePhone('1blah^&*+7 (906) 808 88 88')).toBeUndefined()
        expect(normalizePhone('+7 (906) blah808 88 88')).toBeUndefined()
        expect(normalizePhone('+7 (906) 808 88 88blah')).toBeUndefined()
        expect(normalizePhone('+7 (906) 808 88 88blah1')).toBeUndefined()
        expect(normalizePhone('+7 (906) 808 88 88blah1-')).toBeUndefined()
        expect(normalizePhone('+7 (906) 808 88 88#$%^&*(')).toBeUndefined()
        expect(normalizePhone('+7.906.808.88.88')).toBeUndefined()
        expect(normalizePhone('+7 [906] 808 88 88')).toBeUndefined()
    })

    test('with spaces', () => {
        expect(normalizePhone('+7 906 808 88 88')).toBe('+79068088888')
        expect(normalizePhone('   +7 906 808 88 88')).toBe('+79068088888')
        expect(normalizePhone('+7 906 808 88 88   ')).toBe('+79068088888')
        expect(normalizePhone('    +7 906 808 88 88   ')).toBe('+79068088888')
        expect(normalizePhone('    +   7 9   0   6     8   0 8    8 8 88    ')).toBe('+79068088888')
    })
})

describe('maskNormalizedPhone()', () => {
    const cases = [
        ['+79008007060', '+79*******60'],
        ['79008007060', '79*******60'],
        ['', ''],
        ['1', '1'],
        ['12', '1*'],
        ['123', '1*3'],
        ['1234', '1**4'],
        ['12345', '1***5'],
        ['123456', '1****6'],
        ['1234567', '12***67'],
        ['12345678', '12****78'],
        ['123456789', '12*****89'],
    ]
    test.each(cases)('should work correctly (%p)', (input, output) => {
        expect(maskNormalizedPhone(input)).toBe(output)
    })
})