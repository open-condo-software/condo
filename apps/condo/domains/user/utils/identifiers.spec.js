const { faker } = require('@faker-js/faker')

const { IPv4_TYPE, UUID_TYPE, PHONE_TYPE } = require('@condo/domains/user/constants/identifiers')
const { createTestPhone } = require('@condo/domains/user/utils/testSchema')

const { getIdentifierType } = require('./identifiers')

describe('User identifiers utils', () => {
    describe('getIdentifierType', () => {
        const SAMPLES_COUNT = 1000
        const UUID_SAMPLES = Array.from({ length: SAMPLES_COUNT }, () => faker.datatype.uuid())
        const IPv4_SAMPLES = Array.from({ length: SAMPLES_COUNT }, () => faker.internet.ipv4())
        const PHONE_SAMPLES = Array.from({ length: SAMPLES_COUNT }, () => createTestPhone())
        const OTHER_SAMPLES = Array.from({ length: SAMPLES_COUNT }, () => faker.datatype.string())

        test('Must correctly detect UUIDs', () => {
            for (const uuid of UUID_SAMPLES) {
                expect(getIdentifierType(uuid)).toEqual(UUID_TYPE)
            }
        })

        test('Must correctly detect IPs', () => {
            for (const ip of IPv4_SAMPLES) {
                expect(getIdentifierType(ip)).toEqual(IPv4_TYPE)
            }
        })

        test('Must correctly detect phones', () => {
            for (const phone of PHONE_SAMPLES) {
                expect(getIdentifierType(phone)).toEqual(PHONE_TYPE)
            }
        })

        test('Must return null if nothing detected', () => {
            for (const someString of OTHER_SAMPLES) {
                expect(getIdentifierType(someString)).toBeNull()
            }
        })
    })
})