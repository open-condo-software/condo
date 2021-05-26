import { getFiltersFromQuery, formatDate, stripPhone } from '@condo/domains/common/utils/helpers'
import { RU_LOCALE, EN_LOCALE } from '@condo/domains/common/constants/locale'

describe('Helpers property', () => {
    describe('stripPhone', () => {
        it('outputs provided phone number in format of +7123456789', () => {
            expect(stripPhone('+7 (999) 111-22-34')).toBe('+79991112234')
        })
    })

    describe('formatDate', () => {
        describe('ru locale', () => {
            it('returns date and time without year, when provided date belongs to a current year', () => {
                const now = new Date()
                const year = now.getFullYear()
                const intl = { locale: RU_LOCALE }
                expect(formatDate(intl, `${year}-05-26 09:23:27.058000`)).toBe('26 мая 9:23')
            })

            it('returns date and time with year, when provided date belongs to previous year', () => {
                const now = new Date()
                const year = now.getFullYear() - 1
                const intl = { locale: RU_LOCALE }
                expect(formatDate(intl, `${year}-05-26 09:23:27.058000`)).toBe(`26 мая ${year} 9:23`)
            })
        })

        describe('en locale', () => {
            it('returns date in format "D MMM HH:mm", when provided date belongs to a current year', () => {
                const now = new Date()
                const year = now.getFullYear()
                const intl = { locale: EN_LOCALE }
                expect(formatDate(intl, `${year}-05-26 09:23:27.058000`)).toBe('26 May 9:23')
            })

            it('returns date in format "D MMM YYYY HH:mm", when provided date belongs to previous year', () => {
                const now = new Date()
                const year = now.getFullYear() - 1
                const intl = { locale: EN_LOCALE }
                expect(formatDate(intl, `${year}-05-26 09:23:27.058000`)).toBe(`26 May ${year} 9:23`)
            })
        })
    })

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
})
