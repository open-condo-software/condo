import { getFiltersFromQuery, humanizeDays } from '@condo/domains/common/utils/helpers'
import dayjs from 'dayjs'
import ruRU from 'dayjs/locale/ru'
import enEN from 'dayjs/locale/en'
import esES from 'dayjs/locale/es'

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
    describe('humanizeDays', () => {
        describe('on Russian', () => {
            beforeAll(() => {
                dayjs.locale(ruRU)
            })
            const cases = [[0, '0 дней'], [1, '1 день'], [44, '44 дня'], [33, '33 дня'], [20, '20 дней'], [100, '100 дней'], [101, '101 день']]
            it.each(cases)('should return human-readable days (%p)', (days, expected) => {
                const result = humanizeDays(Number(days))
                expect(result).toEqual(expected)
            })
        })
        describe('on English', () => {
            beforeAll(() => {
                dayjs.locale(enEN)
            })
            const cases = [[0, '0 days'], [1, '1 day'], [44, '44 days'], [33, '33 days'], [20, '20 days'], [100, '100 days'], [101, '101 days']]
            it.each(cases)('should return human-readable days (%p)', (days, expected) => {
                const result = humanizeDays(Number(days))
                expect(result).toEqual(expected)
            })
        })
        it('should support only "en" and "ru" locales', function () {
            dayjs.locale(esES)
            expect(() => humanizeDays(10)).toThrowError('only "en" or "ru" locales')
        })
        it('days should not be negative', function () {
            dayjs.locale(enEN)
            expect(() => humanizeDays(-10)).toThrowError('days cannot be negative')
        })
    })
})
