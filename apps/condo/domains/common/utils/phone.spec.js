const { faker } = require('@faker-js/faker')
const { max, repeat, get } = require('lodash')
const { countryPhoneData } = require('phone')

const { normalizePhone } = require('./phone')

describe('normalizePhone()', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
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
})
