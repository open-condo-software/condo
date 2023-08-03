import { faker } from '@faker-js/faker'

import {
    getFiltersFromQuery,
    is32BitInteger,
    MAX_32BIT_INTEGER,
    MIN_32BIT_INTEGER,
} from '@condo/domains/common/utils/helpers'

describe('Helpers property', () => {
    describe('getFiltersFromQuery', () => {
        describe('it should extract filters from query', () => {
            it('if valid JSON is provided', () => {
                expect(getFiltersFromQuery<{ [key: string]: string }>({ filters: '{"key": "value", "key2": "value"}' })).toStrictEqual({
                    key: 'value',
                    key2: 'value',
                })
            })
            it('if invalid JSON is provided', () => {
                expect(getFiltersFromQuery<{ [key: string]: string }>({ filters: '{"key": value, "key2": value}' })).toStrictEqual({})
            })
        })
    })

    describe('is32BitInteger', () => {
        it('value valid 32bit integer', () => {
            const validInteger = faker.datatype.number({ min: MIN_32BIT_INTEGER, max: MAX_32BIT_INTEGER })

            expect(is32BitInteger(validInteger)).toBeTruthy()
        })

        it('value less than min 32bit integer value', () => {
            const notValidInteger = faker.datatype.number({ min: Number.MIN_SAFE_INTEGER, max: MIN_32BIT_INTEGER - 1 })

            expect(is32BitInteger(notValidInteger)).toBeFalsy()
        })

        it('value greater than 32bit integer', () => {
            const notValidInteger = faker.datatype.number({ min: MAX_32BIT_INTEGER + 1, max: Number.MAX_SAFE_INTEGER })

            expect(is32BitInteger(notValidInteger)).toBeFalsy()
        })

        it('value not a number', () => {
            const notInteger = faker.lorem.word()

            expect(is32BitInteger(notInteger)).toBeFalsy()
        })
    })
})
